# Android Manual Connection Guide (Planned OpenClaw Setup)

> Status: manual configuration guide for planned gateway integration.

## Required Values
- Gateway Base URL (HTTPS)
- Student API Key
- Default Model Route (Flash/Pro)
- Optional MCP endpoint registry (if app supports tool routing)

## Manual Setup Steps
1. Open Android OpenClaw app settings.
2. Set provider/base URL to the central gateway URL.
3. Paste issued student API key.
4. Select default model route:
   - Flash for everyday tutoring
   - Pro for advanced tasks
5. Save and run a test query for known grade/subject content.

## Validation Checklist
- Auth succeeds with assigned key.
- Query returns grade-appropriate response.
- Quota/rate limits behave as expected.
- Optional MCP tools are reachable when enabled.
