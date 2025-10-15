# MCP 服务器 404 问题修复说明

## 问题描述
MCP 服务器在访问 `/sse/message` 端点时返回 404 错误。

## 问题原因
代码使用了 Hono 的路由来处理 MCP 的 SSE 端点，但是 `McpAgent.serveSSE()` 和 `McpAgent.serve()` 需要在 Worker 的 `fetch` 函数中直接处理，而不是通过 Hono 中间件。

## 修复方法
将 MCP 路由从 Hono app 中移除，改为在 `export default` 的 `fetch` 函数中直接处理：

```typescript
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
```

## 测试方法

### 方法 1: 使用 MCP Inspector（推荐）
```bash
npx @modelcontextprotocol/inspector
```
然后在浏览器中：
1. 选择 Transport Type: **SSE**
2. 输入 URL: `https://hono-mcp-demo.justincourse.site/sse`
3. 点击 **Connect**
4. 点击 **List Tools** 查看可用工具
5. 测试工具（如 `add` 或 `calculate`）

### 方法 2: 使用 Claude Desktop
在 Claude Desktop 配置文件中添加：
```json
{
  "mcpServers": {
    "calculator": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://hono-mcp-demo.justincourse.site/sse"
      ]
    }
  }
}
```

### 方法 3: 使用 Cloudflare AI Playground
1. 访问 https://playground.ai.cloudflare.com/
2. 输入 MCP 服务器 URL: `https://hono-mcp-demo.justincourse.site/sse`
3. 连接后即可使用工具

### 方法 4: 命令行测试
```bash
npx mcp-remote https://hono-mcp-demo.justincourse.site/sse
```

## 可用的工具

### 1. add
简单的加法工具
- 参数: `a` (number), `b` (number)
- 示例: `{"a": 2, "b": 3}` → 返回 `5`

### 2. calculate
多功能计算器
- 参数:
  - `operation`: "add" | "subtract" | "multiply" | "divide"
  - `a`: number
  - `b`: number
- 示例: `{"operation": "multiply", "a": 4, "b": 5}` → 返回 `20`

## 验证修复成功
修复前：`/sse/message?sessionId=xxx` 返回 **404 Not Found**
修复后：`/sse/message?sessionId=xxx` 返回 **Accepted** (202)

## 部署命令
```bash
npm run deploy
```

## 参考资料
- [Cloudflare MCP 文档](https://developers.cloudflare.com/agents/model-context-protocol/)
- [MCP Protocol 规范](https://modelcontextprotocol.io/)
- [Cloudflare AI 示例](https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)
