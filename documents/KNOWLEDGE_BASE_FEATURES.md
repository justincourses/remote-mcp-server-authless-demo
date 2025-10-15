# MCP 知识库助手 - 功能扩展文档

## 🎉 新功能概览

MCP 服务器现在具备了强大的知识库搜索能力，可以：
1. ✅ 搜索 WordPress 博客文章（标题、内容、分类、标签）
2. ✅ 索引和搜索 R2 存储中的 FAQ 文档
3. ✅ 智能整合搜索结果

## 📋 MCP 工具列表

### 1. **search_wordpress_posts**
搜索 WordPress 文章

**参数：**
- `keywords` (string, 必需): 搜索关键词
- `search_in` (enum, 可选): "title" | "content" | "all" (默认: "all")
- `per_page` (number, 可选): 每页结果数，最大 100 (默认: 10)

**示例：**
```json
{
  "keywords": "cloudflare workers",
  "search_in": "all",
  "per_page": 5
}
```

**返回：**
- 文章标题、链接、发布日期
- 分类和标签
- 文章摘要

---

### 2. **list_faq_documents**
列出 FAQ 文档（基于 D1 索引）

**参数：**
- `keywords` (string, 可选): 过滤关键词
- `limit` (number, 可选): 结果数量限制 (默认: 20)

**示例：**
```json
{
  "keywords": "部署",
  "limit": 10
}
```

**返回：**
- 文档 ID、标题、文件名
- 标签和描述
- 提示：使用 ID 获取完整内容

---

### 3. **get_faq_document**
获取 FAQ 文档的完整内容

**参数：**
- `id` (number, 必需): 文档 ID（从 list_faq_documents 获取）

**示例：**
```json
{
  "id": 1
}
```

**返回：**
- 完整的 Markdown 内容
- 元数据（标题、标签、描述、最后索引时间）

---

### 4. **search_knowledge_base** ⭐
智能搜索整个知识库（WordPress + FAQ）

**参数：**
- `keywords` (string, 必需): 搜索关键词
- `sources` (enum, 可选): "all" | "wordpress" | "faq" (默认: "all")

**示例：**
```json
{
  "keywords": "cloudflare mcp",
  "sources": "all"
}
```

**返回：**
- WordPress 文章结果（前 5 条）
- FAQ 文档结果（前 5 条）
- 格式化的综合结果

---

## 🌐 REST API 端点

### FAQ 管理

#### POST `/api/faq/index`
索引 R2 中的 FAQ 文档

自动扫描 `course-demo/justincourse-faq/` 目录下的所有 `.md` 文件，解析 frontmatter 并索引到 D1 数据库。

**响应示例：**
```json
{
  "status": "success",
  "message": "Indexed 15 FAQ documents",
  "total": 15,
  "indexed": 15
}
```

**支持的 Markdown Frontmatter：**
```yaml
---
title: 如何部署到 Cloudflare Workers
description: 详细的部署指南
tags: [cloudflare, workers, 部署]
---
```

---

#### GET `/api/faq/list?keywords=关键词&limit=20`
列出 FAQ 文档

**参数：**
- `keywords` (可选): 搜索关键词
- `limit` (可选): 结果数量 (默认: 20)

**响应示例：**
```json
{
  "status": "success",
  "count": 3,
  "documents": [
    {
      "id": 1,
      "fileName": "cloudflare-deployment.md",
      "title": "如何部署到 Cloudflare Workers",
      "description": "详细的部署指南",
      "tags": ["cloudflare", "workers", "部署"],
      "lastIndexed": "2025-10-15T02:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/faq/:id`
获取 FAQ 文档详情

**响应示例：**
```json
{
  "status": "success",
  "document": {
    "id": 1,
    "fileName": "cloudflare-deployment.md",
    "title": "如何部署到 Cloudflare Workers",
    "description": "详细的部署指南",
    "tags": ["cloudflare", "workers", "部署"],
    "content": "# 如何部署...\n\n完整的 Markdown 内容",
    "r2Key": "course-demo/justincourse-faq/cloudflare-deployment.md",
    "lastIndexed": "2025-10-15T02:00:00.000Z",
    "createdAt": "2025-10-15T01:00:00.000Z"
  }
}
```

---

### WordPress 搜索

#### GET `/api/wordpress/search?keywords=关键词&per_page=10`
搜索 WordPress 文章

**参数：**
- `keywords` (必需): 搜索关键词
- `per_page` (可选): 结果数量 (默认: 10, 最大: 100)

**响应示例：**
```json
{
  "status": "success",
  "count": 2,
  "posts": [
    {
      "id": 123,
      "title": "Cloudflare Workers 入门",
      "link": "https://app.justincourse.com/post/cloudflare-workers",
      "excerpt": "本文介绍如何开始使用 Cloudflare Workers...",
      "date": "2025-10-01T10:00:00",
      "categories": ["教程", "Cloudflare"],
      "tags": ["workers", "serverless"]
    }
  ]
}
```

---

### 统一搜索

#### GET `/api/search?keywords=关键词`
搜索整个知识库

**参数：**
- `keywords` (必需): 搜索关键词

**响应示例：**
```json
{
  "status": "success",
  "keywords": "cloudflare",
  "results": {
    "wordpress": {
      "count": 2,
      "posts": [...]
    },
    "faq": {
      "count": 3,
      "documents": [...]
    }
  }
}
```

---

## 🚀 使用场景示例

### 场景 1：用户询问"如何部署 MCP 服务器"

MCP 助手会：
1. 使用 `search_knowledge_base` 工具搜索关键词 "部署 MCP 服务器"
2. 返回相关的 WordPress 文章和 FAQ 文档
3. 如果找到具体的 FAQ 文档，使用 `get_faq_document` 获取完整内容
4. 整合信息并给出完整答案

### 场景 2：索引新的 FAQ 文档

1. 将新的 `.md` 文件上传到 R2: `course-demo/justincourse-faq/`
2. 调用 API: `POST /api/faq/index`
3. 系统自动解析并索引所有文档
4. MCP 工具立即可以搜索到新文档

### 场景 3：通过 MCP Inspector 测试

```bash
npx @modelcontextprotocol/inspector
```

1. 连接到: `https://hono-mcp-demo.justincourse.site/sse`
2. 列出工具，查看新增的 4 个知识库工具
3. 测试 `search_knowledge_base`:
   ```json
   {
     "keywords": "cloudflare workers",
     "sources": "all"
   }
   ```

---

## 📁 数据库 Schema

### faq_index 表

```sql
CREATE TABLE `faq_index` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `file_name` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `description` text,
  `tags` text,  -- JSON array as string
  `r2_key` text NOT NULL,
  `last_indexed` integer DEFAULT CURRENT_TIMESTAMP,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 配置要求

### R2 存储结构
```
course-demo/
└── justincourse-faq/
    ├── doc1.md
    ├── doc2.md
    └── ...
```

### Markdown 文件格式
```markdown
---
title: 文档标题
description: 简短描述
tags: [标签1, 标签2, 标签3]
---

# 文档内容

这里是正文...
```

---

## 🧪 测试步骤

### 1. 索引 FAQ 文档
```bash
curl -X POST https://hono-mcp-demo.justincourse.site/api/faq/index
```

### 2. 测试搜索 API
```bash
# 搜索 WordPress
curl "https://hono-mcp-demo.justincourse.site/api/wordpress/search?keywords=cloudflare"

# 搜索 FAQ
curl "https://hono-mcp-demo.justincourse.site/api/faq/list?keywords=部署"

# 统一搜索
curl "https://hono-mcp-demo.justincourse.site/api/search?keywords=mcp"
```

### 3. 测试 MCP 工具
使用 MCP Inspector 或 Claude Desktop 测试所有工具功能

---

## 📊 MCP 工具对比

| 工具名称 | 数据源 | 响应速度 | 适用场景 |
|---------|--------|---------|---------|
| `search_wordpress_posts` | WordPress API | 中等 | 查找博客文章 |
| `list_faq_documents` | D1 索引 | 快速 | 浏览 FAQ 列表 |
| `get_faq_document` | R2 + D1 | 快速 | 获取完整文档 |
| `search_knowledge_base` | 两者 | 中等 | 综合搜索 |

---

## 🎯 下一步优化建议

1. **定期索引任务**: 使用 Cloudflare Cron Triggers 定期重新索引
2. **全文搜索**: 考虑使用 Cloudflare Vectorize 进行语义搜索
3. **缓存优化**: 使用 KV 缓存热门查询结果
4. **AI 增强**: 使用 Cloudflare AI 对搜索结果进行智能排序和摘要

---

## 📞 支持

如有问题，请查看：
- 主文档: `README.md`
- 修复说明: `FIX_NOTES.md`
- API 列表: `GET /api`
