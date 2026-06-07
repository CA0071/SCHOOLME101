#!/usr/bin/env python3
"""Validate knowledgebase catalog structure and source references."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

GRADE_TO_BAND = {
    "Grade R": "Foundation Phase",
    "Grade 1": "Foundation Phase",
    "Grade 2": "Foundation Phase",
    "Grade 3": "Foundation Phase",
    "Grade 4": "Intermediate Phase",
    "Grade 5": "Intermediate Phase",
    "Grade 6": "Intermediate Phase",
    "Grade 7": "Senior Phase",
    "Grade 8": "Senior Phase",
    "Grade 9": "Senior Phase",
    "Grade 10": "FET Phase",
    "Grade 11": "FET Phase",
    "Grade 12": "FET Phase",
}

HEADER_PATTERN = re.compile(r"^#\s*(Grade\s(?:R|[1-9]|1[0-2]))\s+—\s+(.+?)\s*\(CAPS\)")
REQUIRED_FIELDS = ("id", "grade", "grade_band", "subject", "source_path")


def normalize_subject_name(subject: str) -> str:
    normalized = " ".join(subject.replace("_", " ").split())
    return re.sub(r"\bsiswati\b", "siSwati", normalized, flags=re.IGNORECASE)


def _load_json(path: Path) -> Dict:
    return json.loads(path.read_text(encoding="utf-8"))


def discover_content_markdown_files(repo_root: Path) -> Dict[str, Tuple[str, str]]:
    """Return {relative_path: (grade, subject)} for CAPS content markdown files."""
    content_files: Dict[str, Tuple[str, str]] = {}
    for file_path in sorted(repo_root.glob("*.md")):
        first_lines = file_path.read_text(encoding="utf-8").splitlines()[:5]
        for line in first_lines:
            match = HEADER_PATTERN.match(line.strip())
            if match:
                rel_path = file_path.relative_to(repo_root).as_posix()
                content_files[rel_path] = (match.group(1), match.group(2).strip())
                break
    return content_files


def validate_catalog(catalog_path: Path, repo_root: Path) -> List[str]:
    errors: List[str] = []
    try:
        catalog = _load_json(catalog_path)
    except json.JSONDecodeError as exc:
        return [f"Invalid JSON in {catalog_path}: {exc}"]

    if not isinstance(catalog, dict):
        return ["Catalog must be a JSON object"]

    entries = catalog.get("entries")
    if not isinstance(entries, list):
        return ["Catalog must include an 'entries' array"]

    discovered_content = discover_content_markdown_files(repo_root)

    seen_ids = set()
    seen_keys = set()
    catalog_paths = set()

    for idx, entry in enumerate(entries):
        prefix = f"entries[{idx}]"
        if not isinstance(entry, dict):
            errors.append(f"{prefix} must be an object")
            continue

        missing = [field for field in REQUIRED_FIELDS if not entry.get(field)]
        if missing:
            errors.append(f"{prefix} missing required fields: {', '.join(missing)}")
            continue

        for field in REQUIRED_FIELDS:
            if not isinstance(entry[field], str):
                errors.append(f"{prefix}.{field} must be a string")

        entry_id = entry["id"]
        if entry_id in seen_ids:
            errors.append(f"Duplicate id: {entry_id}")
        seen_ids.add(entry_id)

        grade = entry["grade"]
        if grade not in GRADE_TO_BAND:
            errors.append(f"{prefix}.grade has unsupported value: {grade}")
        else:
            expected_band = GRADE_TO_BAND[grade]
            if entry["grade_band"] != expected_band:
                errors.append(
                    f"{prefix}.grade_band mismatch for {grade}: expected '{expected_band}', got '{entry['grade_band']}'"
                )

        source_path = entry["source_path"]
        if source_path.startswith("/"):
            errors.append(f"{prefix}.source_path must be relative: {source_path}")
            continue

        normalized_subject = normalize_subject_name(entry["subject"])
        key = (entry["grade"], normalized_subject, source_path)
        if key in seen_keys:
            errors.append(
                f"Duplicate subject mapping: grade={entry['grade']} subject={entry['subject']} source_path={source_path}"
            )
        seen_keys.add(key)
        catalog_paths.add(source_path)

        source_file = (repo_root / source_path).resolve()
        if not source_file.exists() or not source_file.is_file():
            errors.append(f"Missing source file referenced by catalog: {source_path}")

        source_info = discovered_content.get(source_path)
        if source_info:
            header_grade, header_subject = source_info
            if entry["grade"] != header_grade:
                errors.append(
                    f"Metadata mismatch for {source_path}: catalog grade '{entry['grade']}' != header grade '{header_grade}'"
                )
            if normalized_subject != normalize_subject_name(header_subject):
                errors.append(
                    f"Metadata mismatch for {source_path}: catalog subject '{entry['subject']}' != header subject '{header_subject}'"
                )

    missing_refs = sorted(path for path in discovered_content if path not in catalog_paths)
    for path in missing_refs:
        errors.append(f"Missing catalog reference for content file: {path}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate SCHOOLME101 knowledgebase catalog")
    parser.add_argument(
        "--catalog",
        default="knowledgebase/catalog.json",
        help="Relative path to catalog JSON from repo root",
    )
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Repository root containing markdown content and knowledgebase catalog",
    )
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    catalog_path = (repo_root / args.catalog).resolve()

    if not catalog_path.exists():
        print(f"ERROR: catalog file not found: {catalog_path}")
        return 1

    errors = validate_catalog(catalog_path=catalog_path, repo_root=repo_root)

    if errors:
        print("Knowledgebase validation FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Knowledgebase validation PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
