# MCP Servers Plan (Proposed)

> Status: architecture plan only. MCP services are not yet deployed in this repository.

## Recommended MCP Services

### 1) Education MCP
- grade/subject/topic resolver
- curriculum explanation helper
- lesson objective formatter

### 2) Quiz MCP
- question generation from catalog-backed sources
- rubric template generation
- answer checking helpers

### 3) Homework MCP
- step-by-step hinting flow
- worked-example formatting
- misconception detection prompts

### 4) Automation MCP
- student onboarding workflows
- API allocation automation
- usage reporting and alerts

## Integration Pattern
- Gateway invokes MCP tools per request type.
- MCP tools read catalog metadata (`knowledgebase/catalog.json`) to keep responses grade/subject aligned.
- Tool outputs are logged for audit and quality checks.
