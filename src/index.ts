import { Hono } from "hono";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { testTable, conversationTable } from "./db/schema";
import { eq } from "drizzle-orm";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
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
				description: "MCP server endpoint with calculator tools"
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
