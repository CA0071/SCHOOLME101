#!/usr/bin/env python3
"""Generate knowledgebase/catalog.json from CAPS markdown files."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

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

HEADER_PATTERN = re.compile(r"^#\s*(Grade\s(?:R|\d{1,2}))\s+—\s+(.+?)\s*\(CAPS\)")


def normalize_subject_name(subject: str) -> str:
    normalized = " ".join(subject.replace("_", " ").split())
    if normalized.lower() == "siswati":
        return "siSwati"
    return normalized


def build_entries(repo_root: Path):
    entries = []
    for file_path in sorted(repo_root.glob("*.md")):
        first_lines = file_path.read_text(encoding="utf-8").splitlines()[:5]
        for line in first_lines:
            match = HEADER_PATTERN.match(line.strip())
            if not match:
                continue

            grade = match.group(1)
            subject = normalize_subject_name(match.group(2).strip())
            grade_band = GRADE_TO_BAND.get(grade)
            if not grade_band:
                continue

            entry_id = (
                f"{grade.lower().replace(' ', '_')}__{subject.lower().replace(' ', '_').replace('/', '_').replace('&', 'and')}"
            )
            entries.append(
                {
                    "id": entry_id,
                    "grade": grade,
                    "grade_band": grade_band,
                    "subject": subject,
                    "source_path": file_path.relative_to(repo_root).as_posix(),
                }
            )
            break
    return entries


def main() -> int:
    parser = argparse.ArgumentParser(description="Build SCHOOLME101 knowledgebase catalog")
    parser.add_argument("--repo-root", default=".", help="Repository root path")
    parser.add_argument(
        "--output",
        default="knowledgebase/catalog.json",
        help="Relative output path from repo root",
    )
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    output_path = (repo_root / args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    catalog = {
        "version": "1.0.0",
        "generated_from": "root markdown CAPS headers",
        "entries": build_entries(repo_root),
    }

    output_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(catalog['entries'])} entries to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
