# JustinCourse Knowledge Base Assistant - MCP Server

> 🤖 一个功能完整的 MCP 服务器，集成了 WordPress 文章搜索和 FAQ 文档管理能力

这是一个部署在 Cloudflare Workers 上的 Model Context Protocol (MCP) 服务器，提供：

- 🔍 WordPress 文章智能搜索
- 📚 FAQ 文档索引和管理
- 🤖 AI 助手集成（通过 MCP 协议）
- 🌐 完整的 REST API
- ☁️ 边缘计算部署（全球低延迟）

**Live Demo**: https://hono-mcp-demo.justincourse.site

## ✨ 核心功能

### 1. WordPress 集成
- 搜索文章标题、内容、分类、标签
- 返回格式化的文章信息和摘要
- 支持自定义结果数量

### 2. FAQ 文档管理
- 自动索引 R2 存储中的 Markdown 文档
- 支持 Frontmatter 元数据（标题、描述、标签）
- D1 数据库全文搜索
- 获取完整文档内容

### 3. MCP 工具 🌟 (遵循最佳实践)
- ℹ️ `how_to_use` - **新增**：完整使用指南和工作流推荐
- 🌟 `search_knowledge_base` - **推荐入口**：智能搜索（WordPress + FAQ）
- 📰 `search_wordpress_posts` - WordPress 文章搜索（含分类、标签）
- 📚 `list_faq_documents` - FAQ 文档浏览（支持关键词过滤）
- 📄 `get_faq_document` - 获取 FAQ 完整内容

**最佳实践改进：**
- ✅ 详细的工具描述（含 emoji 标识和使用场景）
- ✅ 丰富的参数说明（含示例值和取值范围）
- ✅ 智能使用建议（返回下一步操作指导）
- ✅ 完整的使用指南工具（AI 快速上手）

### 4. REST API
- `/api/search` - 统一搜索接口
- `/api/wordpress/search` - WordPress 搜索
- `/api/faq/index` - 索引 FAQ 文档
- `/api/faq/list` - FAQ 文档列表
- `/api/faq/:id` - FAQ 文档详情

## 🚀 快速开始

### 方法 1: 一键部署

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/justincourses/remote-mcp-server-authless-demo)

### 方法 2: 命令行部署

```bash
# 克隆项目
git clone https://github.com/justincourses/remote-mcp-server-authless-demo.git
cd remote-mcp-server-authless-demo

# 安装依赖
npm install

# 配置 wrangler.jsonc（设置你的 account_id 和资源绑定）

# 创建数据库表
wrangler d1 migrations apply course-demo --remote

# 部署
npm run deploy
```

### 方法 3: 使用快速开始脚本

```bash
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

## 📖 文档

- **[MCP 最佳实践](documents/MCP_BEST_PRACTICES.md)** - 🆕 工具优化和 AI 使用指南
- **[完整功能文档](documents/KNOWLEDGE_BASE_FEATURES.md)** - 详细的功能说明和 API 文档
- **[项目总结](documents/PROJECT_SUMMARY.md)** - 技术实现和架构说明
- **[修复说明](documents/FIX_NOTES.md)** - SSE 404 问题的修复过程
- **[FAQ 示例](documents/example-faq.md)** - Markdown 文档格式示例

## 🧪 测试

### 测试 MCP 最佳实践 🆕
```bash
# 测试工具优化和使用指南
./scripts/test-mcp-best-practices.sh
```

### 测试 API
```bash
# 运行完整测试
./scripts/test-knowledge-base.sh

# 或手动测试
curl "https://hono-mcp-demo.justincourse.site/api/search?keywords=mcp"
```

### 测试 MCP 工具
```bash
# 使用 MCP Inspector
npx @modelcontextprotocol/inspector

# 连接到
https://hono-mcp-demo.justincourse.site/sse
```

## 🔧 配置

### 环境变量 (wrangler.jsonc)

```json
{
  "name": "your-mcp-server",
  "d1_databases": [{
    "binding": "DB",
    "database_name": "your-database"
  }],
  "r2_buckets": [{
    "binding": "R2_BUCKET",
    "bucket_name": "your-bucket"
  }],
  "ai": {
    "binding": "AI"
  },
  "vars": {
    "AI_MODEL": "@cf/openai/gpt-oss-20b"
  }
}
```

### FAQ 文档格式

将 Markdown 文件上传到 R2 的 `course-demo/justincourse-faq/` 目录：

```markdown
---
title: 文档标题
description: 简短描述
tags: [标签1, 标签2]
---

# 文档内容

正文...
```

然后调用索引 API：
```bash
curl -X POST https://your-server.workers.dev/api/faq/index
```

## 🤖 集成到 AI 客户端

### Claude Desktop

编辑配置文件（`~/Library/Application Support/Claude/claude_desktop_config.json`）:

```json
{
  "mcpServers": {
    "justincourse-kb": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://hono-mcp-demo.justincourse.site/sse"
      ]
    }
  }
}
```

### Cloudflare AI Playground

1. 访问 https://playground.ai.cloudflare.com/
2. 输入 MCP 服务器 URL: `https://hono-mcp-demo.justincourse.site/sse`
3. 开始使用！

## 📊 技术栈

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **ORM**: Drizzle ORM
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **AI**: Cloudflare AI Workers
- **Protocol**: Model Context Protocol (MCP)

## 🛠️ 开发

```bash
# 本地开发
npm run dev

# 类型检查
npm run type-check

# 格式化代码
npm run format

# 生成数据库迁移
npm run db:generate

# 应用迁移（本地）
wrangler d1 migrations apply course-demo --local

# 应用迁移（远程）
wrangler d1 migrations apply course-demo --remote
```

## 📈 使用示例

### 搜索知识库
```typescript
// 使用 MCP 工具
{
  "tool": "search_knowledge_base",
  "arguments": {
    "keywords": "如何部署到 cloudflare",
    "sources": "all"
  }
}
```

### REST API 调用
```bash
# 统一搜索
curl "https://your-server.workers.dev/api/search?keywords=mcp"

# WordPress 搜索
curl "https://your-server.workers.dev/api/wordpress/search?keywords=cloudflare"

# FAQ 列表
curl "https://your-server.workers.dev/api/faq/list?keywords=部署"

# FAQ 详情
curl "https://your-server.workers.dev/api/faq/1"
```

## 🎯 使用场景

1. **技术支持**: AI 助手自动搜索文档回答用户问题
2. **内容发现**: 智能推荐相关文章和文档
3. **知识管理**: 统一管理和搜索多个知识源
4. **教程助手**: 为学习者提供上下文相关的帮助

## 🔒 安全说明

此版本是无认证版本，适合：
- 公开知识库
- 内部网络部署
- 开发和测试

生产环境建议添加认证机制。参考 [Cloudflare Workers OAuth Provider](https://github.com/cloudflare/workers-oauth-provider)。

## 📝 更新日志

### v2.0.0 (2025-10-15)
- ✨ 新增 WordPress 文章搜索
- ✨ 新增 FAQ 文档索引和管理
- ✨ 新增 4 个 MCP 工具
- ✨ 新增 6 个 REST API 端点
- 🐛 修复 SSE /sse/message 404 问题
- 📚 完善文档和测试脚本

### v1.0.0
- 🎉 初始版本（基础计算器工具）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare AI](https://developers.cloudflare.com/ai/)
- [课程网站](https://app.justincourse.com/)

---

**Made with ❤️ by JustinCourse**
