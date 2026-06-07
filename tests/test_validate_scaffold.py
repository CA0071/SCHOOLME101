import subprocess
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent


class ValidateScaffoldTestCase(unittest.TestCase):
    def test_validate_scaffold_script(self) -> None:
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "validate_scaffold.py")],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertIn("Scaffold validation passed.", result.stdout)


if __name__ == "__main__":
    unittest.main()
