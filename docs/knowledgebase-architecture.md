# Knowledgebase Architecture

## Purpose
SCHOOLME101 stores CAPS-aligned tutoring material in markdown and indexes it for machine use.

## Current Foundation
- Original subject markdown files remain in repository root (non-destructive).
- `knowledgebase/catalog.json` maps each file to grade, subject, and grade band.
- `schemas/catalog.schema.json` defines catalog shape.
- `scripts/build_catalog.py` regenerates catalog from markdown headers.
- `scripts/validate_knowledgebase.py` validates catalog integrity and source coverage.

## Ingestion Workflow
1. Add or update CAPS markdown files in repository root using header format:
   - `# Grade X — Subject_Name (CAPS)`
2. Rebuild catalog:
   - `python scripts/build_catalog.py --repo-root .`
3. Validate catalog and content references:
   - `python scripts/validate_knowledgebase.py --repo-root .`
4. Run tests:
   - `python -m unittest discover -s tests -v`

## Extension Path
Future phases can normalize content into `knowledgebase/subjects/` while preserving catalog-driven references for backward compatibility.
