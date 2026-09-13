#!/usr/bin/env node

/**
 * Raya MCP Server CLI Entrypoint
 * Can be executed via:
 *   node bin/raya-mcp.js
 *   deno run -A bin/raya-mcp.js
 */

const { spawn } = require("child_process");
const path = require("path");

const cliTsPath = path.join(__dirname, "..", "src", "mcp", "cli.ts");

// Check if running directly under Deno
if (typeof Deno !== "undefined") {
  import(cliTsPath);
} else {
  // Spawn Deno to run TypeScript with full native support
  const isWindows = process.platform === "win32";
  const denoCmd = isWindows ? "deno.exe" : "deno";

  const child = spawn(
    denoCmd,
    ["run", "-A", cliTsPath],
    {
      stdio: ["inherit", "inherit", "inherit"],
    }
  );

  child.on("error", (err) => {
    process.stderr.write(`[Raya MCP Launcher Error] ${err.message}\nPlease ensure Deno is installed.\n`);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
}
