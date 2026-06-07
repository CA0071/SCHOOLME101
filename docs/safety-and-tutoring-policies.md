# Safety and Tutoring Policies

The `policies/` directory contains machine-readable policy templates for core tutor behavior:

- `tutoring_safety_policy.json`
- `homework_assistance_policy.json`
- `quiz_generation_policy.json`
- `multilingual_localization_policy.json`

## Intended use

- Load these files as policy context in tutoring prompts.
- Enforce required rules in gateway middleware before model calls.
- Keep policy versions explicit (`policyVersion`) for auditability.

## Core guardrails

- Age-appropriate explanation style
- No harmful content
- Homework hints-first approach
- Curriculum-aligned quizzes with rubric metadata
- Localized support for multilingual learners
