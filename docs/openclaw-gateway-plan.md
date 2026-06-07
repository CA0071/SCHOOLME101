# OpenClaw Gateway Plan (Proposed)

> Status: architecture plan only. This repository does not yet contain a deployed OpenClaw gateway.

## Goal
Provide one central gateway that issues and controls up to ~2000 student API allocations.

## Proposed Components
- **Gateway API**: authentication, routing, rate limiting, request logging.
- **Subscriber Store**: student/school accounts, API key metadata, quotas.
- **Policy Engine**: per-key model permissions and usage controls.
- **Model Router**:
  - Gemini 2.5 Flash for low-latency tutoring/quiz tasks.
  - Gemini 2.5 Pro for advanced reasoning and long-form homework support.
- **Knowledge Retrieval Adapter**: resolves grade+subject and retrieves relevant catalog-backed content.

## Suggested API Surface
- `POST /v1/auth/issue-key`
- `POST /v1/tutor/query`
- `POST /v1/quiz/generate`
- `GET /v1/usage/{apiKeyId}`
- `POST /v1/admin/allocate`

## Next Build Steps
1. Implement gateway service scaffold.
2. Add API key lifecycle management.
3. Add routing policies and quota middleware.
4. Integrate retrieval endpoint backed by this knowledgebase catalog.
