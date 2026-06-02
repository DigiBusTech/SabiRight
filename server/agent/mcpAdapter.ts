import { FunctionTool } from '@google/adk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';

/**
 * Utility to connect to an MCP server and expose its tools as Google ADK tools.
 */
export async function getMcpTools(serverPath: string) {
  const tsxPath = process.platform === 'win32' 
    ? path.join(process.cwd(), 'node_modules', '.bin', 'tsx.cmd')
    : path.join(process.cwd(), 'node_modules', '.bin', 'tsx');

  const transport = new StdioClientTransport({
    command: tsxPath,
    args: [serverPath],
  });

  const client = new Client(
    {
      name: "sabiright-agent-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  console.error(`[McpAdapter] Connecting to MCP server at: ${serverPath}`);
  await client.connect(transport);
  console.error(`[McpAdapter] Connected to MCP server`);

  const { tools } = await client.listTools();
  console.error(`[McpAdapter] Found ${tools.length} tools`);

  return tools.map((mcpTool) => {
    return new FunctionTool({
      name: mcpTool.name,
      description: mcpTool.description || '',
      parameters: mcpTool.inputSchema as any,
      execute: async (args: any) => {
        const result = await client.callTool({
          name: mcpTool.name,
          arguments: args,
        });
        
        const validated = CallToolResultSchema.parse(result);
        
        if (validated.content && validated.content.length > 0 && validated.content[0].type === 'text') {
            const textContent = validated.content[0] as { type: 'text', text: string };
            console.error(`[McpAdapter] Tool ${mcpTool.name} response: ${textContent.text.substring(0, 100)}...`);
            // Gemini API through ADK expects an object for function_response
            // Using a simple 'output' key is safe and compatible with most ADK versions
            return { output: textContent.text };
        }
        return validated;
      },
    });
  });
}
