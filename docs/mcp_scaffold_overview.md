# MCP Scaffold Overview

This repository contains a machine-readable scaffold for MCP integration in an educational tutor platform.

## Implemented in repository (scaffold layer)

- Registry: `mcp/config/mcp_registry.json`
- Server templates: `mcp/servers/*.server.json`
- Build/config templates: `configs/mcp_build.json`, `configs/github_mcp.env.template`
- Schemas: `schemas/*.json`
- Example payloads: `examples/*.example.json`
- Policies: `policies/*.policy.json`
- Validation script/tests: `scripts/validate_scaffold.py`, `tests/test_validate_scaffold.py`

## Server inventory

- Existing scaffold servers: `education`, `quiz`, `homework`, `automation_admin`, `retrieval`
- New scaffold servers:
  - `student_skills_r12`: Grade R–12 subject-aware skills orchestration
  - `github`: broad GitHub MCP capability template

## Grade R–12 skills server design notes

The `student_skills_r12` server models four grade bands:

1. Foundation phase (Grade R–3)
2. Intermediate phase (Grades 4–6)
3. Senior phase (Grades 7–9)
4. FET (Grades 10–12)

It includes skill categories for tutoring, summaries, quizzes, homework help, remediation, study planning, exam prep, language learning, and age-appropriate guidance.

## GitHub MCP server design notes

The `github` server template includes tool groups for repository access, issues, pull requests, workflows/actions, code and commit search, project metadata, and security scanning.

> Important: this is a scaffold contract and documentation baseline. It does not claim a deployed GitHub MCP runtime inside this repository.
