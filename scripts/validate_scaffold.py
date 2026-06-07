#!/usr/bin/env python3
"""Validate MCP scaffold structure and required server integrations."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple, TypedDict

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_SERVER_IDS = {
    "education",
    "quiz",
    "homework",
    "automation_admin",
    "retrieval",
    "student_skills_r12",
    "github",
}

REQUIRED_FILES = [
    "mcp/config/mcp_registry.json",
    "configs/mcp_build.json",
    "configs/github_mcp.env.template",
    "mcp/servers/student_skills_r12.server.json",
    "mcp/servers/github.server.json",
    "schemas/skills_server_profile.schema.json",
    "schemas/github_server_capabilities.schema.json",
    "examples/skills_server_profile.example.json",
    "examples/github_server_config.example.json",
    "policies/tutoring_safety.policy.json",
    "docs/mcp_scaffold_overview.md",
    "docs/global_educational_mcp_ecosystem_scan.md",
]

EXPECTED_GRADE_BANDS = {"foundation_phase", "intermediate_phase", "senior_phase", "fet"}
EXPECTED_GITHUB_TOOL_GROUPS = {
    "repository",
    "issues",
    "pull_requests",
    "workflows_actions",
    "code_and_commits",
    "projects_and_meta",
    "security",
}


class ScaffoldContext(TypedDict, total=False):
    registry: Dict


def _load_json(path: Path) -> Dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_scaffold(root: Path = ROOT) -> Tuple[List[str], ScaffoldContext]:
    """Validate required scaffold files and key server capabilities.

    Args:
        root: Repository root path to validate.

    Returns:
        A tuple of:
        - errors: list of human-readable validation errors.
        - context: auxiliary parsed data (currently includes the loaded registry).
    """
    errors: List[str] = []
    context: ScaffoldContext = {}

    for rel in REQUIRED_FILES:
        if not (root / rel).exists():
            errors.append(f"Missing required file: {rel}")

    registry_path = root / "mcp/config/mcp_registry.json"
    if not registry_path.exists():
        return errors, context

    registry = _load_json(registry_path)
    context["registry"] = registry
    server_entries = registry.get("servers", [])
    ids = {entry.get("id") for entry in server_entries}

    missing_ids = REQUIRED_SERVER_IDS - ids
    if missing_ids:
        errors.append(f"Registry missing server ids: {sorted(missing_ids)}")

    for entry in server_entries:
        definition_rel = entry.get("definition")
        if not definition_rel:
            errors.append(f"Server entry missing definition: {entry.get('id')}")
            continue
        definition_path = root / definition_rel
        if not definition_path.exists():
            errors.append(f"Server definition not found: {definition_rel}")
            continue
        definition = _load_json(definition_path)
        if definition.get("id") != entry.get("id"):
            errors.append(
                f"Server id mismatch: registry={entry.get('id')} definition={definition.get('id')}"
            )

    skills_def_path = root / "mcp/servers/student_skills_r12.server.json"
    if skills_def_path.exists():
        skills_def = _load_json(skills_def_path)
        bands = set()
        for band in skills_def.get("grade_bands", []):
            if "band" not in band:
                errors.append("student_skills_r12 grade band entry missing 'band' key")
                continue
            bands.add(band["band"])
        if EXPECTED_GRADE_BANDS - bands:
            errors.append("student_skills_r12 missing required grade bands")

        categories = set(skills_def.get("skill_categories", []))
        for required_category in {
            "tutoring",
            "summaries",
            "quizzes",
            "homework_help",
            "remediation",
            "study_planning",
            "exam_prep",
            "language_learning",
            "age_appropriate_guidance",
        }:
            if required_category not in categories:
                errors.append(f"student_skills_r12 missing skill category: {required_category}")

    github_def_path = root / "mcp/servers/github.server.json"
    if github_def_path.exists():
        github_def = _load_json(github_def_path)
        tool_surface = github_def.get("tool_surface", {})
        missing_groups = EXPECTED_GITHUB_TOOL_GROUPS - set(tool_surface.keys())
        if missing_groups:
            errors.append(f"github missing tool groups: {sorted(missing_groups)}")

    build_cfg_path = root / "configs/mcp_build.json"
    if build_cfg_path.exists():
        build_cfg = _load_json(build_cfg_path)
        enabled = set(build_cfg.get("enabled_servers", []))
        missing_build_servers = REQUIRED_SERVER_IDS - enabled
        if missing_build_servers:
            errors.append(f"Build config missing servers: {sorted(missing_build_servers)}")

    return errors, context


def main() -> int:
    errors, _ = validate_scaffold(ROOT)
    if errors:
        print("Scaffold validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("Scaffold validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
