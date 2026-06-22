import { Countdown } from "./timer";

test("ticks down and ends", () => {
  vi.useFakeTimers();
  const ticks: number[] = [];
  let ended = false;
  const c = new Countdown(
    3,
    (r) => ticks.push(r),
    () => {
      ended = true;
    },
  );
  c.start();
  vi.advanceTimersByTime(3000);
  expect(ticks[0]).toBe(2);
  expect(ended).toBe(true);
  expect(c.remaining).toBe(0);
  vi.useRealTimers();
});
