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
		version: "2.1.0",
	});

	async init() {
		// ============================================
		// 🎯 USAGE GUIDE - Start Here for Instructions
		// ============================================

		// Help and guidance tool
		this.server.tool(
			"how_to_use",
			"ℹ️ **START HERE IF UNSURE** - Get usage instructions, examples, and recommendations for using this knowledge base effectively. Shows available tools, common workflows, and tips for better results.",
			{},
			async () => {
				return {
					content: [{
						type: "text",
						text: `# 📚 JustinCourse Knowledge Base Assistant - Usage Guide

## 🎯 Available Tools & When to Use Them

### 1. 🌟 search_knowledge_base **(RECOMMENDED FIRST CHOICE)**
**Use for:** Any question about JustinCourse, courses, or technical topics
**Searches:** WordPress blog posts + FAQ documents simultaneously
**Best when:** You're not sure where to look, or want comprehensive results
**Example:** "How do I deploy to Cloudflare Workers?"

### 2. 📰 search_wordpress_posts
**Use for:** Finding technical tutorials, course announcements, and articles
**Searches:** Only blog posts (https://app.justincourse.com)
**Best when:** You need detailed tutorials or recent updates
**Example:** "Show me articles about Next.js deployment"

### 3. 📚 list_faq_documents
**Use for:** Browsing frequently asked questions by topic
**Searches:** FAQ document index (titles, descriptions, tags)
**Best when:** Exploring topics like payment, enrollment, or prerequisites
**Example:** Use keywords "报名" to find enrollment-related FAQs

### 4. 📄 get_faq_document
**Use for:** Reading complete FAQ answers
**Requires:** Document ID from list_faq_documents or search_knowledge_base
**Best when:** You found a relevant FAQ and need full details
**Example:** get_faq_document(5) to read FAQ #5

---

## 💡 Recommended Workflows

### For General Questions:
1. Start with **search_knowledge_base("your question")**
2. If FAQs are found, use **get_faq_document(id)** for details
3. If blog posts are found, click the provided links

### For Course Information:
1. Use **list_faq_documents("课程")** to browse course FAQs
2. Pick relevant FAQ by ID
3. Read with **get_faq_document(id)**

### For Technical Tutorials:
1. Use **search_wordpress_posts("technology name")**
2. Review titles, categories, and publish dates
3. Click blog post links for full articles

---

## 🏷️ Available Topics

**WordPress Categories:**
- Cloudflare Workers
- Web Development
- TypeScript / JavaScript
- MCP (Model Context Protocol)
- Next.js, React
- Database (D1, R2)

**FAQ Topics:**
- 课程报名 (Course Enrollment)
- 付费方式 (Payment Methods)
- 学习要求 (Prerequisites)
- 课程形式 (Course Format)
- 技术支持 (Technical Support)

---

## 💬 Example Queries

**Question:** "如何支付课程费用？"
→ Use: search_knowledge_base("支付") or list_faq_documents("付费")

**Question:** "Show me tutorials about Cloudflare D1"
→ Use: search_wordpress_posts("cloudflare d1")

**Question:** "What are the course prerequisites?"
→ Use: list_faq_documents("学习要求") then get_faq_document(id)

---

## 🔄 Data Freshness

- **WordPress Posts:** Live API - always current
- **FAQ Documents:** Indexed from R2 storage
- Total FAQ Documents: ~13 documents
- Topics: Course info, enrollment, payment, learning paths

Ready to help! What would you like to know?`
					}]
				};
			}
		);

		// ============================================
		// 🎯 ENTRY POINT TOOL - Smart Search
		// ============================================

		// 🌟 Smart unified search - Recommended first tool to use
		this.server.tool(
			"search_knowledge_base",
			"🌟 **RECOMMENDED START POINT** - Intelligent search across WordPress blog posts AND FAQ documents. This is your primary tool for finding information about JustinCourse. Returns formatted results with links and IDs for deeper exploration.",
			{
				keywords: z.string().describe("Search keywords. Can be multi-word queries. Examples: 'cloudflare workers deployment', 'course payment methods', '如何报名课程', 'mcp server setup'"),
				sources: z.enum(["all", "wordpress", "faq"]).optional().default("all").describe("Search scope: 'all' (default, searches both sources), 'wordpress' (blog posts only), 'faq' (FAQ documents only)"),
				max_results: z.number().optional().default(5).describe("Max results per source (1-10). Default: 5. Use higher values for comprehensive research."),
			},
			async ({ keywords, sources = "all", max_results = 5 }) => {
				try {
					max_results = Math.min(max_results, 10);
					let wpResults = "";
					let faqResults = "";
					let wpCount = 0;
					let faqCount = 0;

					// Search WordPress
					if (sources === "all" || sources === "wordpress") {
						const baseUrl = "https://app.justincourse.com/wp-json/wp/v2/posts";
						const params = new URLSearchParams({
							search: keywords,
							per_page: String(max_results),
							_embed: "1",
						});

						const response = await fetch(`${baseUrl}?${params.toString()}`);

						if (response.ok) {
							const posts = await response.json() as any[];
							wpCount = posts.length;

							if (posts.length > 0) {
								wpResults = posts.map((post: any, index: number) => {
									const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim() || "No excerpt";
									const categories = post._embedded?.["wp:term"]?.[0]?.map((cat: any) => cat.name).join(", ") || "Uncategorized";
									const tags = post._embedded?.["wp:term"]?.[1]?.map((tag: any) => tag.name).join(", ") || "No tags";

									return `${index + 1}. 📄 **${post.title.rendered}**
   🔗 Link: ${post.link}
   📅 Published: ${new Date(post.date).toLocaleDateString()}
   📁 Categories: ${categories}
   🏷️  Tags: ${tags}
   📝 ${excerpt.substring(0, 200)}${excerpt.length > 200 ? "..." : ""}`;
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
							.limit(max_results)
							.all();

						faqCount = faqDocs.length;

						if (faqDocs.length > 0) {
							faqResults = faqDocs.map((doc: any, index: number) => {
								const tags = doc.tags ? JSON.parse(doc.tags).join(", ") : "None";
								return `${index + 1}. 📚 **${doc.title}** (ID: ${doc.id})
   🏷️  Tags: ${tags}
   📝 ${doc.description || "No description"}
   💡 Use get_faq_document(${doc.id}) to read full content`;
							}).join("\n\n");
						}
					}

					// Combine results
					let output = `# 🔍 Search Results for "${keywords}"\n\n`;

					if (wpResults) {
						output += `## 📰 WordPress Posts (${wpCount} results)\n\n${wpResults}\n\n`;
					} else if (sources === "all" || sources === "wordpress") {
						output += `## 📰 WordPress Posts\nNo results found.\n\n`;
					}

					if (faqResults) {
						output += `## 📚 FAQ Documents (${faqCount} results)\n\n${faqResults}\n\n`;
					} else if (sources === "all" || sources === "faq") {
						output += `## 📚 FAQ Documents\nNo results found.\n\n`;
					}

					output += `\n---\n💡 **Next Steps:**\n`;
					if (faqCount > 0) {
						output += `- Use get_faq_document(id) to read full FAQ content\n`;
					}
					if (wpCount > 0) {
						output += `- Click WordPress post links to read full articles\n`;
					}
					if (wpCount === 0 && faqCount === 0) {
						output += `- Try different keywords or broader search terms\n`;
						output += `- Use list_faq_documents() to browse all available FAQs\n`;
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

		// ============================================
		// 📰 WORDPRESS TOOLS
		// ============================================

		// Search WordPress blog posts with rich metadata
		this.server.tool(
			"search_wordpress_posts",
			"📰 Search JustinCourse blog posts about web development, Cloudflare, MCP, and programming tutorials. Returns posts with categories, tags, publish dates, and excerpts. Use when you need technical articles, tutorials, or course updates.",
			{
				keywords: z.string().describe("Search keywords. Searches in post title, content, and metadata. Examples: 'cloudflare workers', 'mcp tutorial', 'next.js deployment', 'typescript basics'"),
				search_in: z.enum(["title", "content", "all"]).optional().describe("Search scope: 'title' (titles only), 'content' (body text), 'all' (recommended - searches everything)"),
				per_page: z.number().optional().default(10).describe("Results per page (1-100). Default: 10. WordPress may return fewer if that's all it finds."),
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

		// ============================================
		// 📚 FAQ DOCUMENT TOOLS
		// ============================================

		// Browse FAQ documents with smart filtering
		this.server.tool(
			"list_faq_documents",
			"📚 Browse frequently asked questions about JustinCourse. Returns a list of FAQ documents with titles, descriptions, tags, and IDs. Use for exploring topics like enrollment, payment, course content, learning paths, and technical requirements. Supports keyword filtering across title, description, AND tags.",
			{
				keywords: z.string().optional().describe("Optional filter keywords. Searches in title, description, and tags. Examples: '课程', 'payment', '报名', 'cloudflare'. Leave empty to list all FAQs."),
				limit: z.number().optional().default(20).describe("Max results (1-50). Default: 20. Use smaller values for focused results, larger for comprehensive browsing."),
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

		// Read full FAQ document content
		this.server.tool(
			"get_faq_document",
			"📄 Retrieve the complete content of a specific FAQ document by its ID. Returns full Markdown content including all details, examples, and instructions. Use this after finding relevant FAQs with list_faq_documents or search_knowledge_base to get comprehensive answers.",
			{
				id: z.number().describe("FAQ document ID. Get this from list_faq_documents or search_knowledge_base results. Example: 1, 5, 13"),
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
