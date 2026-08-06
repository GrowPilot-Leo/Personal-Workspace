import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MOTION,
  DEFAULT_THEME,
  isMotion,
  isTheme,
  normalizeMotion,
  normalizeTheme,
} from "./theme.ts";

test("defaults are day theme and system motion", () => {
  assert.equal(DEFAULT_THEME, "day");
  assert.equal(DEFAULT_MOTION, "system");
});

test("isTheme and isMotion accept only valid values", () => {
  assert.equal(isTheme("day"), true);
  assert.equal(isTheme("night"), true);
  assert.equal(isTheme("dusk"), true);
  assert.equal(isTheme("dark"), false);
  assert.equal(isTheme(null), false);
  assert.equal(isMotion("full"), true);
  assert.equal(isMotion("reduced"), true);
  assert.equal(isMotion("off"), true);
  assert.equal(isMotion("system"), true);
  assert.equal(isMotion("high"), false);
});

test("normalizeTheme falls back for invalid input", () => {
  assert.equal(normalizeTheme("night"), "night");
  assert.equal(normalizeTheme("dark"), "day");
  assert.equal(normalizeTheme(undefined), "day");
  assert.equal(normalizeTheme(null, "dusk"), "dusk");
});

test("normalizeMotion falls back for invalid input", () => {
  assert.equal(normalizeMotion("reduced"), "reduced");
  assert.equal(normalizeMotion("high"), "system");
  assert.equal(normalizeMotion(undefined), "system");
  assert.equal(normalizeMotion(null, "off"), "off");
});
