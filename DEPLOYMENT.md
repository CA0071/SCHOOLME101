# DEPLOYMENT — SCHOOLME101 MCP Server

Production deployment guide.

---

## Option 1 — Direct Node.js (Recommended for Claude Desktop / OpenClaw)

```bash
git clone https://github.com/CA0071/SCHOOLME101.git
cd SCHOOLME101
npm install
npm run build
node dist/index.js
```

The server communicates over **stdio** — there is no HTTP port to expose.  
Connect via your MCP client's stdio configuration (see `INSTALLATION.md`).

---

## Option 2 — Docker

### Build

```bash
docker build -t schoolme101-mcp:latest .
```

### Run (interactive stdin/stdout)

```bash
docker run -i --rm \
  -e CURRICULUM_PATH=/app \
  schoolme101-mcp:latest
```

### docker-compose

```bash
docker-compose up -d
```

---

## Option 3 — GitHub (run from the repository)

Because the server uses stdio transport you can point any MCP client directly
at the pre-built `dist/index.js` after cloning:

```json
{
  "command": "node",
  "args": ["dist/index.js"],
  "cwd": "/path/to/SCHOOLME101"
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `stdio` | Transport — currently only `stdio` is supported |
| `CURRICULUM_PATH` | repo root | Path that contains the `.md` curriculum files |
| `NODE_ENV` | — | Set to `production` to suppress dev warnings |

---

## Security Notes

- The server does **not** expose any network ports in stdio mode.
- The Docker image runs as a non-root user (`mcp`).
- No secrets or credentials are required or stored.

---

## Updating

```bash
git pull
npm install
npm run build
```

Then restart your MCP client to pick up the new binary.
