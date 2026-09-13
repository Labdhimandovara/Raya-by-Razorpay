import { NextRequest, NextResponse } from "next/server";
import { handleJsonRpcMessage, SERVER_INFO } from "@/mcp/server";
import { RAYA_MCP_TOOLS, executeMcpTool } from "@/mcp/tools";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/mcp
 * Returns MCP Server metadata and available tools.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    server: SERVER_INFO,
    protocol: "mcp-jsonrpc-2.0",
    tools: RAYA_MCP_TOOLS,
  });
}

/**
 * POST /api/mcp
 * Accepts either a standard MCP JSON-RPC 2.0 request or a simplified tool call:
 *
 * Mode 1 (JSON-RPC 2.0):
 *   { "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "search_products", "arguments": { ... } } }
 *
 * Mode 2 (Direct Tool Call):
 *   { "tool": "search_products", "arguments": { ... } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mode 1: Standard JSON-RPC 2.0
    if (body.jsonrpc === "2.0") {
      const response = await handleJsonRpcMessage(body);
      return NextResponse.json(response);
    }

    // Mode 2: Simplified Direct Tool Call
    const toolName = body.tool || body.name;
    const args = body.arguments || body.args || {};

    if (!toolName) {
      return NextResponse.json(
        {
          error: "Missing 'tool' or 'name' parameter. For standard MCP, specify 'jsonrpc': '2.0'.",
          available_tools: RAYA_MCP_TOOLS.map((t) => t.name),
        },
        { status: 400 }
      );
    }

    const result = await executeMcpTool(toolName, args);
    return NextResponse.json({
      success: true,
      tool: toolName,
      result,
    });
  } catch (error: any) {
    console.error("[Raya MCP API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process MCP request",
      },
      { status: 500 }
    );
  }
}
