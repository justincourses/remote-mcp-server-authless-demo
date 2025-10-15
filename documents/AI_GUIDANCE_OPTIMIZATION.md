# MCP 工具优化 - 引导 AI 组合使用文档

## 📅 更新日期
2025年10月15日

## 🎯 优化目标

基于用户反馈，优化 MCP 工具以实现：

1. ✅ **鼓励 AI 查询 WordPress API** - 强调 WordPress 包含最详细的课程内容
2. ✅ **引导用户访问官网** - 在所有响应中包含 https://justincourse.com
3. ✅ **推荐组合查询路径** - FAQ 快速答案 + WordPress 详细内容 = 完整回答

---

## 🔄 关键改进

### 1. 使用指南工具 (`how_to_use`) 的增强

#### 新增内容：

**🌐 官网链接置顶**
```markdown
🌐 Official Website: https://justincourse.com
📚 Course Platform: https://app.justincourse.com
```

**💡 强调组合使用工作流**
```markdown
### 🎓 For Course-Related Questions:
**ALWAYS combine FAQ + WordPress for complete answers!**

1. First: Check FAQ basics
2. Then: Search WordPress for detailed content
3. Finally: Synthesize both sources
4. Always include: Official website link
```

**❌ 反面示例**
```markdown
### ❌ DON'T: Single source only
User: "Tell me about courses"
Bad: Only use list_faq_documents("课程")
Why: Missing detailed course content from WordPress
```

**✅ 正面示例**
```markdown
### ✅ DO: Combine multiple sources
User: "Tell me about courses"
Good Flow:
1. list_faq_documents("课程") → Quick enrollment info
2. search_wordpress_posts("course") → Detailed curriculum
3. Synthesize both → Complete answer
4. Include → https://justincourse.com
```

---

### 2. `search_knowledge_base` 工具优化

#### 工具描述更新：
保持为推荐入口点，但强调综合搜索能力

#### 输出格式增强：

**更清晰的分类标题**
```markdown
## 📰 WordPress Course Content & Tutorials (N results)
## 📚 FAQ Quick Answers (M results)
```

**智能化的下一步建议**
```typescript
// 根据搜索结果给出针对性建议
if (wpCount > 0 && faqCount > 0) {
  // 两种来源都有 → 建议组合使用
  output += `✅ BEST APPROACH - Combine Both Sources:
1. Read FAQ documents for quick answers
2. Visit WordPress articles for detailed tutorials
3. Synthesize both sources into comprehensive answer`;
}
```

**强制包含官网链接**
```markdown
**🌐 Official Resources:**
- 🏠 Main Website: https://justincourse.com
- 📚 Course Platform: https://app.justincourse.com
- 💡 For enrollment → Visit https://justincourse.com
```

---

### 3. `search_wordpress_posts` 工具优化

#### 工具描述重写：
```typescript
"📰 **PRIMARY SOURCE FOR COURSE DETAILS** -
Search WordPress for detailed course curriculum, full tutorials,
technical articles, and course announcements. WordPress contains
the MOST COMPREHENSIVE course information including syllabi,
lesson content, project examples, and technical deep-dives.
ALWAYS use this when users ask about course content, what they'll
learn, or need detailed technical tutorials."
```

**关键词：PRIMARY SOURCE, MOST COMPREHENSIVE, ALWAYS use**

#### 参数说明增强：
```typescript
keywords: "For courses use: 'web course', 'course 课程',
'cloudflare workers course'. For tech: 'typescript tutorial',
'next.js deployment'. Supports both English and Chinese."
```

#### 输出格式优化：

**更长的摘要**
```typescript
excerpt.substring(0, 250) // 从 200 增加到 250 字符
```

**智能检测课程内容**
```typescript
const hasCourseMaterial = posts.some(post =>
  post.title.includes('course') ||
  post.title.includes('课程') ||
  post.title.includes('web course')
);

if (hasCourseMaterial) {
  output += `🎓 Course-related posts found!
             Visit articles for full curriculum details`;
}
```

**明确的使用指导**
```markdown
💡 **How to Use These Results:**
- Click the "Full Article" links for complete tutorials
- These articles contain detailed course content and examples

**💬 For Best Answers:**
1. Read WordPress articles above for detailed content
2. Use list_faq_documents() to find related quick answers
3. Combine both sources to provide comprehensive responses

**🌐 Official Resources:**
- 🏠 Course Registration: https://justincourse.com
- 📚 All Articles: https://app.justincourse.com
```

---

### 4. `list_faq_documents` 工具优化

#### 工具描述保持不变
仍然定位为快速答案来源

#### 输出格式增强：

**空结果时的建议**
```typescript
if (results.length === 0) {
  const suggestion = keywords
    ? `Try: search_wordpress_posts("${keywords}")
       for detailed course content`
    : `Try: search_wordpress_posts("course")
       to browse all available courses`;

  return suggestion;
}
```

**结果中的组合使用提示**
```markdown
💡 **Recommended Next Steps:**
1. **Read FAQs:** Use get_faq_document(id) for full answers
2. **Get Detailed Content:** Use search_wordpress_posts()
   for in-depth tutorials
3. **Combine Sources:** Merge FAQ + WordPress for complete responses

**🌐 Need More Info?**
- 📚 Browse all articles: https://app.justincourse.com
- 🏠 Course registration: https://justincourse.com
```

---

## 🎯 AI 行为引导策略

### 策略 1: 描述层面的强调

**使用强有力的关键词：**
- "PRIMARY SOURCE" (主要来源)
- "MOST COMPREHENSIVE" (最全面)
- "ALWAYS use" (总是使用)
- "RECOMMENDED" (推荐)
- "BEST APPROACH" (最佳方法)

**示例：**
```typescript
"📰 **PRIMARY SOURCE FOR COURSE DETAILS** - WordPress contains
the MOST COMPREHENSIVE course information. ALWAYS use this when
users ask about course content."
```

### 策略 2: 输出层面的引导

**每个工具输出都包含：**
1. 📊 当前结果展示
2. 💡 下一步建议（明确指向其他工具）
3. 🌐 官网链接（引导用户访问）

**示例结构：**
```markdown
# 搜索结果

[结果展示]

---
💡 **Recommended Next Steps:**
- Do X
- Try Y
- Combine Z

**🌐 Official Resources:**
- Website: https://justincourse.com
```

### 策略 3: 工作流层面的引导

**在使用指南中提供完整工作流：**

```markdown
### For Course-Related Questions:
1. First: list_faq_documents() → Quick facts
2. Then: search_wordpress_posts() → Detailed content
3. Finally: Synthesize → Complete answer
4. Always: Include official website link
```

**强调反面案例：**
```markdown
❌ DON'T: Only use one source
✅ DO: Combine multiple sources
```

---

## 📊 预期效果

### Before (之前)
```
User: "Tell me about courses"
AI: [Only searches FAQ]
Response: "Found 3 FAQs about courses..."
```

### After (之后)
```
User: "Tell me about courses"
AI: [Searches both FAQ and WordPress]
Response:
"**Course Information** (from FAQ):
- Enrollment process: ...
- Payment methods: ...

**Course Details** (from WordPress):
- Web Course: Full-stack development with Cloudflare...
- [Link to full article]

**Next Steps:**
→ Explore curriculum: https://app.justincourse.com
→ Register: https://justincourse.com"
```

---

## 🧪 测试场景

### 测试 1: 课程询问
```json
{
  "query": "介绍一下 JustinCourse 的课程",
  "expected_behavior": [
    "调用 list_faq_documents('课程')",
    "调用 search_wordpress_posts('course')",
    "综合两个结果",
    "包含官网链接"
  ]
}
```

### 测试 2: 技术问题
```json
{
  "query": "How to deploy to Cloudflare Workers?",
  "expected_behavior": [
    "调用 search_wordpress_posts('cloudflare workers deployment')",
    "提供详细文章链接",
    "建议查看相关 FAQ",
    "包含官网链接"
  ]
}
```

### 测试 3: 报名问题
```json
{
  "query": "如何报名课程？",
  "expected_behavior": [
    "调用 list_faq_documents('报名')",
    "读取相关 FAQ 详情",
    "搜索 WordPress 相关课程",
    "引导访问 https://justincourse.com 报名"
  ]
}
```

---

## 📝 更新清单

### ✅ 已完成

- [x] 更新 `how_to_use` - 添加官网链接和组合使用指南
- [x] 优化 `search_knowledge_base` - 智能化下一步建议
- [x] 增强 `search_wordpress_posts` - 强调为主要内容源
- [x] 改进 `list_faq_documents` - 添加组合使用提示
- [x] 所有工具输出包含官网链接
- [x] 所有工具输出包含组合使用建议
- [x] 编译检查通过

### 📋 待测试

- [ ] 部署到生产环境
- [ ] MCP Inspector 测试完整工作流
- [ ] Claude Desktop 集成测试
- [ ] 实际对话场景验证

---

## 🚀 部署命令

```bash
# 部署更新
npm run deploy

# 测试
npx @modelcontextprotocol/inspector
# 连接到: https://hono-mcp-demo.justincourse.site/sse
```

---

## 📚 相关文档

- [MCP 最佳实践](./MCP_BEST_PRACTICES.md)
- [功能文档](./KNOWLEDGE_BASE_FEATURES.md)
- [项目总结](./PROJECT_SUMMARY.md)
- [主 README](../README.md)

---

## 💡 总结

这次优化的核心思想是：

1. **明确定位** - WordPress = 详细内容，FAQ = 快速答案
2. **引导组合** - 在每个工具输出中推荐其他工具
3. **官网优先** - 所有响应都包含官网链接
4. **工作流清晰** - 提供具体的查询步骤和示例

通过这些优化，AI 将：
- ✅ 主动查询 WordPress API 获取详细课程内容
- ✅ 组合多个数据源提供完整答案
- ✅ 引导用户访问官网进行注册和深入了解

---

**Made with ❤️ by JustinCourse**
