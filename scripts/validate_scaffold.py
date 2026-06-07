#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY_PATH = ROOT / "mcp" / "config" / "mcp_registry.json"
SERVER_DIR = ROOT / "mcp" / "servers"
REQUIRED_SERVER_FIELDS = {"id", "name", "description", "category", "upstream_repo", "install", "tools"}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def validate_registry(registry: dict):
    if "servers" not in registry or not isinstance(registry["servers"], list):
        raise AssertionError("Registry must contain a 'servers' list")
    ids = [server.get("id") for server in registry["servers"]]
    if len(ids) != len(set(ids)):
        raise AssertionError("Duplicate server IDs found in registry")
    if "student_skills_r12" not in ids or "github" not in ids:
        raise AssertionError("Registry must include student_skills_r12 and github")
    if len(ids) < 30:
        raise AssertionError("Registry must contain at least 30 servers")


def validate_server_files(registry: dict):
    for entry in registry["servers"]:
        server_id = entry["id"]
        server_file = SERVER_DIR / f"{server_id}.server.json"
        if not server_file.exists():
            raise AssertionError(f"Missing server definition file: {server_file}")

        server_def = load_json(server_file)
        missing = REQUIRED_SERVER_FIELDS - set(server_def.keys())
        if missing:
            raise AssertionError(f"Missing required fields in {server_file.name}: {sorted(missing)}")


def main():
    if not REGISTRY_PATH.exists():
        raise AssertionError(f"Missing registry: {REGISTRY_PATH}")
    if not SERVER_DIR.exists():
        raise AssertionError(f"Missing server directory: {SERVER_DIR}")

    registry = load_json(REGISTRY_PATH)
    validate_registry(registry)
    validate_server_files(registry)
    print("Scaffold validation passed")


if __name__ == "__main__":
    main()
