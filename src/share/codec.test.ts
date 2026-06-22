import { encodeChallenge, decodeChallenge } from "./codec";

test("round-trips a challenge", () => {
  const board = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","Qu"];
  const token = encodeChallenge({ board, wordsToBeat: 17 });
  expect(decodeChallenge(token)).toEqual({ board, wordsToBeat: 17 });
});

test("token is url-safe", () => {
  const token = encodeChallenge({ board: Array(16).fill("A"), wordsToBeat: 0 });
  expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
});

test("returns null on corrupt token", () => {
  expect(decodeChallenge("!!!not-valid!!!")).toBeNull();
  expect(decodeChallenge("")).toBeNull();
});
