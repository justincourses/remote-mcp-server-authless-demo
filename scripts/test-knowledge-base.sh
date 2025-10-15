#!/bin/zsh

# Test Knowledge Base Features
BASE_URL="https://hono-mcp-demo.justincourse.site"

echo "🧪 Testing Knowledge Base Features"
echo "=================================="
echo ""

# Test 1: Index FAQ documents
echo "📚 Test 1: Indexing FAQ documents..."
curl -X POST "$BASE_URL/api/faq/index" \
    -H "Content-Type: application/json" \
    2>/dev/null | jq '.'
echo ""
echo ""

# Test 2: List FAQ documents
echo "📋 Test 2: Listing FAQ documents..."
curl "$BASE_URL/api/faq/list?limit=5" \
    2>/dev/null | jq '.'
echo ""
echo ""

# Test 3: Search WordPress
echo "🔍 Test 3: Searching WordPress posts..."
curl "$BASE_URL/api/wordpress/search?keywords=cloudflare&per_page=3" \
    2>/dev/null | jq '.'
echo ""
echo ""

# Test 4: Unified search
echo "🔎 Test 4: Unified knowledge base search..."
curl "$BASE_URL/api/search?keywords=mcp" \
    2>/dev/null | jq '.'
echo ""
echo ""

# Test 5: Get FAQ document detail (if ID exists)
echo "📄 Test 5: Getting FAQ document detail (ID=1)..."
curl "$BASE_URL/api/faq/1" \
    2>/dev/null | jq '.'
echo ""
echo ""

# Test 6: List all API endpoints
echo "📡 Test 6: Listing all API endpoints..."
curl "$BASE_URL/api" \
    2>/dev/null | jq '.endpoints[] | {path, method, description}'
echo ""
echo ""

echo "✅ All tests completed!"
echo ""
echo "💡 Next steps:"
echo "1. Test MCP tools using: npx @modelcontextprotocol/inspector"
echo "2. Connect URL: $BASE_URL/sse"
echo "3. Available MCP tools:"
echo "   - search_wordpress_posts"
echo "   - list_faq_documents"
echo "   - get_faq_document"
echo "   - search_knowledge_base"
