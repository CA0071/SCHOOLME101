import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY_PATH = ROOT / "mcp" / "config" / "mcp_registry.json"
SERVER_DIR = ROOT / "mcp" / "servers"


class TestValidateScaffold(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
        cls.server_ids = {s["id"] for s in cls.registry["servers"]}

    def test_all_server_files_exist(self):
        missing = []
        for server_id in self.server_ids:
            if not (SERVER_DIR / f"{server_id}.server.json").exists():
                missing.append(server_id)
        self.assertEqual([], sorted(missing))

    def test_server_count_gte_30(self):
        self.assertGreaterEqual(len(self.registry["servers"]), 30)

    def test_new_servers_present(self):
        expected = {
            "playwright",
            "whatsapp",
            "supabase",
            "cloudflare",
            "paypal",
            "powershell",
            "tts_kokoro",
            "tts_edge",
            "ocr",
            "pdf_ai",
            "memory_nocturne",
            "geogebra",
        }
        self.assertTrue(expected.issubset(self.server_ids))


if __name__ == "__main__":
    unittest.main()
