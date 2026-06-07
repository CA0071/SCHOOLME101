# Global Educational MCP Ecosystem Scan (Curated Scaffold Guidance)

This document is a curated design guide for integrating globally relevant educational MCP patterns into SCHOOLME101.

## Scope statement

- This file documents integration ideas and scaffold opportunities.
- It does **not** claim all listed services are deployed in this repository.
- Treat entries as candidate integrations pending legal, technical, and regional review.

## Candidate integration domains

### 1) Structured assessment generation

- Pattern: generate validated MCQ/short-answer/true-false assessments with strict output formats.
- Scaffold hook: `student_skills_r12` + `quiz` server categories.

### 2) LMS connectivity

- Pattern: connect classroom workflows to LMS systems for assignments, rubrics, and progress.
- Scaffold hook: future extension server definitions under `mcp/servers/` and additional schemas in `schemas/`.

### 3) Library/content retrieval

- Pattern: retrieve open educational sources and curriculum references.
- Scaffold hook: `retrieval` server with curriculum metadata constraints.

### 4) Quiz formatting/export

- Pattern: convert generated questions to student and teacher formats (interactive/web/document).
- Scaffold hook: `quiz` server + export profiles in `examples/`.

### 5) Spaced repetition and flashcards

- Pattern: schedule review intervals and generate memory cards from summaries.
- Scaffold hook: `student_skills_r12` skill categories (`summaries`, `study_planning`, `remediation`).

### 6) Language-learning flows

- Pattern: high-frequency vocabulary sequencing, multimodal loops, instant corrective feedback.
- Scaffold hook: `student_skills_r12` (`language_learning`, `age_appropriate_guidance`).

## Country and region considerations (design guidance)

This section is intentionally framed as ecosystem design guidance and not a claim of exhaustive live MCP availability.

### China

- Consider local hosting/data residency requirements.
- Plan adapters for regional content providers and classroom systems.

### UK

- Map scaffolds to GCSE/A-Level style assessment structures where needed.
- Support school MIS/LMS interoperability expectations.

### USA

- Enable district/state framework mapping and standards metadata.
- Support broad LMS/API ecosystem variability across districts.

### India

- Design for mixed board alignment needs and multilingual workflows.
- Include low-bandwidth and mobile-first operational profiles.

### Germany

- Plan state-level curriculum localization and strict privacy handling.
- Keep framework metadata extensible per Bundesland variation.

### Russia

- Include localization hooks for language and regional curriculum structures.
- Validate external integration constraints before deployment.

### Korea

- Support exam-intensive study planning, remediation loops, and language-learning flows.
- Prioritize rapid feedback patterns compatible with high-frequency practice.

## How this informs SCHOOLME101

1. Keep scaffold files machine-readable and explicit (`mcp`, `configs`, `schemas`, `examples`).
2. Separate implemented scaffold from deployed production integrations.
3. Capture regional curriculum metadata in schema-backed profiles.
4. Expand via additive server definitions without replacing current foundation.
