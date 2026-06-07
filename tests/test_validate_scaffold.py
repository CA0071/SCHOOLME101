import importlib.util
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "validate_scaffold.py"


class ValidateScaffoldTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("validate_scaffold", SCRIPT_PATH)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"Unable to load validation script: {SCRIPT_PATH}")

        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)

    def test_validate_scaffold_passes(self):
        errors, context = self.module.validate_scaffold(ROOT)
        self.assertEqual([], errors)
        self.assertIn("registry", context)

    def test_registry_contains_new_servers(self):
        errors, context = self.module.validate_scaffold(ROOT)
        self.assertEqual([], errors)

        server_ids = {entry["id"] for entry in context["registry"]["servers"]}
        self.assertIn("student_skills_r12", server_ids)
        self.assertIn("github", server_ids)

    def test_missing_required_file_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            (tmp_root / "mcp" / "config").mkdir(parents=True)
            (tmp_root / "mcp" / "config" / "mcp_registry.json").write_text('{"servers": []}', encoding="utf-8")
            errors, _ = self.module.validate_scaffold(tmp_root)

        self.assertTrue(any("Missing required file" in err for err in errors))


if __name__ == "__main__":
    unittest.main()
