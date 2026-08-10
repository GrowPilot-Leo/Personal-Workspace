import test from "node:test";
import assert from "node:assert/strict";
import {
  cardHover,
  dialogOpen,
  pageEnter,
  sheetOpen,
} from "./motion-variants.ts";

test("pageEnter uses short travel and settles under 300ms", () => {
  assert.equal(pageEnter.initial.opacity, 0);
  assert.equal(pageEnter.animate.opacity, 1);
  assert.equal(pageEnter.initial.y, 6);
  assert.equal(pageEnter.animate.y, 0);
  assert.ok(pageEnter.transition.duration <= 0.3, "page enter stays quick");
});

test("cardHover uses a low-bounce spring and press feedback", () => {
  assert.equal(cardHover.whileHover.y, -2);
  assert.equal(cardHover.whileTap.scale, 0.99);
  assert.equal(cardHover.transition.type, "spring");
  assert.ok(cardHover.transition.damping >= 30, "card hover should not feel bouncy");
});

test("dialogOpen uses a restrained scale and spring", () => {
  assert.equal(dialogOpen.initial.scale, 0.97);
  assert.equal(dialogOpen.animate.scale, 1);
  assert.equal(dialogOpen.initial.opacity, 0);
  assert.equal(dialogOpen.animate.opacity, 1);
  assert.equal(dialogOpen.transition.type, "spring");
});

test("sheetOpen uses short travel and a damped spring", () => {
  assert.equal(sheetOpen.initial.x, 34);
  assert.equal(sheetOpen.animate.x, 0);
  assert.equal(sheetOpen.initial.opacity, 0);
  assert.equal(sheetOpen.transition.type, "spring");
  assert.ok(sheetOpen.transition.damping >= 34);
});
