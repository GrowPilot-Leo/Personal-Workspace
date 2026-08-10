import test from "node:test";
import assert from "node:assert/strict";
import {
  cardHover,
  dialogOpen,
  pageEnter,
  sheetOpen,
} from "./motion-variants.ts";

test("pageEnter uses near-static travel and settles quickly", () => {
  assert.equal(pageEnter.initial.opacity, 0);
  assert.equal(pageEnter.animate.opacity, 1);
  assert.equal(pageEnter.initial.y, 4);
  assert.equal(pageEnter.animate.y, 0);
  assert.ok(pageEnter.transition.duration <= 0.22);
});

test("cards do not float on hover and only acknowledge a press", () => {
  assert.equal(cardHover.whileHover.y, 0);
  assert.equal(cardHover.whileHover.scale, 1);
  assert.equal(cardHover.whileTap.scale, 0.995);
});

test("dialogOpen uses a restrained scale and strongly damped spring", () => {
  assert.equal(dialogOpen.initial.scale, 0.985);
  assert.equal(dialogOpen.animate.scale, 1);
  assert.equal(dialogOpen.transition.type, "spring");
  assert.ok(dialogOpen.transition.damping >= 38);
});

test("sheetOpen uses short travel and a strongly damped spring", () => {
  assert.equal(sheetOpen.initial.x, 20);
  assert.equal(sheetOpen.animate.x, 0);
  assert.equal(sheetOpen.transition.type, "spring");
  assert.ok(sheetOpen.transition.damping >= 40);
});
