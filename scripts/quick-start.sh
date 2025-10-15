#!/bin/zsh

# 快速开始指南 - MCP 知识库助手

echo "🚀 MCP 知识库助手 - 快速开始"
echo "================================"
echo ""

BASE_URL="https://hono-mcp-demo.justincourse.site"

echo "📋 步骤 1: 上传示例 FAQ 文档到 R2"
echo "运行以下命令："
echo "  wrangler r2 object put course-demo/justincourse-faq/cloudflare-mcp-deployment.md --file=example-faq.md"
echo ""
read -q "REPLY?已完成上传？(y/n) "
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ 继续..."
else
    echo "❌ 请先上传文档"
    exit 1
fi
echo ""

echo "📊 步骤 2: 索引 FAQ 文档"
echo "正在索引..."
INDEX_RESULT=$(curl -s -X POST "$BASE_URL/api/faq/index")
echo $INDEX_RESULT | jq '.'
echo ""

INDEXED_COUNT=$(echo $INDEX_RESULT | jq -r '.indexed')
if [[ $INDEXED_COUNT -gt 0 ]]; then
    echo "✅ 成功索引 $INDEXED_COUNT 个文档"
else
    echo "⚠️  没有找到文档，请确认 R2 路径正确"
fi
echo ""

echo "🔍 步骤 3: 测试搜索功能"
echo ""

echo "3.1 搜索 WordPress 文章（关键词: mcp）..."
curl -s "$BASE_URL/api/wordpress/search?keywords=mcp&per_page=2" | jq '{status, count, posts: .posts[].title}'
echo ""

echo "3.2 搜索 FAQ 文档（关键词: cloudflare）..."
curl -s "$BASE_URL/api/faq/list?keywords=cloudflare&limit=3" | jq '{status, count, documents: .documents[].title}'
echo ""

echo "3.3 统一搜索（关键词: workers）..."
curl -s "$BASE_URL/api/search?keywords=workers" | jq '{status, keywords, wordpress_count: .results.wordpress.count, faq_count: .results.faq.count}'
echo ""

echo "📱 步骤 4: 测试 MCP 工具"
echo ""
echo "使用 MCP Inspector 测试："
echo "  1. 运行: npx @modelcontextprotocol/inspector"
echo "  2. 连接到: $BASE_URL/sse"
echo "  3. 测试工具列表:"
echo ""
echo "     🔧 search_knowledge_base"
echo "        示例: {\"keywords\": \"cloudflare mcp\", \"sources\": \"all\"}"
echo ""
echo "     🔧 search_wordpress_posts"
echo "        示例: {\"keywords\": \"workers\", \"per_page\": 5}"
echo ""
echo "     🔧 list_faq_documents"
echo "        示例: {\"keywords\": \"部署\", \"limit\": 10}"
echo ""
echo "     🔧 get_faq_document"
echo "        示例: {\"id\": 1}"
echo ""

echo "📚 步骤 5: 集成到 Claude Desktop"
echo ""
echo "编辑 Claude Desktop 配置文件，添加："
cat << 'EOF'
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
EOF
echo ""

echo "✅ 快速开始完成！"
echo ""
echo "📖 更多信息："
echo "  - 完整功能文档: KNOWLEDGE_BASE_FEATURES.md"
echo "  - 项目总结: PROJECT_SUMMARY.md"
echo "  - API 端点列表: curl $BASE_URL/api"
echo ""
echo "💬 需要帮助？查看文档或运行 ./test-knowledge-base.sh 进行完整测试"
