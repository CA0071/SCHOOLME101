# SCHOOLME101

Production-oriented foundation for a CAPS-aligned AI tutor knowledge base.

## What this foundation includes
- Non-destructive indexing of existing educational markdown content
- Machine-readable catalog: `knowledgebase/catalog.json`
- Catalog schema: `schemas/catalog.schema.json`
- Validation tooling for structure and references
- Unit tests for validation behavior
- Architecture docs for OpenClaw gateway, MCP services, and Android manual connection

## Repository structure
- `knowledgebase/` - catalog and planned normalized subject layout
- `schemas/` - JSON schema definitions
- `scripts/` - ingestion and validation scripts
- `tests/` - automated tests
- `docs/` - architecture and operations documentation

## Ingest and validate content
```bash
python scripts/build_catalog.py --repo-root .
python scripts/validate_knowledgebase.py --repo-root .
python -m unittest discover -s tests -v
```

## Pragmatic implementation status
This repository currently provides a maintainable knowledge-base and validation foundation.

The following are documented plans, not claimed live integrations:
- OpenClaw gateway deployment
- student API allocation service
- Gemini route orchestration
- MCP server deployment
- Android app production integration

## Next steps
1. Implement gateway service scaffold with API key lifecycle.
2. Add retrieval API using catalog metadata.
3. Add MCP service implementations for education, quiz, homework, and automation.
4. Connect Android OpenClaw client to gateway endpoints.
