import { Hono } from "hono";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { testTable, conversationTable, faqIndexTable } from "./db/schema";
import { eq, like, or, sql } from "drizzle-orm";

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "JustinCourse Knowledge Base Assistant",
		version: "2.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);

		// Search WordPress posts
		this.server.tool(
			"search_wordpress_posts",
			{
				keywords: z.string().describe("Keywords to search in posts"),
				search_in: z.enum(["title", "content", "all"]).optional().describe("Where to search: title, content, or all"),
				per_page: z.number().optional().default(10).describe("Number of results per page (max 100)"),
			},
			async ({ keywords, search_in = "all", per_page = 10 }) => {
				try {
					const baseUrl = "https://app.justincourse.com/wp-json/wp/v2/posts";
					const params = new URLSearchParams({
						search: keywords,
						per_page: String(Math.min(per_page, 100)),
						_embed: "1", // Include featured media and other embeds
					});

					const response = await fetch(`${baseUrl}?${params.toString()}`);

					if (!response.ok) {
						return {
							content: [{
								type: "text",
								text: `Error: WordPress API returned ${response.status} - ${response.statusText}`,
							}],
						};
					}

					const posts = await response.json() as any[];

					if (posts.length === 0) {
						return {
							content: [{
								type: "text",
								text: `No posts found matching "${keywords}"`,
							}],
						};
					}

					// Format the results
					const formattedResults = posts.map((post: any) => {
						const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim() || "No excerpt";
						const categories = post._embedded?.["wp:term"]?.[0]?.map((cat: any) => cat.name).join(", ") || "Uncategorized";
						const tags = post._embedded?.["wp:term"]?.[1]?.map((tag: any) => tag.name).join(", ") || "No tags";

						return `
📄 **${post.title.rendered}**
🔗 Link: ${post.link}
📅 Published: ${new Date(post.date).toLocaleDateString()}
📁 Categories: ${categories}
🏷️  Tags: ${tags}
📝 Excerpt: ${excerpt.substring(0, 200)}${excerpt.length > 200 ? "..." : ""}
`;
					}).join("\n---\n");

					return {
						content: [{
							type: "text",
							text: `Found ${posts.length} post(s) matching "${keywords}":\n\n${formattedResults}`,
						}],
					};
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `Error searching WordPress: ${error instanceof Error ? error.message : String(error)}`,
						}],
					};
				}
			},
		);

		// List FAQ documents from D1 index
		this.server.tool(
			"list_faq_documents",
			{
				keywords: z.string().optional().describe("Keywords to filter FAQ documents"),
				limit: z.number().optional().default(20).describe("Maximum number of results"),
			},
			async ({ keywords, limit = 20 }) => {
				try {
					const db = drizzle(this.env.DB);

					let query = db.select().from(faqIndexTable);

					if (keywords) {
						const searchPattern = `%${keywords}%`;
						query = query.where(
							or(
								like(faqIndexTable.title, searchPattern),
								like(faqIndexTable.description, searchPattern),
								like(faqIndexTable.tags, searchPattern)
							)
						) as any;
					}

					const results = await query.limit(limit).all();

					if (results.length === 0) {
						return {
							content: [{
								type: "text",
								text: keywords
									? `No FAQ documents found matching "${keywords}"`
									: "No FAQ documents found in the database",
							}],
						};
					}

					const formattedResults = results.map((doc: any) => {
						const tags = doc.tags ? JSON.parse(doc.tags).join(", ") : "No tags";
						return `
📚 **${doc.title}**
📄 File: ${doc.fileName}
🏷️  Tags: ${tags}
📝 Description: ${doc.description || "No description"}
🆔 ID: ${doc.id}
`;
					}).join("\n---\n");

					return {
						content: [{
							type: "text",
							text: `Found ${results.length} FAQ document(s)${keywords ? ` matching "${keywords}"` : ""}:\n\n${formattedResults}\n\n💡 Use get_faq_document with the ID to read the full content.`,
						}],
					};
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `Error listing FAQ documents: ${error instanceof Error ? error.message : String(error)}`,
						}],
					};
				}
			},
		);

		// Get FAQ document detail from R2
		this.server.tool(
			"get_faq_document",
			{
				id: z.number().describe("The ID of the FAQ document from the index"),
			},
			async ({ id }) => {
				try {
					const db = drizzle(this.env.DB);

					const result = await db.select()
						.from(faqIndexTable)
						.where(eq(faqIndexTable.id, id))
						.limit(1);

					if (result.length === 0) {
						return {
							content: [{
								type: "text",
								text: `Error: FAQ document with ID ${id} not found`,
							}],
						};
					}

					const doc = result[0];
					const r2Object = await this.env.R2_BUCKET.get(doc.r2Key);

					if (!r2Object) {
						return {
							content: [{
								type: "text",
								text: `Error: FAQ document file not found in R2 storage (${doc.r2Key})`,
							}],
						};
					}

					const content = await r2Object.text();
					const tags = doc.tags ? JSON.parse(doc.tags).join(", ") : "No tags";
					const lastIndexed = doc.lastIndexed ? new Date(doc.lastIndexed).toLocaleString() : "Never";

					return {
						content: [{
							type: "text",
							text: `# ${doc.title}

**File:** ${doc.fileName}
**Tags:** ${tags}
**Description:** ${doc.description || "No description"}
**Last Indexed:** ${lastIndexed}

---

${content}`,
						}],
					};
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `Error retrieving FAQ document: ${error instanceof Error ? error.message : String(error)}`,
						}],
					};
				}
			},
		);

		// Smart search across both WordPress and FAQ documents
		this.server.tool(
			"search_knowledge_base",
			{
				keywords: z.string().describe("Keywords to search across WordPress posts and FAQ documents"),
				sources: z.enum(["all", "wordpress", "faq"]).optional().default("all").describe("Which sources to search"),
			},
			async ({ keywords, sources = "all" }) => {
				try {
					let wpResults = "";
					let faqResults = "";

					// Search WordPress
					if (sources === "all" || sources === "wordpress") {
						const baseUrl = "https://app.justincourse.com/wp-json/wp/v2/posts";
						const params = new URLSearchParams({
							search: keywords,
							per_page: "5",
							_embed: "1",
						});

						const response = await fetch(`${baseUrl}?${params.toString()}`);

						if (response.ok) {
							const posts = await response.json() as any[];

							if (posts.length > 0) {
								wpResults = posts.map((post: any) => {
									const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim() || "No excerpt";
									return `📄 ${post.title.rendered}\n   🔗 ${post.link}\n   ${excerpt.substring(0, 150)}...`;
								}).join("\n\n");
							}
						}
					}

					// Search FAQ
					if (sources === "all" || sources === "faq") {
						const db = drizzle(this.env.DB);
						const searchPattern = `%${keywords}%`;

						const faqDocs = await db.select()
							.from(faqIndexTable)
							.where(
								or(
									like(faqIndexTable.title, searchPattern),
									like(faqIndexTable.description, searchPattern),
									like(faqIndexTable.tags, searchPattern)
								)
							)
							.limit(5)
							.all();

						if (faqDocs.length > 0) {
							faqResults = faqDocs.map((doc: any) => {
								return `📚 ${doc.title} (ID: ${doc.id})\n   ${doc.description || "No description"}`;
							}).join("\n\n");
						}
					}

					// Combine results
					let output = `🔍 Search results for "${keywords}":\n\n`;

					if (wpResults) {
						output += `## WordPress Posts\n\n${wpResults}\n\n`;
					} else if (sources === "all" || sources === "wordpress") {
						output += `## WordPress Posts\nNo results found.\n\n`;
					}

					if (faqResults) {
						output += `## FAQ Documents\n\n${faqResults}\n\n💡 Use get_faq_document with the ID to read full content.`;
					} else if (sources === "all" || sources === "faq") {
						output += `## FAQ Documents\nNo results found.`;
					}

					return {
						content: [{
							type: "text",
							text: output,
						}],
					};
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `Error searching knowledge base: ${error instanceof Error ? error.message : String(error)}`,
						}],
					};
				}
			},
		);
	}
}

// Create Hono app
const app = new Hono<{ Bindings: Cloudflare.Env }>();

// Health check endpoint
app.get("/", (c) => {
	return c.text("OK - System is healthy");
});

// API endpoint to list all endpoints
app.get("/api", (c) => {
	const endpoints = {
		endpoints: [
			{
				path: "/",
				method: "GET",
				description: "Health check - returns system health status"
			},
			{
				path: "/api",
				method: "GET",
				description: "Lists all available endpoints"
			},
			{
				path: "/api/ask",
				method: "POST",
				description: "AI-powered Q&A with logging to R2 and D1"
			},
			{
				path: "/api/search",
				method: "GET",
				description: "Search across WordPress posts and FAQ documents",
				params: "keywords (required), limit (optional)"
			},
			{
				path: "/api/wordpress/search",
				method: "GET",
				description: "Search WordPress posts",
				params: "keywords (required), per_page (optional)"
			},
			{
				path: "/api/faq/index",
				method: "POST",
				description: "Index FAQ documents from R2 storage"
			},
			{
				path: "/api/faq/list",
				method: "GET",
				description: "List FAQ documents with optional search",
				params: "keywords (optional), limit (optional)"
			},
			{
				path: "/api/faq/:id",
				method: "GET",
				description: "Get FAQ document detail by ID"
			},
			{
				path: "/test/r2",
				method: "GET",
				description: "Test R2 bucket connectivity"
			},
			{
				path: "/test/d1",
				method: "GET",
				description: "Test D1 database connectivity"
			},
			{
				path: "/test/ai",
				method: "GET",
				description: "Test AI service connectivity"
			},
			{
				path: "/sse",
				method: "GET",
				description: "Server-Sent Events endpoint for MCP"
			},
			{
				path: "/sse/message",
				method: "GET",
				description: "SSE message endpoint for MCP"
			},
			{
				path: "/mcp",
				method: "POST",
				description: "MCP server endpoint with knowledge base tools"
			}
		]
	};

	return c.json(endpoints);
});

// AI-powered Q&A endpoint with full resource integration
app.post("/api/ask", async (c) => {
	try {
		const body = await c.req.json();
		const { content } = body;

		if (!content || typeof content !== "string") {
			return c.json({
				status: "error",
				message: "Missing or invalid 'content' field in request body"
			}, 400);
		}

		// Generate session ID for this conversation
		const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const timestamp = new Date().toISOString();

		// 1. Call AI service using Cloudflare AI
		const ai = c.env.AI;
		const aiModel = c.env.AI_MODEL;

		// Call @cf/openai/gpt-oss-20b with correct format
		const aiResponse = await ai.run(aiModel as any, {
			instructions: 'You are a helpful assistant.',
			input: content
		} as any);

		// Extract response text - handle different response formats
		let responseText;
		if (typeof aiResponse === 'string') {
			responseText = aiResponse;
		} else if (aiResponse && typeof aiResponse === 'object') {
			responseText = aiResponse.response ||
			             aiResponse.result?.response ||
			             aiResponse.output ||
			             aiResponse.answer ||
			             aiResponse.text ||
			             JSON.stringify(aiResponse);
		} else {
			responseText = String(aiResponse);
		}

		// 2. Create log entry for R2
		const logEntry = {
			sessionId,
			timestamp,
			request: {
				content,
				userAgent: c.req.header("User-Agent"),
				ip: c.req.header("CF-Connecting-IP") || "unknown"
			},
			response: {
				aiModel: aiModel,
				content: responseText,
				responseTime: new Date().toISOString()
			}
		};

		// 3. Store log in R2
		const logFileName = `ai-logs/${timestamp.split('T')[0]}/${sessionId}.json`;
		await c.env.R2_BUCKET.put(logFileName, JSON.stringify(logEntry, null, 2), {
			httpMetadata: {
				contentType: "application/json"
			}
		});

		// 4. Store conversation in D1 database
		const db = drizzle(c.env.DB);

		// Ensure all values are strings for D1
		const conversationRecord = await db.insert(conversationTable).values({
			sessionId: String(sessionId),
			userQuestion: String(content),
			aiResponse: String(responseText), // Ensure it's a string
			logFileKey: String(logFileName)
		}).returning();

		// 5. Return response with raw AI response
		return c.json({
			status: "success",
			sessionId,
			question: content,
			answer: responseText,
			rawAiResponse: aiResponse, // Include the raw upstream response
			metadata: {
				timestamp,
				logStored: logFileName,
				dbRecordId: conversationRecord[0]?.id,
				aiModel: aiModel
			}
		});

	} catch (error) {
		console.error("Error in /api/ask:", error);
		return c.json({
			status: "error",
			message: "Failed to process request",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// Test R2 bucket connectivity
app.get("/test/r2", async (c) => {
	try {
		const r2 = c.env.R2_BUCKET;

		// Test writing to R2
		await r2.put("test-file.txt", "Hello from R2!");

		// Test reading from R2
		const object = await r2.get("test-file.txt");
		const content = await object?.text();

		return c.json({
			status: "success",
			message: "R2 bucket is working",
			testResult: content
		});
	} catch (error) {
		return c.json({
			status: "error",
			message: "R2 bucket test failed",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// Test D1 database connectivity
app.get("/test/d1", async (c) => {
	try {
		const db = drizzle(c.env.DB);

		// Insert test data
		const result = await db.insert(testTable).values({
			name: "Test from D1"
		}).returning();

		// Query the data
		const allRecords = await db.select().from(testTable).limit(5);

		return c.json({
			status: "success",
			message: "D1 database is working",
			insertedRecord: result[0],
			allRecords: allRecords
		});
	} catch (error) {
		return c.json({
			status: "error",
			message: "D1 database test failed",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// Test AI service connectivity
app.get("/test/ai", async (c) => {
	try {
		const ai = c.env.AI;
		const aiModel = c.env.AI_MODEL;

		// Test with a simple text generation using the configured model
		const response = await ai.run(aiModel as any, {
			instructions: 'You are a helpful assistant.',
			input: "Hello! Please respond with a simple greeting."
		} as any);

		return c.json({
			status: "success",
			message: "AI service is working",
			aiModel: aiModel,
			aiResponse: response
		});
	} catch (error) {
		return c.json({
			status: "error",
			message: "AI service test failed",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// ============================================
// FAQ Management API Endpoints
// ============================================

// Index FAQ documents from R2
app.post("/api/faq/index", async (c) => {
	try {
		const db = drizzle(c.env.DB);
		const r2 = c.env.R2_BUCKET;
		const prefix = "justincourse-faq/";

		// List all markdown files in the FAQ directory
		const listed = await r2.list({ prefix });

		console.log(`[FAQ Index] Listed ${listed.objects.length} objects with prefix: ${prefix}`);

		let indexed = 0;
		let errors = [];

		for (const object of listed.objects) {
			if (!object.key.endsWith('.md')) continue;

			try {
				// Get the file content
				const file = await r2.get(object.key);
				if (!file) continue;

				const content = await file.text();
				const fileName = object.key.split('/').pop() || object.key;

				// Parse markdown frontmatter and content
				let title = fileName.replace('.md', '');
				let description = '';
				let tags: string[] = [];

				// Simple frontmatter parser
				const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
				if (frontmatterMatch) {
					const frontmatter = frontmatterMatch[1];
					const titleMatch = frontmatter.match(/title:\s*(.+)/);
					const descMatch = frontmatter.match(/description:\s*(.+)/);
					const tagsMatch = frontmatter.match(/tags:\s*\[(.+)\]/);

					if (titleMatch) title = titleMatch[1].trim().replace(/['"]/g, '');
					if (descMatch) description = descMatch[1].trim().replace(/['"]/g, '');
					if (tagsMatch) {
						tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
					}
				} else {
					// Extract title from first heading if no frontmatter
					const headingMatch = content.match(/^#\s+(.+)$/m);
					if (headingMatch) title = headingMatch[1].trim();

					// Use first paragraph as description
					const paragraphMatch = content.match(/\n\n(.+)\n/);
					if (paragraphMatch) {
						description = paragraphMatch[1].trim().substring(0, 200);
					}
				}

				// Insert or update in database
				await db.insert(faqIndexTable)
					.values({
						fileName,
						title,
						description,
						tags: JSON.stringify(tags),
						r2Key: object.key,
						lastIndexed: new Date(),
					})
					.onConflictDoUpdate({
						target: faqIndexTable.fileName,
						set: {
							title,
							description,
							tags: JSON.stringify(tags),
							lastIndexed: new Date(),
						},
					});

				indexed++;
			} catch (error) {
				errors.push({
					file: object.key,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		console.log(`[FAQ Index] Completed: ${indexed}/${listed.objects.length} indexed`);

		return c.json({
			status: "success",
			message: `Indexed ${indexed} FAQ documents`,
			total: listed.objects.length,
			indexed,
			prefix,
			files: listed.objects.map(o => o.key),
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		return c.json({
			status: "error",
			message: "Failed to index FAQ documents",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// List FAQ documents with optional search
app.get("/api/faq/list", async (c) => {
	try {
		const keywords = c.req.query("keywords");
		const limit = Number.parseInt(c.req.query("limit") || "20");

		const db = drizzle(c.env.DB);

		let query = db.select().from(faqIndexTable);

		if (keywords) {
			const searchPattern = `%${keywords}%`;
			query = query.where(
				or(
					like(faqIndexTable.title, searchPattern),
					like(faqIndexTable.description, searchPattern),
					like(faqIndexTable.tags, searchPattern)
				)
			) as any;
		}

		const results = await query.limit(limit).all();

		return c.json({
			status: "success",
			count: results.length,
			documents: results.map(doc => ({
				id: doc.id,
				fileName: doc.fileName,
				title: doc.title,
				description: doc.description,
				tags: doc.tags ? JSON.parse(doc.tags) : [],
				lastIndexed: doc.lastIndexed,
			})),
		});
	} catch (error) {
		return c.json({
			status: "error",
			message: "Failed to list FAQ documents",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// Get FAQ document detail
app.get("/api/faq/:id", async (c) => {
	try {
		const id = Number.parseInt(c.req.param("id"));

		if (Number.isNaN(id)) {
			return c.json({
				status: "error",
				message: "Invalid document ID"
			}, 400);
		}

		const db = drizzle(c.env.DB);

		const result = await db.select()
			.from(faqIndexTable)
			.where(eq(faqIndexTable.id, id))
			.limit(1);

		if (result.length === 0) {
			return c.json({
				status: "error",
				message: "Document not found"
			}, 404);
		}

		const doc = result[0];
		const r2Object = await c.env.R2_BUCKET.get(doc.r2Key);

		if (!r2Object) {
			return c.json({
				status: "error",
				message: "Document file not found in storage"
			}, 404);
		}

		const content = await r2Object.text();

		return c.json({
			status: "success",
			document: {
				id: doc.id,
				fileName: doc.fileName,
				title: doc.title,
				description: doc.description,
				tags: doc.tags ? JSON.parse(doc.tags) : [],
				content,
				r2Key: doc.r2Key,
				lastIndexed: doc.lastIndexed,
				createdAt: doc.createdAt,
			},
		});
	} catch (error) {
		return c.json({
			status: "error",
			message: "Failed to retrieve document",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// Search WordPress posts
app.get("/api/wordpress/search", async (c) => {
	try {
		const keywords = c.req.query("keywords");
		const perPage = Number.parseInt(c.req.query("per_page") || "10");

		if (!keywords) {
			return c.json({
				status: "error",
				message: "Missing 'keywords' query parameter"
			}, 400);
		}

		const baseUrl = "https://app.justincourse.com/wp-json/wp/v2/posts";
		const params = new URLSearchParams({
			search: keywords,
			per_page: String(Math.min(perPage, 100)),
			_embed: "1",
		});

		const response = await fetch(`${baseUrl}?${params.toString()}`);

		if (!response.ok) {
			return c.json({
				status: "error",
				message: `WordPress API returned ${response.status}`,
			}, 500);
		}

		const posts = await response.json() as any[];

		return c.json({
			status: "success",
			count: posts.length,
			posts: posts.map(post => ({
				id: post.id,
				title: post.title.rendered,
				link: post.link,
				excerpt: post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim(),
				date: post.date,
				categories: post._embedded?.["wp:term"]?.[0]?.map((cat: any) => cat.name) || [],
				tags: post._embedded?.["wp:term"]?.[1]?.map((tag: any) => tag.name) || [],
			})),
		});
	} catch (error) {
		return c.json({
			status: "error",
			message: "Failed to search WordPress",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// Search across both WordPress and FAQ
app.get("/api/search", async (c) => {
	try {
		const keywords = c.req.query("keywords");

		if (!keywords) {
			return c.json({
				status: "error",
				message: "Missing 'keywords' query parameter"
			}, 400);
		}

		// Search WordPress
		const wpUrl = "https://app.justincourse.com/wp-json/wp/v2/posts";
		const wpParams = new URLSearchParams({
			search: keywords,
			per_page: "5",
			_embed: "1",
		});

		const wpResponse = await fetch(`${wpUrl}?${wpParams.toString()}`);
		const wpPosts: any[] = wpResponse.ok ? await wpResponse.json() : [];

		// Search FAQ
		const db = drizzle(c.env.DB);
		const searchPattern = `%${keywords}%`;

		const faqDocs = await db.select()
			.from(faqIndexTable)
			.where(
				or(
					like(faqIndexTable.title, searchPattern),
					like(faqIndexTable.description, searchPattern),
					like(faqIndexTable.tags, searchPattern)
				)
			)
			.limit(5)
			.all();

		return c.json({
			status: "success",
			keywords,
			results: {
				wordpress: {
					count: wpPosts.length,
					posts: wpPosts.map((post: any) => ({
						id: post.id,
						title: post.title.rendered,
						link: post.link,
						excerpt: post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim(),
					})),
				},
				faq: {
					count: faqDocs.length,
					documents: faqDocs.map(doc => ({
						id: doc.id,
						title: doc.title,
						description: doc.description,
						tags: doc.tags ? JSON.parse(doc.tags) : [],
					})),
				},
			},
		});
	} catch (error) {
		return c.json({
			status: "error",
			message: "Failed to search knowledge base",
			error: error instanceof Error ? error.message : String(error)
		}, 500);
	}
});

// Export default handler with MCP routes
export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Handle MCP SSE endpoints
		if (url.pathname === "/sse" || url.pathname.startsWith("/sse/")) {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		// Handle MCP POST endpoint
		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		// Handle all other routes through Hono app
		return app.fetch(request, env, ctx);
	},
};
