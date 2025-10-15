# MCP 最佳实践 - 工具优化说明

## 📋 更新日期
2025年10月15日

## 🎯 优化目标
根据 MCP 最佳实践，优化工具描述和参数说明，提升 AI 助手的使用体验和响应质量。

---

## ✨ 主要改进

### 1. 新增使用指南工具 `how_to_use`

**目的:** 为 AI 提供完整的使用说明和推荐工作流

**特点:**
- 🎓 详细的工具介绍和使用场景
- 💡 推荐的查询工作流程
- 🏷️ 可用主题和分类列表
- 💬 具体的使用示例

**使用场景:**
```typescript
// AI 不确定如何开始时
{
  "tool": "how_to_use",
  "arguments": {}
}
```

**返回内容包括:**
- 所有可用工具及最佳使用场景
- 针对不同查询类型的推荐工作流
- WordPress 分类和 FAQ 主题列表
- 实际查询示例

---

### 2. 增强型工具描述

所有工具都包含了：

#### ✅ 丰富的元信息标识
- 🌟 `search_knowledge_base` - 标记为推荐入口
- 📰 `search_wordpress_posts` - 博客搜索专用
- 📚 `list_faq_documents` - FAQ 浏览工具
- 📄 `get_faq_document` - 文档读取工具

#### ✅ 详细的使用场景说明
每个工具都明确说明：
- **何时使用**：适合的查询类型
- **搜索范围**：数据来源和覆盖范围
- **返回内容**：结果格式和元数据

#### ✅ 智能参数描述
```typescript
// Before:
keywords: z.string().describe("Keywords to search")

// After:
keywords: z.string().describe(
  "Search keywords. Can be multi-word queries. " +
  "Examples: 'cloudflare workers deployment', 'course payment methods', " +
  "'如何报名课程', 'mcp server setup'"
)
```

---

## 🔧 工具详细说明

### 1️⃣ how_to_use
```typescript
Tool: "how_to_use"
Description: "ℹ️ **START HERE IF UNSURE** - Get usage instructions..."
Parameters: {} // 无参数
Returns: 完整使用指南 (3000+ 字符)
```

**特色:**
- 零参数调用，无需用户输入
- 返回完整的知识库使用手册
- 包含 WordPress 分类和 FAQ 主题列表
- 提供具体的查询示例

### 2️⃣ search_knowledge_base ⭐ 推荐入口
```typescript
Tool: "search_knowledge_base"
Description: "🌟 **RECOMMENDED START POINT** - Intelligent search..."
Parameters: {
  keywords: string (必需),
  sources: "all" | "wordpress" | "faq" (可选，默认 "all"),
  max_results: number (可选，1-10，默认 5)
}
```

**WordPress API 集成:**
- Base URL: `https://app.justincourse.com/wp-json/wp/v2`
- 支持 `_embed` 参数获取分类和标签
- 返回发布日期、分类、标签、摘要

**FAQ 搜索特性:**
- 全文索引：title + description + tags
- JSON 标签解析和展示
- 返回文档 ID 供深入阅读

**返回格式:**
```markdown
# 🔍 Search Results for "keywords"

## 📰 WordPress Posts (N results)
1. 📄 **Post Title**
   🔗 Link: https://...
   📅 Published: 2025-10-15
   📁 Categories: Web Development, Cloudflare
   🏷️  Tags: MCP, Workers, TypeScript
   📝 Excerpt...

## 📚 FAQ Documents (M results)
1. 📚 **FAQ Title** (ID: 5)
   🏷️  Tags: 课程, 报名
   📝 Description...
   💡 Use get_faq_document(5) to read full content

---
💡 **Next Steps:**
- Use get_faq_document(id) to read full FAQ content
- Click WordPress post links to read full articles
```

### 3️⃣ search_wordpress_posts
```typescript
Tool: "search_wordpress_posts"
Description: "📰 Search JustinCourse blog posts about web development..."
Parameters: {
  keywords: string (必需),
  search_in: "title" | "content" | "all" (可选，默认 "all"),
  per_page: number (可选，1-100，默认 10)
}
```

**WordPress 元数据:**
- 发布日期
- 分类（Categories）
- 标签（Tags）
- 特色图片（通过 _embed）
- HTML 摘要（自动去除标签）

**使用示例:**
```typescript
// 搜索 Cloudflare 相关文章
{
  "keywords": "cloudflare workers",
  "search_in": "all",
  "per_page": 5
}
```

### 4️⃣ list_faq_documents
```typescript
Tool: "list_faq_documents"
Description: "📚 Browse frequently asked questions about JustinCourse..."
Parameters: {
  keywords: string (可选),
  limit: number (可选，1-50，默认 20)
}
```

**搜索能力:**
- 标题匹配（title）
- 描述匹配（description）
- 标签匹配（tags，JSON 数组）
- SQL LIKE 模糊匹配

**FAQ 主题覆盖:**
- 课程报名（Enrollment）
- 付费方式（Payment）
- 学习要求（Prerequisites）
- 课程形式（Course Format）
- 技术支持（Technical Support）

### 5️⃣ get_faq_document
```typescript
Tool: "get_faq_document"
Description: "📄 Retrieve the complete content of a specific FAQ..."
Parameters: {
  id: number (必需)
}
```

**数据流:**
1. 从 D1 查询索引（metadata）
2. 从 R2 读取完整内容（Markdown）
3. 解析 JSON 标签
4. 格式化返回

**返回格式:**
```markdown
# FAQ Title

**File:** filename.md
**Tags:** tag1, tag2, tag3
**Description:** Short description
**Last Indexed:** 2025-10-15 11:30:00

---

[完整 Markdown 内容]
```

---

## 🌐 WordPress API 详细信息

### 可用端点
```
Base: https://app.justincourse.com/wp-json/wp/v2

/posts          - 文章列表和搜索
/categories     - 分类列表
/tags           - 标签列表
/posts/:id      - 单篇文章详情
```

### 常用参数
```typescript
search: string          // 全文搜索
per_page: number        // 每页结果数 (max 100)
page: number            // 页码
_embed: "1"             // 嵌入媒体和分类信息
orderby: string         // 排序字段
order: "asc" | "desc"   // 排序方向
categories: number[]    // 按分类筛选
tags: number[]          // 按标签筛选
```

### 返回的嵌入数据 (_embed=1)
```typescript
{
  "_embedded": {
    "wp:term": [
      [...categories],  // [0] - 分类数组
      [...tags]         // [1] - 标签数组
    ],
    "wp:featuredmedia": [...],  // 特色图片
    "author": [...]              // 作者信息
  }
}
```

---

## 📊 FAQ 文档格式规范

### Markdown Frontmatter
```markdown
---
title: 文档标题
description: 简短描述（用于搜索索引）
tags: [标签1, 标签2, 标签3]
---

# 正文标题

内容...
```

### 数据库 Schema
```sql
CREATE TABLE faq_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT,              -- JSON 数组字符串
  r2_key TEXT NOT NULL,
  last_indexed DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### R2 存储路径
```
bucket: course-demo
path: justincourse-faq/*.md
```

---

## 💡 AI 使用建议

### 推荐工作流

#### 场景 1: 用户提出通用问题
```
1. 调用 search_knowledge_base(keywords)
2. 评估结果：
   - 如果有相关 FAQ → 调用 get_faq_document(id)
   - 如果有相关博客 → 返回链接供用户访问
3. 整合信息，给出答案
```

#### 场景 2: 用户询问课程相关问题
```
1. 调用 list_faq_documents(keywords="课程")
2. 列出相关 FAQ 供用户选择
3. 根据用户选择调用 get_faq_document(id)
4. 返回完整答案
```

#### 场景 3: 用户寻找技术教程
```
1. 调用 search_wordpress_posts(keywords="技术名称")
2. 展示文章列表（标题、分类、日期）
3. 推荐最相关的文章链接
```

#### 场景 4: AI 不确定如何操作
```
1. 调用 how_to_use()
2. 阅读使用指南
3. 根据指南选择合适的工具
```

### 关键词优化建议

**WordPress 搜索关键词:**
- 技术栈名称：`cloudflare`, `nextjs`, `typescript`
- 功能特性：`deployment`, `authentication`, `api`
- 教程类型：`tutorial`, `course`, `demo`

**FAQ 搜索关键词:**
- 中文：`课程`, `报名`, `付费`, `学习`
- English: `course`, `enrollment`, `payment`, `learning`
- 混合：`mcp 部署`, `cloudflare 配置`

---

## 🚀 部署和测试

### 部署命令
```bash
npm run deploy
```

### 测试方法

#### 1. MCP Inspector
```bash
npx @modelcontextprotocol/inspector
```
连接到: `https://hono-mcp-demo.justincourse.site/sse`

**测试用例:**
```json
// Test 1: 使用指南
{
  "tool": "how_to_use",
  "arguments": {}
}

// Test 2: 统一搜索
{
  "tool": "search_knowledge_base",
  "arguments": {
    "keywords": "cloudflare workers",
    "sources": "all",
    "max_results": 5
  }
}

// Test 3: WordPress 搜索
{
  "tool": "search_wordpress_posts",
  "arguments": {
    "keywords": "mcp",
    "per_page": 5
  }
}

// Test 4: FAQ 列表
{
  "tool": "list_faq_documents",
  "arguments": {
    "keywords": "课程",
    "limit": 10
  }
}

// Test 5: 读取 FAQ
{
  "tool": "get_faq_document",
  "arguments": {
    "id": 1
  }
}
```

#### 2. REST API 测试
```bash
# 测试所有端点
./scripts/test-knowledge-base.sh

# 或手动测试
curl "https://hono-mcp-demo.justincourse.site/api/search?keywords=mcp"
```

---

## 📈 性能优化建议

### 当前配置
- WordPress API: 默认 5 个结果（可配置到 100）
- FAQ 搜索: 默认 20 个结果（可配置到 50）
- D1 查询: 使用索引的 LIKE 查询

### 优化方向
1. **缓存策略**
   - 缓存 WordPress API 响应（5-15分钟）
   - 缓存热门 FAQ 查询结果

2. **索引优化**
   - D1 全文搜索索引
   - 标签字段 JSON 索引

3. **结果排序**
   - WordPress: 按相关性排序（API 默认）
   - FAQ: 添加权重排序（标题匹配 > 描述匹配 > 标签匹配）

---

## 🔄 版本历史

### v2.1.0 (2025-10-15)
- ✨ 新增 `how_to_use` 使用指南工具
- 📝 增强所有工具的描述和参数说明
- 🎯 标记推荐入口工具
- 📊 添加 WordPress API 详细信息
- 💡 提供 AI 使用建议和工作流

### v2.0.0 (2025-10-15)
- 🚀 知识库功能完整实现
- 🔗 WordPress API 集成
- 📚 FAQ 文档索引系统
- 🤖 4 个核心 MCP 工具

---

## 📚 相关文档

- [功能文档](./KNOWLEDGE_BASE_FEATURES.md)
- [项目总结](./PROJECT_SUMMARY.md)
- [完整核对清单](./CHECKLIST.md)
- [主 README](../README.md)

---

**Made with ❤️ by JustinCourse**
