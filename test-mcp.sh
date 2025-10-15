#!/bin/zsh

# Test MCP Server
BASE_URL="https://hono-mcp-demo.justincourse.site"

echo "🔍 Testing MCP Server at $BASE_URL"
echo ""

# Test 1: Get SSE endpoint (with timeout)
echo "📡 Test 1: Getting SSE endpoint..."
timeout 3 curl -N -H "Accept: text/event-stream" "$BASE_URL/sse" 2>/dev/null || echo "(Connection closed after 3s - expected for SSE)"
echo ""
echo ""

# Test 2: Extract sessionId and test message endpoint
echo "📡 Test 2: Extracting sessionId..."
SESSION_INFO=$(timeout 3 curl -s -N -H "Accept: text/event-stream" "$BASE_URL/sse" 2>/dev/null | head -n 2)
echo "Raw SSE response:"
echo "$SESSION_INFO"
echo ""

# Extract sessionId from the SSE data
SESSION_ID=$(echo "$SESSION_INFO" | grep "data:" | sed 's/.*sessionId=\([a-f0-9]*\).*/\1/')
echo "Extracted sessionId: $SESSION_ID"
echo ""

if [ -n "$SESSION_ID" ]; then
    # Test 3: Send MCP initialize request
    echo "📡 Test 3: Sending MCP initialize request..."
    MESSAGE_URL="$BASE_URL/sse/message?sessionId=$SESSION_ID"

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

    echo "Sending to: $MESSAGE_URL"
    curl -X POST "$MESSAGE_URL" \
        -H "Content-Type: application/json" \
        -d "$INIT_REQUEST" \
        2>/dev/null
    echo ""
    echo ""

    # Test 4: List tools
    echo "📡 Test 4: Listing tools..."
    LIST_TOOLS_REQUEST='{
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list"
    }'

    curl -X POST "$MESSAGE_URL" \
        -H "Content-Type: application/json" \
        -d "$LIST_TOOLS_REQUEST" \
        2>/dev/null
    echo ""
else
    echo "❌ Failed to extract sessionId"
fi

echo ""
echo "✅ Test complete"
