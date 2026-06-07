import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { CurriculumLoader } from "../src/curriculum-loader.js";
import { ToolRouter } from "../src/tool-router.js";
const repoRoot = path.resolve(import.meta.dirname ?? ".", "../..");
const router = new ToolRouter(new CurriculumLoader(repoRoot));
test("list_all_servers returns 42 servers", async () => {
    const result = await router.handle("list_all_servers", {});
    const payload = result.structuredContent.result;
    assert.equal(payload.count, 42);
});
test("get_ai_tutor_instructions returns content", async () => {
    const result = await router.handle("get_ai_tutor_instructions", {});
    const payload = result.structuredContent.result;
    assert.ok(payload.content.length > 0);
});
test("proxy tools are registered and routable", async () => {
    const result = await router.handle("whatsapp_tool_1", {});
    const payload = result.structuredContent.result;
    assert.equal(payload.proxied, true);
    assert.equal(payload.server, "whatsapp");
});
