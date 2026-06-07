import importlib.util
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "validate_scaffold.py"


spec = importlib.util.spec_from_file_location("validate_scaffold", SCRIPT_PATH)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


class ValidateScaffoldTests(unittest.TestCase):
    def test_validate_scaffold_passes(self):
        errors, context = module.validate_scaffold(ROOT)
        self.assertEqual([], errors)
        self.assertIn("registry", context)

    def test_registry_contains_new_servers(self):
        errors, context = module.validate_scaffold(ROOT)
        self.assertEqual([], errors)

        server_ids = {entry["id"] for entry in context["registry"]["servers"]}
        self.assertIn("student_skills_r12", server_ids)
        self.assertIn("github", server_ids)

    def test_missing_required_file_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            (tmp_root / "mcp" / "config").mkdir(parents=True)
            (tmp_root / "mcp" / "config" / "mcp_registry.json").write_text('{"servers": []}', encoding="utf-8")
            errors, _ = module.validate_scaffold(tmp_root)

        self.assertTrue(any("Missing required file" in err for err in errors))


if __name__ == "__main__":
    unittest.main()
