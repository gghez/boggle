import { cleanGloss, truncateGloss } from "./gloss";

test("cleanGloss collapses newlines, tabs and spaces to single spaces", () => {
  expect(cleanGloss("Ligne un.\nLigne\tdeux.   Fin. ")).toBe("Ligne un. Ligne deux. Fin.");
});

test("truncateGloss keeps short text unchanged", () => {
  expect(truncateGloss("Court.", 140)).toBe("Court.");
});

test("truncateGloss cuts on a word boundary and appends an ellipsis", () => {
  const text =
    "Ceremonie ou prestation reservee a un nouvel arrivant consistant a lui souhaiter la bienvenue et a aider dans ses demarches";
  const out = truncateGloss(text, 60);
  expect(out.length).toBeLessThanOrEqual(61);
  expect(out.endsWith("…")).toBe(true);
  expect(out).not.toMatch(/\s…$/); // no space just before the ellipsis
  expect(text.startsWith(out.slice(0, -1))).toBe(true); // no partial word
});
