import test from "node:test";
import assert from "node:assert/strict";
import {
  cardHover,
  dialogOpen,
  pageEnter,
  sheetOpen,
} from "./motion-variants.ts";

test("pageEnter animates opacity 0->1 and y 8->0", () => {
  assert.equal(pageEnter.initial.opacity, 0);
  assert.equal(pageEnter.animate.opacity, 1);
  assert.equal(pageEnter.initial.y, 8);
  assert.equal(pageEnter.animate.y, 0);
  assert.ok(pageEnter.transition.duration <= 0.4, "page enter stays under 400ms");
});

test("cardHover lifts by 2px with a short duration", () => {
  assert.equal(cardHover.whileHover.y, -2);
  assert.ok(cardHover.transition.duration <= 0.25, "card hover stays subtle");
});

test("dialogOpen scales from 0.96 with fade", () => {
  assert.equal(dialogOpen.initial.scale, 0.96);
  assert.equal(dialogOpen.animate.scale, 1);
  assert.equal(dialogOpen.initial.opacity, 0);
  assert.equal(dialogOpen.animate.opacity, 1);
});

test("sheetOpen slides from the right with fade", () => {
  assert.equal(sheetOpen.initial.x, 40);
  assert.equal(sheetOpen.animate.x, 0);
  assert.equal(sheetOpen.initial.opacity, 0);
});
