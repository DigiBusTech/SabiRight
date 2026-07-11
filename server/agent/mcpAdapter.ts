import { FunctionTool } from '@google/adk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { legalFaqTool, moatDataTool, professionalSearchTool } from './legalTools.js';

/**
 * Utility to connect to an MCP server and expose its tools as Google ADK tools.
 * Gracefully falls back to direct tool imports in production or Vercel serverless environments.
 */
export async function getMcpTools(serverPath: string) {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.error(`[McpAdapter] Production/Vercel environment detected. Gracefully bypassing MCP subprocess spawn and using direct/in-process tool imports.`);
    return [legalFaqTool, moatDataTool, professionalSearchTool];
  }

  const tsxPath = process.platform === 'win32' 
    ? path.join(process.cwd(), 'node_modules', '.bin', 'tsx.cmd')
    : path.join(process.cwd(), 'node_modules', '.bin', 'tsx');

  try {
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
  } catch (err) {
    console.error(`[McpAdapter] Failed to connect to MCP server or spin up subprocess. Falling back to direct tool imports. Error:`, err);
    return [legalFaqTool, moatDataTool, professionalSearchTool];
  }
}
