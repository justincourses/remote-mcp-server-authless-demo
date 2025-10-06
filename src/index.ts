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

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Health check endpoint
		if (url.pathname === "/") {
			return new Response("OK - System is healthy", {
				status: 200,
				headers: { "Content-Type": "text/plain" }
			});
		}

		// API endpoint to list all endpoints
		if (url.pathname === "/api") {
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

			return new Response(JSON.stringify(endpoints, null, 2), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
