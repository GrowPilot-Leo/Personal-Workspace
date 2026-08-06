import test from "node:test";
import assert from "node:assert/strict";
import {
  loadMotion,
  loadTheme,
  safeLoadMotion,
  safeLoadTheme,
  saveMotion,
  saveTheme,
} from "./theme-storage.ts";

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
  };
}

test("loadTheme returns default when storage is empty", () => {
  assert.equal(loadTheme(memoryStorage()), "day");
});

test("saveTheme then loadTheme round-trips", () => {
  const storage = memoryStorage();
  saveTheme(storage, "dusk");
  assert.equal(loadTheme(storage), "dusk");
});

test("loadTheme ignores invalid stored values", () => {
  const storage = memoryStorage({ "growpilot.theme.v1": "dark" });
  assert.equal(loadTheme(storage), "day");
});

test("motion persistence round-trips and guards invalid values", () => {
  const storage = memoryStorage();
  assert.equal(loadMotion(storage), "system");
  saveMotion(storage, "reduced");
  assert.equal(loadMotion(storage), "reduced");
  const bad = memoryStorage({ "growpilot.motion.v1": "high" });
  assert.equal(loadMotion(bad), "system");
});

// SSR safety: useState initializers run during server pre-render where
// window.localStorage is undefined. The safe variants must not throw.
test("safeLoadTheme returns defaults when window is unavailable", () => {
  const originalWindow = globalThis.window;
  globalThis.window = undefined;
  try {
    assert.equal(safeLoadTheme(), "day");
    assert.equal(safeLoadMotion(), "system");
  } finally {
    globalThis.window = originalWindow;
  }
});

test("safeLoadTheme reads real storage when window exists", () => {
  const originalWindow = globalThis.window;
  globalThis.window = { localStorage: memoryStorage({ "growpilot.theme.v1": "night" }) };
  try {
    assert.equal(safeLoadTheme(), "night");
    assert.equal(safeLoadMotion(), "system");
  } finally {
    globalThis.window = originalWindow;
  }
});
