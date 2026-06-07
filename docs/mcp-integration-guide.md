# MCP Integration Guide

This repository includes a **scaffold** for integrating MCP servers into the SCHOOLME101 AI tutor platform.

## Included scaffold

- `mcp/config/mcp_registry.json`: central server registry
- `mcp/servers/*.server.json`: per-server capability templates
- `configs/model_routing.json`: model/provider routing rules
- `configs/openclaw_gateway.json`: OpenClaw gateway connection template
- `configs/android_openclaw_connection.json`: Android manual setup template

## Server categories

The scaffold covers:

1. Education workflows
2. Quiz and assessment
3. Homework help
4. Automation/admin
5. Retrieval/search

## Important scope note

The files in this repository are templates and planning artifacts. They do **not** claim that external GitHub MCP servers are already installed.

## Next implementation steps

1. Build each MCP server runtime and replace placeholder `entrypoint` commands.
2. Add deployment/runtime config for your host environment.
3. Connect MCP invocation flow to the OpenClaw gateway.
4. Add integration tests for real server calls.
