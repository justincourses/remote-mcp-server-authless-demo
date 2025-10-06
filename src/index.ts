import { Hono } from "hono";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

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
const app = new Hono();

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

// MCP SSE endpoints - preserve original functionality
app.get("/sse/*", async (c) => {
	const request = c.req.raw;
	const env = c.env;
	const ctx = c.executionCtx;
	return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
});

// MCP server endpoint - preserve original functionality
app.post("/mcp", async (c) => {
	const request = c.req.raw;
	const env = c.env;
	const ctx = c.executionCtx;
	return MyMCP.serve("/mcp").fetch(request, env, ctx);
});

export default app;
