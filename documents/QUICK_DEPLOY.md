# 🚀 快速部署指南 - v2.1

## 📋 部署前准备

### 1. 运行检查清单
```bash
./scripts/pre-deploy-check.sh
```

预期输出：
```
✅ 所有检查通过！可以部署。
```

---

## 🔧 部署步骤

### Step 1: 部署到 Cloudflare Workers
```bash
npm run deploy
```

预期输出：
```
✅ Deployed remote-mcp-server-authless-demo
   https://remote-mcp-server-authless-demo.*.workers.dev
```

### Step 2: 验证部署
```bash
curl https://hono-mcp-demo.justincourse.site/api
```

预期：返回 API 端点列表

---

## 🧪 测试验证

### 快速测试（推荐）
```bash
./scripts/test-ai-guidance.sh
```

检查：
- ✅ how_to_use 包含官网链接
- ✅ search_knowledge_base 包含组合建议
- ✅ search_wordpress_posts 包含"PRIMARY SOURCE"
- ✅ 所有响应包含 https://justincourse.com

### 完整 MCP 测试
```bash
npx @modelcontextprotocol/inspector
```

1. 连接到: `https://hono-mcp-demo.justincourse.site/sse`
2. 测试工具：

**Test 1: how_to_use**
```json
{
  "tool": "how_to_use",
  "arguments": {}
}
```
检查：包含完整使用指南和官网链接

**Test 2: search_knowledge_base**
```json
{
  "tool": "search_knowledge_base",
  "arguments": {
    "keywords": "课程",
    "sources": "all"
  }
}
```
检查：同时搜索 WordPress + FAQ，包含下一步建议

**Test 3: search_wordpress_posts**
```json
{
  "tool": "search_wordpress_posts",
  "arguments": {
    "keywords": "web course",
    "per_page": 3
  }
}
```
检查：返回详细文章，建议组合 FAQ

---

## 🤖 Claude Desktop 集成

### 1. 编辑配置文件

**macOS:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

### 2. 添加 MCP 服务器
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

### 3. 重启 Claude Desktop

### 4. 验证连接
在 Claude 中输入：
```
请介绍一下 JustinCourse 的课程
```

**预期 AI 行为：**
1. 调用 `list_faq_documents("课程")` 或 `search_knowledge_base("课程")`
2. 调用 `search_wordpress_posts("course")`
3. 综合两个来源的信息
4. 在回答中包含官网链接 https://justincourse.com

---

## 📊 验证清单

### 基础功能
- [ ] API 端点正常响应
- [ ] FAQ 索引包含 13 个文档
- [ ] WordPress 搜索返回文章
- [ ] MCP SSE 端点可连接

### AI 引导功能 (v2.1)
- [ ] `how_to_use` 返回完整指南
- [ ] 所有工具包含官网链接
- [ ] WordPress 被标注为"PRIMARY SOURCE"
- [ ] 响应包含"下一步建议"
- [ ] 建议组合使用 FAQ + WordPress

### 实际对话测试
- [ ] 询问课程 → AI 组合 FAQ + WordPress
- [ ] 询问技术 → AI 优先 WordPress
- [ ] 询问报名 → AI 引导访问官网
- [ ] 回答完整且包含官网链接

---

## 🔧 故障排查

### 问题 1: 部署失败
```bash
# 检查 wrangler 配置
cat wrangler.jsonc

# 验证 account_id
wrangler whoami
```

### 问题 2: MCP 连接失败
```bash
# 测试 SSE 端点
curl -N -H "Accept: text/event-stream" \
  https://hono-mcp-demo.justincourse.site/sse

# 应该看到: event: endpoint
```

### 问题 3: FAQ 数量为 0
```bash
# 重新索引
curl -X POST https://hono-mcp-demo.justincourse.site/api/faq/index

# 检查结果
curl https://hono-mcp-demo.justincourse.site/api/faq/list
```

---

## 📚 相关文档

部署完成后，查看：
- [完整功能文档](./KNOWLEDGE_BASE_FEATURES.md)
- [迭代总结](./ITERATION_V2.1_SUMMARY.md)
- [AI 引导优化](./AI_GUIDANCE_OPTIMIZATION.md)
- [最佳实践](./MCP_BEST_PRACTICES.md)

---

## ✅ 部署成功标志

看到以下所有检查通过，说明部署成功：

```
✅ API 端点响应正常
✅ FAQ 索引 13 个文档
✅ MCP SSE 端点可连接
✅ 工具包含官网链接
✅ 工具描述包含引导信息
✅ Claude Desktop 可正常对话
```

---

**部署版本:** v2.1.0 - AI 引导优化版
**部署日期:** 2025-10-15
**生产地址:** https://hono-mcp-demo.justincourse.site
