import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { CurriculumLoader } from "../src/curriculum-loader.js";
import { ResourceRouter } from "../src/resource-router.js";

const repoRoot = path.resolve(import.meta.dirname ?? ".", "../..");
const router = new ResourceRouter(new CurriculumLoader(repoRoot));

test("resource root exposes unified summary", () => {
  const payload = router.read("schoolme://");
  const data = JSON.parse(payload.text) as { name: string; servers: number };
  assert.equal(data.name, "schoolme-unified");
  assert.equal(data.servers, 42);
});

test("legacy resource path schoolme://subjects remains available", () => {
  const payload = router.read("schoolme://subjects");
  const subjects = JSON.parse(payload.text) as string[];
  assert.ok(subjects.length > 0);
});
