import test from "node:test";
import assert from "node:assert/strict";
import { moduleRegistry, mvpModuleRegistry } from "./module-registry.ts";

test("registry exposes nine modules with unique keys and hrefs", () => {
  const keys = moduleRegistry.map((m) => m.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(keys.length, 9);
  const hrefs = moduleRegistry.map((m) => m.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
});

test("registry includes today career review badge settings", () => {
  const keys = moduleRegistry.map((m) => m.key).sort();
  assert.deepEqual(keys, [
    "badge",
    "career",
    "english",
    "fitness",
    "knowledge",
    "learning",
    "review",
    "settings",
    "today",
  ]);
});

test("MVP registry exposes exactly the four primary routes in order", () => {
  assert.deepEqual(
    mvpModuleRegistry.map((module) => module.key),
    ["today", "learning", "review", "settings"],
  );
  assert.equal(moduleRegistry.length, 9);
});
