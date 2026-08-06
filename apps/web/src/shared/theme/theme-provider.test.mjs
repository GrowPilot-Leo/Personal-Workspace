import test from "node:test";
import assert from "node:assert/strict";
import { applyMotionToDocument, applyThemeToDocument } from "./theme-dom.ts";

// Minimal DOM stub: node test runner has no document global.
globalThis.document = {
  documentElement: {
    setAttribute: (name, value) => {
      globalThis.__docAttr = globalThis.__docAttr ?? {};
      globalThis.__docAttr[name] = value;
    },
    getAttribute: (name) => globalThis.__docAttr?.[name] ?? null,
  },
};

test("applyThemeToDocument sets the data-theme attribute", () => {
  globalThis.__docAttr = {};
  applyThemeToDocument("night");
  assert.equal(document.documentElement.getAttribute("data-theme"), "night");
  applyThemeToDocument("dusk");
  assert.equal(document.documentElement.getAttribute("data-theme"), "dusk");
});

test("applyMotionToDocument sets the data-motion attribute", () => {
  globalThis.__docAttr = {};
  applyMotionToDocument("reduced");
  assert.equal(document.documentElement.getAttribute("data-motion"), "reduced");
  applyMotionToDocument("off");
  assert.equal(document.documentElement.getAttribute("data-motion"), "off");
});
