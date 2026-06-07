# SCHOOLME101 MCP Server

> **South African CAPS Curriculum AI Tutor — Model Context Protocol Server**

SCHOOLME101 is a fully functional [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes the complete South African CAPS curriculum as structured tools and resources for use with Claude Desktop, OpenClaw, and any other MCP-compatible AI application.

---

## Features

- 🎓 **81+ curriculum subjects** across Grades R–12 (Foundation → FET Phase)
- 🔍 **7 MCP tools** for subject lookup, full-text search, grade overviews, and AI tutoring
- 📚 **5 MCP resources** for structured data access
- 🚀 **stdio transport** — plug directly into Claude Desktop or OpenClaw
- 🐳 **Docker support** — single-command deployment
- 🛡️ **TypeScript** — fully type-safe implementation

---

## Quick Start

```bash
# Clone
git clone https://github.com/CA0071/SCHOOLME101.git
cd SCHOOLME101

# Install & build
npm install
npm run build

# Test the server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  | node dist/index.js
```

---

## Claude Desktop Setup

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "schoolme101": {
      "command": "node",
      "args": ["/path/to/SCHOOLME101/dist/index.js"],
      "env": {
        "CURRICULUM_PATH": "/path/to/SCHOOLME101"
      }
    }
  }
}
```

Restart Claude Desktop — all tools will be available immediately.

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_subject_content` | Full curriculum content for a subject |
| `search_curriculum` | Keyword search across all subjects |
| `get_grade_overview` | All subjects for a specific grade |
| `get_ai_tutor_instructions` | AI tutoring guidelines |
| `list_all_subjects` | Complete subject list with grades |
| `get_subject_by_grade` | Subject content for a specific grade |
| `search_by_topic` | Deep topic search (filtered by grade/subject) |

See [`MCP_TOOLS.md`](MCP_TOOLS.md) for the full reference.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`INSTALLATION.md`](INSTALLATION.md) | Detailed setup guide |
| [`MCP_TOOLS.md`](MCP_TOOLS.md) | Complete tools reference |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Production deployment guide |
| [`AI_TUTOR_INSTRUCTIONS.md`](AI_TUTOR_INSTRUCTIONS.md) | Tutoring guidelines |

---

## Docker

```bash
docker build -t schoolme101-mcp:latest .
docker run -i --rm schoolme101-mcp:latest
```

---

## Project Structure

```
SCHOOLME101/
├── src/
│   ├── index.ts            # MCP server entry point
│   ├── tools.ts            # Tool implementations
│   ├── resources.ts        # Resource handlers
│   ├── curriculum-loader.ts# Curriculum file loader
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Utility functions
├── dist/                   # Compiled JavaScript (after npm run build)
├── *.md                    # CAPS curriculum subject files
├── AI_TUTOR_INSTRUCTIONS.md
├── master_index.md
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## License

MIT
