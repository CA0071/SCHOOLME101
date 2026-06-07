#!/usr/bin/env python3
"""Validate JSON scaffold files and schema-example compatibility."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent

JSON_FILES = [
    "mcp/config/mcp_registry.json",
    "mcp/servers/education.server.json",
    "mcp/servers/quiz.server.json",
    "mcp/servers/homework.server.json",
    "mcp/servers/automation_admin.server.json",
    "mcp/servers/retrieval.server.json",
    "configs/model_routing.json",
    "configs/openclaw_gateway.json",
    "configs/android_openclaw_connection.json",
    "configs/rate_limit_policy.json",
    "policies/tutoring_safety_policy.json",
    "policies/homework_assistance_policy.json",
    "policies/quiz_generation_policy.json",
    "policies/multilingual_localization_policy.json",
    "schemas/mcp_registry.schema.json",
    "schemas/student_subscription.schema.json",
    "schemas/api_key_metadata.schema.json",
    "schemas/usage_audit_log.schema.json",
    "examples/student_subscription.sample.json",
    "examples/api_key_metadata.sample.json",
    "examples/usage_audit_log.sample.json"
]


def _load_json(relative_path: str) -> Any:
    path = REPO_ROOT / relative_path
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def _validate_iso_datetime(value: str, field_name: str) -> None:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    _require(parsed.tzinfo is not None, f"{field_name} must include timezone information")


def validate_json_parsing() -> None:
    for file_path in JSON_FILES:
        _load_json(file_path)


def validate_registry() -> None:
    registry = _load_json("mcp/config/mcp_registry.json")
    servers = registry["servers"]
    _require(len(servers) >= 5, "Registry must define at least 5 MCP servers")
    for server in servers:
        _require((REPO_ROOT / "mcp/config" / server["configPath"]).exists(), f"Missing server config for {server['id']}")


def validate_model_routing() -> None:
    routing = _load_json("configs/model_routing.json")
    provider = routing["providers"]["openclaw-gateway"]
    models = provider["models"]
    _require("gemini-2.5-flash" in models, "gemini-2.5-flash missing from routing config")
    _require("gemini-2.5-pro" in models, "gemini-2.5-pro missing from routing config")
    _require(len(routing["routingRules"]) >= 2, "Routing rules should include at least two scenarios")


def validate_examples_against_schema_requirements() -> None:
    required_fields = {
        "examples/student_subscription.sample.json": ["subscriptionId", "studentId", "planTier", "status", "apiKeyRef"],
        "examples/api_key_metadata.sample.json": ["keyId", "ownerType", "ownerId", "scopes", "status"],
        "examples/usage_audit_log.sample.json": ["eventId", "keyId", "studentId", "workflow", "status"]
    }

    for relative_path, required_keys in required_fields.items():
        payload = _load_json(relative_path)
        for key in required_keys:
            _require(key in payload, f"{relative_path} missing required field '{key}'")

    subscription = _load_json("examples/student_subscription.sample.json")
    _validate_iso_datetime(subscription["activatedAt"], "activatedAt")

    api_key = _load_json("examples/api_key_metadata.sample.json")
    _validate_iso_datetime(api_key["createdAt"], "createdAt")

    audit_event = _load_json("examples/usage_audit_log.sample.json")
    _validate_iso_datetime(audit_event["timestamp"], "timestamp")


def validate_policy_sets() -> None:
    for relative_path in [
        "policies/tutoring_safety_policy.json",
        "policies/homework_assistance_policy.json",
        "policies/quiz_generation_policy.json",
        "policies/multilingual_localization_policy.json"
    ]:
        policy = _load_json(relative_path)
        _require("policyVersion" in policy, f"{relative_path} missing policyVersion")
        _require("policyName" in policy, f"{relative_path} missing policyName")


def main() -> None:
    validate_json_parsing()
    validate_registry()
    validate_model_routing()
    validate_examples_against_schema_requirements()
    validate_policy_sets()
    print("Scaffold validation passed.")


if __name__ == "__main__":
    main()
