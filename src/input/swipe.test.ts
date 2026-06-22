import { extendPath } from "./swipe";

test("starts a path", () => {
  expect(extendPath([], 5)).toEqual([5]);
});

test("appends adjacent unused cell", () => {
  expect(extendPath([5], 6)).toEqual([5, 6]);
});

test("ignores non-adjacent cell", () => {
  expect(extendPath([5], 7)).toEqual([5]);
});

test("backtracks when returning to the previous cell (N-1 from N)", () => {
  expect(extendPath([5, 6, 7], 6)).toEqual([5, 6]);
});

test("backtracks to any earlier cell, dropping everything after it", () => {
  // fast drag jumps back onto the first letter
  expect(extendPath([5, 6, 7], 5)).toEqual([5]);
  // jump back to a middle letter
  expect(extendPath([5, 6, 7, 11], 6)).toEqual([5, 6]);
});
