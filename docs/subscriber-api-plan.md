# Subscriber and API Management Plan

This foundation prepares one central gateway that can support large API key allocations (for example 2,000 learner keys).

## Files included

- `schemas/student_subscription.schema.json`
- `schemas/api_key_metadata.schema.json`
- `schemas/usage_audit_log.schema.json`
- `configs/rate_limit_policy.json`
- `examples/*.sample.json`

## Allocation strategy (template)

- Use one gateway service endpoint.
- Issue one key per student/subscriber identity.
- Enforce tier-specific policy using `planTier` + `rate_limit_policy`.
- Rotate keys every 90 days (example default).
- Keep immutable usage/audit events for compliance and analytics.

## Recommended storage model

- `student_subscriptions`
- `api_keys`
- `usage_audit_logs`

Use the JSON schemas in this repository as contract-first references for table design and API payload validation.
