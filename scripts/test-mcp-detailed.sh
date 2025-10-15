#!/bin/zsh

# Test MCP Server with detailed output
BASE_URL="https://hono-mcp-demo.justincourse.site"

echo "🔍 Testing MCP Server at $BASE_URL"
echo ""

# Get sessionId
echo "📡 Step 1: Getting sessionId..."
SESSION_INFO=$(timeout 3 curl -s -N -H "Accept: text/event-stream" "$BASE_URL/sse" 2>/dev/null | head -n 2)
SESSION_ID=$(echo "$SESSION_INFO" | grep "data:" | sed 's/.*sessionId=\([a-f0-9]*\).*/\1/')
echo "✓ SessionId: $SESSION_ID"
echo ""

if [ -z "$SESSION_ID" ]; then
    echo "❌ Failed to get sessionId"
    exit 1
fi

MESSAGE_URL="$BASE_URL/sse/message?sessionId=$SESSION_ID"

# Initialize
echo "📡 Step 2: Initializing MCP session..."
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

INIT_RESPONSE=$(curl -s -X POST "$MESSAGE_URL" \
    -H "Content-Type: application/json" \
    -d "$INIT_REQUEST")

echo "$INIT_RESPONSE" | jq '.' 2>/dev/null || echo "$INIT_RESPONSE"
echo ""

# Wait a bit for SSE response
echo "⏳ Waiting for initialization response via SSE..."
timeout 2 curl -s -N -H "Accept: text/event-stream" "$MESSAGE_URL" 2>/dev/null | head -n 10
echo ""
echo ""

# List tools
echo "📡 Step 3: Listing available tools..."
LIST_TOOLS_REQUEST='{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
}'

curl -s -X POST "$MESSAGE_URL" \
    -H "Content-Type: application/json" \
    -d "$LIST_TOOLS_REQUEST"
echo ""
echo ""

# Get SSE response for tools list
echo "⏳ Waiting for tools list response via SSE..."
timeout 3 curl -s -N -H "Accept: text/event-stream" "$MESSAGE_URL" 2>/dev/null | head -n 20
echo ""
echo ""

# Test calculator tool
echo "📡 Step 4: Testing 'add' tool (2 + 3)..."
CALL_TOOL_REQUEST='{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
        "name": "add",
        "arguments": {
            "a": 2,
            "b": 3
        }
    }
}'

curl -s -X POST "$MESSAGE_URL" \
    -H "Content-Type: application/json" \
    -d "$CALL_TOOL_REQUEST"
echo ""
echo ""

echo "⏳ Waiting for tool call response via SSE..."
timeout 3 curl -s -N -H "Accept: text/event-stream" "$MESSAGE_URL" 2>/dev/null | head -n 10
echo ""

echo "✅ Test complete"
