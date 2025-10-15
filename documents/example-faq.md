---
title: 如何部署 MCP 服务器到 Cloudflare Workers
description: 本文档详细介绍了如何将 Model Context Protocol (MCP) 服务器部署到 Cloudflare Workers 平台
tags: [cloudflare, workers, mcp, 部署, 教程]
---

# 如何部署 MCP 服务器到 Cloudflare Workers

## 简介

Model Context Protocol (MCP) 是一个开放标准，允许 AI 助手连接到外部工具和数据源。Cloudflare Workers 提供了一个快速、可扩展的平台来托管 MCP 服务器。

## 前置要求

- Node.js 18+
- npm 或 pnpm
- Cloudflare 账户
- Wrangler CLI

## 步骤 1：安装 Wrangler

```bash
npm install -g wrangler
```

## 步骤 2：登录 Cloudflare

```bash
wrangler login
```

## 步骤 3：创建项目

```bash
npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
```

## 步骤 4：配置 wrangler.jsonc

编辑 `wrangler.jsonc` 文件，配置你的资源绑定：

```json
{
  "name": "my-mcp-server",
  "main": "src/index.ts",
  "compatibility_date": "2025-03-10",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "your-database-id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "my-bucket"
    }
  ],
  "ai": {
    "binding": "AI"
  }
}
```

## 步骤 5：开发和测试

本地开发：

```bash
npm run dev
```

这将启动一个本地服务器在 `http://localhost:8787`

## 步骤 6：部署

```bash
npm run deploy
```

部署后，你的 MCP 服务器将可以通过以下 URL 访问：
```
https://my-mcp-server.<your-subdomain>.workers.dev/sse
```

## 步骤 7：连接客户端

### Claude Desktop

编辑 Claude Desktop 配置文件：

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://my-mcp-server.<your-subdomain>.workers.dev/sse"
      ]
    }
  }
}
```

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

然后连接到你的 SSE 端点。

## 常见问题

### Q: 如何添加自定义工具？

A: 在 `src/index.ts` 的 `init()` 方法中使用 `this.server.tool()` 添加工具。

### Q: 如何处理认证？

A: 对于需要认证的场景，可以使用 `@cloudflare/workers-oauth-provider` 包。

### Q: 如何监控服务器？

A: Cloudflare Workers 提供了内置的日志和分析功能，可以在 Dashboard 中查看。

## 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare AI 示例](https://github.com/cloudflare/ai)

## 更新日志

- 2025-10-15: 初始版本发布
