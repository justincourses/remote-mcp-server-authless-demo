// Test script for MCP SSE endpoint
const SERVER_URL = 'https://hono-mcp-demo.justincourse.site';

async function testMCPConnection() {
    console.log('🔍 Step 1: Connecting to SSE endpoint to get session...\n');

    try {
        // Step 1: Connect to /sse to get the session endpoint
        const response = await fetch(`${SERVER_URL}/sse`);

        if (!response.ok) {
            console.error(`❌ Failed to connect: ${response.status} ${response.statusText}`);
            return;
        }

        console.log('✅ Connected to SSE endpoint');
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Read first chunk to get the endpoint
        const { value, done } = await reader.read();
        if (done) {
            console.error('❌ Stream ended before receiving endpoint');
            return;
        }

        buffer += decoder.decode(value, { stream: true });
        console.log('\n📨 Received SSE data:');
        console.log(buffer);

        // Parse the endpoint
        const lines = buffer.split('\n');
        let sessionEndpoint = null;

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                sessionEndpoint = line.substring(6).trim();
                break;
            }
        }

        if (!sessionEndpoint) {
            console.error('❌ Could not parse session endpoint from SSE data');
            return;
        }

        console.log(`\n✅ Got session endpoint: ${sessionEndpoint}`);

        // Step 2: Test calling list-tools on the session endpoint
        console.log('\n🔍 Step 2: Calling list-tools via POST to session endpoint...\n');

        const fullUrl = `${SERVER_URL}${sessionEndpoint}`;
        console.log(`Posting to: ${fullUrl}`);

        const toolsResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/list',
                params: {}
            })
        });

        console.log(`Response status: ${toolsResponse.status} ${toolsResponse.statusText}`);
        console.log('Response headers:', Object.fromEntries(toolsResponse.headers.entries()));

        if (!toolsResponse.ok) {
            const errorText = await toolsResponse.text();
            console.error(`❌ list-tools failed: ${errorText}`);
            return;
        }

        const toolsData = await toolsResponse.json();
        console.log('\n✅ Tools list response:');
        console.log(JSON.stringify(toolsData, null, 2));

        // Step 3: Test calling a tool
        if (toolsData.result && toolsData.result.tools && toolsData.result.tools.length > 0) {
            const firstTool = toolsData.result.tools[0];
            console.log(`\n🔍 Step 3: Testing tool "${firstTool.name}"...\n`);

            let toolCallBody;
            if (firstTool.name === 'add') {
                toolCallBody = {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/call',
                    params: {
                        name: 'add',
                        arguments: { a: 5, b: 3 }
                    }
                };
            } else if (firstTool.name === 'calculate') {
                toolCallBody = {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/call',
                    params: {
                        name: 'calculate',
                        arguments: { operation: 'add', a: 10, b: 20 }
                    }
                };
            }

            if (toolCallBody) {
                const callResponse = await fetch(fullUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(toolCallBody)
                });

                if (callResponse.ok) {
                    const callData = await callResponse.json();
                    console.log('✅ Tool call response:');
                    console.log(JSON.stringify(callData, null, 2));
                } else {
                    console.error(`❌ Tool call failed: ${callResponse.status}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testMCPConnection();
