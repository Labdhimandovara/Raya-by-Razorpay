// Raya MCP Server Implementation
// Complies with Model Context Protocol (MCP) JSON-RPC 2.0 specification.
// Supports both Stdio Transport (desktop/CLI clients) and programmatic message dispatch.

import readline from "readline";
import { McpRequest, McpResponse } from "./types";
import { RAYA_MCP_TOOLS, executeMcpTool } from "./tools";

export const SERVER_INFO = {
  name: "raya-by-razorpay-mcp",
  version: "1.0.0",
  description: "Raya by Razorpay Agentic Commerce MCP Server",
};

/**
 * Handles an incoming MCP JSON-RPC 2.0 message and returns the response.
 */
export async function handleJsonRpcMessage(request: McpRequest): Promise<McpResponse> {
  const { jsonrpc, id, method, params } = request;

  if (jsonrpc !== "2.0") {
    return {
      jsonrpc: "2.0",
      id: id || null,
      error: { code: -32600, message: "Invalid Request: JSON-RPC version must be 2.0" },
    };
  }

  try {
    switch (method) {
      // 1. MCP Initialization Handshake
      case "initialize": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: SERVER_INFO,
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
          },
        };
      }

      // Notifications acknowledgment
      case "notifications/initialized":
      case "initialized": {
        return {
          jsonrpc: "2.0",
          id,
          result: {},
        };
      }

      // Ping
      case "ping": {
        return {
          jsonrpc: "2.0",
          id,
          result: {},
        };
      }

      // 2. List available tools
      case "tools/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: RAYA_MCP_TOOLS,
          },
        };
      }

      // 3. Execute tool call
      case "tools/call": {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};

        if (!toolName) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Missing required parameter: 'name'" },
          };
        }

        const toolDef = RAYA_MCP_TOOLS.find((t) => t.name === toolName);
        if (!toolDef) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Tool '${toolName}' not found.` },
          };
        }

        const toolResult = await executeMcpTool(toolName, toolArgs);

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult, null, 2),
              },
            ],
            structured: toolResult,
            isError: false,
          },
        };
      }

      default: {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method '${method}' not found.` },
        };
      }
    }
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: err.message || "Internal server error during MCP execution.",
      },
    };
  }
}

/**
 * Starts the MCP Server over Stdio for use with local MCP clients (ChatGPT Desktop, Claude Desktop, Cursor, Antigravity).
 */
export function startStdioMcpServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  process.stderr.write(`[Raya MCP Server] Running on Stdio transport (v${SERVER_INFO.version})...\n`);

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const request = JSON.parse(trimmed) as McpRequest;
      const response = await handleJsonRpcMessage(request);
      process.stdout.write(JSON.stringify(response) + "\n");
    } catch (parseErr: any) {
      const errResponse: McpResponse = {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: `Parse error: ${parseErr.message}` },
      };
      process.stdout.write(JSON.stringify(errResponse) + "\n");
    }
  });
}
