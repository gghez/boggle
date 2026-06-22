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

test("ignores already-used cell that is not the previous", () => {
  // 5,6,7 used; revisiting 5 (path[0]) does nothing
  expect(extendPath([5, 6, 7], 5)).toEqual([5, 6, 7]);
});

test("backtracks when returning to second-to-last cell", () => {
  expect(extendPath([5, 6, 7], 6)).toEqual([5, 6]);
});
