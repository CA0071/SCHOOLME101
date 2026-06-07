import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_knowledgebase import validate_catalog


class ValidateKnowledgebaseTests(unittest.TestCase):
    def _write(self, path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def _base_entry(self):
        return {
            "id": "grade_r__mathematics",
            "grade": "Grade R",
            "grade_band": "Foundation Phase",
            "subject": "Mathematics",
            "source_path": "Mathematics.md",
        }

    def test_valid_catalog_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._write(root / "Mathematics.md", "# Grade R — Mathematics (CAPS)\n")
            catalog_path = root / "knowledgebase" / "catalog.json"
            self._write(
                catalog_path,
                json.dumps({"version": "1.0.0", "entries": [self._base_entry()]}, indent=2),
            )

            errors = validate_catalog(catalog_path=catalog_path, repo_root=root)
            self.assertEqual(errors, [])

    def test_missing_source_file_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            catalog_path = root / "knowledgebase" / "catalog.json"
            self._write(
                catalog_path,
                json.dumps({"version": "1.0.0", "entries": [self._base_entry()]}, indent=2),
            )

            errors = validate_catalog(catalog_path=catalog_path, repo_root=root)
            self.assertTrue(any("Missing source file referenced by catalog" in err for err in errors))

    def test_duplicate_subject_mapping_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._write(root / "Mathematics.md", "# Grade R — Mathematics (CAPS)\n")
            catalog_path = root / "knowledgebase" / "catalog.json"
            entry = self._base_entry()
            self._write(
                catalog_path,
                json.dumps({"version": "1.0.0", "entries": [entry, dict(entry)]}, indent=2),
            )

            errors = validate_catalog(catalog_path=catalog_path, repo_root=root)
            self.assertTrue(any("Duplicate subject mapping" in err for err in errors))

    def test_malformed_entry_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._write(root / "Mathematics.md", "# Grade R — Mathematics (CAPS)\n")
            bad_entry = self._base_entry()
            del bad_entry["subject"]
            catalog_path = root / "knowledgebase" / "catalog.json"
            self._write(
                catalog_path,
                json.dumps({"version": "1.0.0", "entries": [bad_entry]}, indent=2),
            )

            errors = validate_catalog(catalog_path=catalog_path, repo_root=root)
            self.assertTrue(any("missing required fields" in err for err in errors))

    def test_missing_catalog_reference_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._write(root / "Mathematics.md", "# Grade R — Mathematics (CAPS)\n")
            self._write(root / "English_Home_Language.md", "# Grade 1 — English_Home_Language (CAPS)\n")
            catalog_path = root / "knowledgebase" / "catalog.json"
            self._write(
                catalog_path,
                json.dumps({"version": "1.0.0", "entries": [self._base_entry()]}, indent=2),
            )

            errors = validate_catalog(catalog_path=catalog_path, repo_root=root)
            self.assertTrue(any("Missing catalog reference for content file: English_Home_Language.md" in err for err in errors))


if __name__ == "__main__":
    unittest.main()
