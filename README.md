# SCHOOLME101 Unified MCP Server

This repository now includes a **single unified MCP meta-server** that consolidates:

- `schoolme101` curriculum tools/resources (backward compatible)
- 41 additional registered server integrations
- 150+ unified tools exposed from one MCP connection
- Unified `schoolme://` resource namespace

## Quick Start

```bash
npm install
npm run build
npm start
```

Server entrypoint: `dist/src/unified-index.js`

## Unified Connection (Claude Desktop / OpenClaw)

Use one MCP connection instead of 42 separate registrations:

```json
{
  "mcpServers": {
    "schoolme-unified": {
      "command": "node",
      "args": ["/absolute/path/to/SCHOOLME101/dist/src/unified-index.js"]
    }
  }
}
```

A ready-made example file is available at:
`/tmp/workspace/CA0071/SCHOOLME101/claude-desktop-config.example.json`

## Unified Discovery Tools

- `list_all_servers`
- `list_tools_by_category`
- `get_tool_documentation`
- `get_server_status`
- `list_capabilities`

## Backward Compatible SCHOOLME101 Tools

- `get_subject_content`
- `search_curriculum`
- `get_grade_overview`
- `get_ai_tutor_instructions`
- `list_all_subjects`
- `get_subject_by_grade`
- `search_by_topic`

## Resource URIs

- `schoolme://`
- `schoolme://servers`
- `schoolme://servers/{category}`
- `schoolme://tools`
- `schoolme://tools/{category}`
- `schoolme://subjects`
- `schoolme://grades/{grade}`
- `schoolme://subject/{subject}`
- `schoolme://tutor-instructions`
- `schoolme://curriculum/search`

## Docker

```bash
docker build -t schoolme-unified .
docker run --rm -i schoolme-unified
```

or

```bash
docker compose up --build
```

## Tests

```bash
npm test
```

## Configuration

Server metadata and category/tool counts are declared in:
`/tmp/workspace/CA0071/SCHOOLME101/server-config.json`
