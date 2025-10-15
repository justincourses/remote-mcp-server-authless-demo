#!/bin/zsh

# 测试 MCP 工具的 AI 引导优化

echo "🧪 MCP AI 引导优化测试"
echo "========================"
echo ""

BASE_URL="https://hono-mcp-demo.justincourse.site"

echo "📋 测试场景："
echo "1. 课程询问 - 应该组合 FAQ + WordPress"
echo "2. 技术问题 - 应该优先 WordPress"
echo "3. 报名问题 - FAQ + 官网引导"
echo ""

# 获取 MCP session
echo "🔌 连接 MCP 服务器..."
SESSION_INFO=$(timeout 3 curl -s -N -H "Accept: text/event-stream" "$BASE_URL/sse" 2>/dev/null | head -n 2)
SESSION_ID=$(echo "$SESSION_INFO" | grep "data:" | sed 's/.*sessionId=\([a-f0-9]*\).*/\1/')

if [ -z "$SESSION_ID" ]; then
    echo "❌ 无法获取 session ID，改用 REST API 测试"
    echo ""

    # 测试 REST API
    echo "📊 测试 1: 搜索课程相关内容"
    echo "----------------------------"
    curl -s "$BASE_URL/api/search?keywords=课程" | jq -r '.results | "\nWordPress 结果数: \(.wordpress.count)\nFAQ 结果数: \(.faq.count)"'
    echo ""

    echo "📊 测试 2: WordPress 详细内容搜索"
    echo "--------------------------------"
    curl -s "$BASE_URL/api/wordpress/search?keywords=web%20course&per_page=3" | jq -r '.posts | length as $count | "找到 \($count) 篇文章\n\n文章标题:\n" + (map("- " + .title) | join("\n"))'
    echo ""

    echo "📊 测试 3: FAQ 列表"
    echo "-------------------"
    curl -s "$BASE_URL/api/faq/list?keywords=报名&limit=3" | jq -r '.documents | length as $count | "找到 \($count) 个FAQ\n\nFAQ 标题:\n" + (map("- " + .title) | join("\n"))'
    echo ""

    echo "✅ REST API 测试完成"
    echo ""
    echo "💡 建议："
    echo "  - 使用 MCP Inspector 测试完整工具: npx @modelcontextprotocol/inspector"
    echo "  - 连接到: $BASE_URL/sse"
    echo "  - 测试 how_to_use 工具查看完整使用指南"
    echo "  - 测试 search_knowledge_base 验证组合搜索"
    echo "  - 检查输出是否包含官网链接: https://justincourse.com"
    exit 0
fi

MESSAGE_URL="$BASE_URL/sse/message?sessionId=$SESSION_ID"

echo "✅ Session ID: $SESSION_ID"
echo ""

# 初始化 MCP
echo "🔧 初始化 MCP..."
INIT_REQUEST='{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {
            "name": "test-client",
            "version": "1.0.0"
        }
    }
}'

curl -s -X POST "$MESSAGE_URL" \
    -H "Content-Type: application/json" \
    -d "$INIT_REQUEST" > /dev/null

echo "✅ MCP 已初始化"
echo ""

# 测试 1: how_to_use 工具
echo "📋 测试 1: 使用指南工具 (how_to_use)"
echo "------------------------------------"
HELP_REQUEST='{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
        "name": "how_to_use",
        "arguments": {}
    }
}'

HELP_RESPONSE=$(curl -s -X POST "$MESSAGE_URL" \
    -H "Content-Type: application/json" \
    -d "$HELP_REQUEST")

echo "$HELP_RESPONSE" | jq -r '.result.content[0].text' | head -30
echo "... (查看前30行)"
echo ""

# 检查关键内容
if echo "$HELP_RESPONSE" | grep -q "justincourse.com"; then
    echo "✅ 包含官网链接"
else
    echo "❌ 缺少官网链接"
fi

if echo "$HELP_RESPONSE" | grep -q "COMBINE"; then
    echo "✅ 包含组合使用建议"
else
    echo "❌ 缺少组合使用建议"
fi

if echo "$HELP_RESPONSE" | grep -q "PRIMARY SOURCE"; then
    echo "✅ 强调 WordPress 为主要内容源"
else
    echo "⚠️  未明确标注 WordPress 为主要来源"
fi

echo ""

# 测试 2: search_knowledge_base
echo "📋 测试 2: 统一搜索 (search_knowledge_base)"
echo "-------------------------------------------"
SEARCH_REQUEST='{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
        "name": "search_knowledge_base",
        "arguments": {
            "keywords": "课程",
            "sources": "all",
            "max_results": 3
        }
    }
}'

SEARCH_RESPONSE=$(curl -s -X POST "$MESSAGE_URL" \
    -H "Content-Type: application/json" \
    -d "$SEARCH_REQUEST")

echo "$SEARCH_RESPONSE" | jq -r '.result.content[0].text' | grep -E "(WordPress|FAQ|justincourse)" | head -15
echo ""

# 检查关键内容
if echo "$SEARCH_RESPONSE" | grep -q "justincourse.com"; then
    echo "✅ 包含官网链接"
else
    echo "❌ 缺少官网链接"
fi

if echo "$SEARCH_RESPONSE" | grep -q "BEST APPROACH\|Recommended Next Steps"; then
    echo "✅ 包含下一步建议"
else
    echo "❌ 缺少下一步建议"
fi

echo ""

# 测试 3: search_wordpress_posts
echo "📋 测试 3: WordPress 搜索 (search_wordpress_posts)"
echo "--------------------------------------------------"
WP_REQUEST='{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
        "name": "search_wordpress_posts",
        "arguments": {
            "keywords": "cloudflare",
            "per_page": 2
        }
    }
}'

WP_RESPONSE=$(curl -s -X POST "$MESSAGE_URL" \
    -H "Content-Type: application/json" \
    -d "$WP_REQUEST")

echo "$WP_RESPONSE" | jq -r '.result.content[0].text' | head -20
echo ""

if echo "$WP_RESPONSE" | grep -q "justincourse.com"; then
    echo "✅ 包含官网链接"
else
    echo "❌ 缺少官网链接"
fi

if echo "$WP_RESPONSE" | grep -q "Combine\|list_faq_documents"; then
    echo "✅ 建议组合使用其他工具"
else
    echo "❌ 未建议组合使用"
fi

echo ""

echo "✅ 测试完成！"
echo ""
echo "📊 总结："
echo "  - 所有工具应包含官网链接: https://justincourse.com"
echo "  - 工具输出应引导 AI 组合使用多个数据源"
echo "  - WordPress 应被标注为详细内容的主要来源"
echo ""
echo "💡 下一步："
echo "  - 使用 Claude Desktop 进行真实对话测试"
echo "  - 验证 AI 是否主动组合 FAQ + WordPress"
echo "  - 检查是否引导用户访问官网"
