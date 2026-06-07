import test from "node:test";
import assert from "node:assert/strict";
import { SERVERS, allTools, toolByName } from "../src/server-registry.js";

test("registry includes 42 servers", () => {
  assert.equal(SERVERS.length, 42);
});

test("registry includes original SCHOOLME101 tools", () => {
  const expected = [
    "get_subject_content",
    "search_curriculum",
    "get_grade_overview",
    "get_ai_tutor_instructions",
    "list_all_subjects",
    "get_subject_by_grade",
    "search_by_topic"
  ];

  for (const name of expected) {
    assert.ok(toolByName(name), `missing ${name}`);
  }
});

test("registry provides 150+ tools", () => {
  assert.ok(allTools().length >= 150, `tool count too small: ${allTools().length}`);
});
