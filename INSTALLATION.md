# INSTALLATION — SCHOOLME101 MCP Server

Complete setup guide for running the SCHOOLME101 MCP Server with Claude Desktop, OpenClaw, or any MCP-compatible client.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18.x |
| npm | 9.x |
| Git | any |
| Docker (optional) | 20.x |

---

## Quick Start (stdio transport)

```bash
# 1. Clone the repository
git clone https://github.com/CA0071/SCHOOLME101.git
cd SCHOOLME101

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Test (pipe a JSON-RPC initialize message)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  | node dist/index.js
```

You should see the server reply with `{"result":{"protocolVersion":"2024-11-05",...}}`.

---

## Claude Desktop Integration

1. Find your Claude Desktop config file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server entry (replace the path with the absolute path to your clone):

```json
{
  "mcpServers": {
    "schoolme101": {
      "command": "node",
      "args": ["/path/to/SCHOOLME101/dist/index.js"],
      "env": {
        "CURRICULUM_PATH": "/path/to/SCHOOLME101",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

3. Restart Claude Desktop — the SCHOOLME101 tools will appear in the tool panel.

---

## OpenClaw Integration

In your OpenClaw server config add a stdio MCP server entry:

```json
{
  "name": "schoolme101",
  "transport": "stdio",
  "command": "node",
  "args": ["/path/to/SCHOOLME101/dist/index.js"],
  "env": {
    "CURRICULUM_PATH": "/path/to/SCHOOLME101"
  }
}
```

---

## Docker

```bash
# Build the image
docker build -t schoolme101-mcp:latest .

# Run interactively (pipe MCP messages via stdin)
docker run -i --rm schoolme101-mcp:latest

# Or use docker-compose
docker-compose up
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `stdio` | Transport type (`stdio` only currently) |
| `CURRICULUM_PATH` | repo root | Path to the directory containing `.md` curriculum files |
| `LOG_LEVEL` | `info` | Log verbosity (`error` / `warn` / `info` / `debug`) |

---

## Startup Script

A convenience script is provided:

```bash
bash startup.sh
```

This builds the project if needed and then starts the server.

---

## Troubleshooting

### "Cannot find module" errors
Run `npm install` to restore dependencies.

### "Curriculum directory not found"
Make sure `CURRICULUM_PATH` points to the folder that contains the `.md` curriculum files.

### Server exits immediately
Check stderr output — the server writes startup messages to stderr to avoid polluting the MCP stdio stream:
```bash
node dist/index.js 2>&1 >/dev/null
```
