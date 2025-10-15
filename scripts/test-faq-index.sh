#!/bin/zsh

# FAQ 索引功能测试脚本

echo "🧪 FAQ 索引功能测试"
echo "===================="
echo ""

BASE_URL="https://hono-mcp-demo.justincourse.site"

# 测试 1: 查看索引状态
echo "📊 测试 1: 查看已索引的 FAQ 文档"
echo "-----------------------------------"
curl -s "$BASE_URL/api/faq/list?limit=3" | jq '{
  status,
  count,
  documents: .documents | map({id, title, fileName})
}'
echo ""

# 测试 2: 搜索 FAQ
echo "🔍 测试 2: 搜索包含 '课程' 的 FAQ"
echo "-----------------------------------"
curl -s "$BASE_URL/api/faq/list?keywords=课程&limit=5" | jq '{
  status,
  count,
  results: .documents | map({id, title})
}'
echo ""

# 测试 3: 获取单个文档
echo "📄 测试 3: 获取 FAQ 文档详情 (ID=1)"
echo "-----------------------------------"
curl -s "$BASE_URL/api/faq/1" | jq '{
  status,
  document: .document | {id, title, description, tags, fileName}
}'
echo ""

# 测试 4: 统一搜索
echo "🔎 测试 4: 统一搜索 (WordPress + FAQ)"
echo "-----------------------------------"
curl -s "$BASE_URL/api/search?keywords=cloudflare" | jq '{
  status,
  keywords,
  wordpress: .results.wordpress | {count, posts: .posts | map(.title)},
  faq: .results.faq | {count, documents: .documents | map(.title)}
}'
echo ""

# 测试 5: 重新索引
echo "🔄 测试 5: 重新索引 R2 中的 FAQ 文档"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL/api/faq/index" | jq '{
  status,
  message,
  total,
  indexed,
  prefix,
  file_count: .files | length
}'
echo ""

echo "✅ 测试完成！"
echo ""
echo "💡 提示："
echo "  - 总共索引了 $(curl -s "$BASE_URL/api/faq/list" | jq -r '.count') 个 FAQ 文档"
echo "  - R2 路径: justincourse-faq/"
echo "  - D1 表名: faq_index"
echo ""
echo "📖 下一步："
echo "  - 使用 MCP Inspector 测试 MCP 工具"
echo "  - 运行: npx @modelcontextprotocol/inspector"
echo "  - 连接: $BASE_URL/sse"
echo "  - 测试工具: search_knowledge_base, list_faq_documents, get_faq_document"
