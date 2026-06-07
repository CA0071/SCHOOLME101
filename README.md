# SCHOOLME101

SCHOOLME101 now includes a foundation scaffold for an Africa-focused AI tutor platform with MCP integration templates, gateway/model routing examples, subscriber/API planning schemas, and validation tests.

## Repository foundations

- Curriculum knowledge base markdown content (existing)
- MCP registry and per-server scaffold configs (`mcp/`)
- Gateway/model routing configs (`configs/`)
- Safety/homework/quiz/localization policies (`policies/`)
- Subscriber/API schemas and sample records (`schemas/`, `examples/`)
- Validation script + test (`scripts/validate_scaffold.py`, `tests/test_validate_scaffold.py`)
- Integration and planning docs (`docs/`)

## Validation

Run scaffold validation:

```bash
python scripts/validate_scaffold.py
python -m unittest discover -s tests -v
```
