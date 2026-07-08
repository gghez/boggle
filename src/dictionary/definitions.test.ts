import { parseDefinitions, DefinitionLookup } from "./definitions";

test("parseDefinitions reads word<TAB>gloss lines", () => {
  const map = parseDefinitions("chat\tPetit mammifere.\nchien\tCanide domestique.\n");
  expect(map.get("chat")).toBe("Petit mammifere.");
  expect(map.get("chien")).toBe("Canide domestique.");
  expect(map.size).toBe(2);
});

test("parseDefinitions skips blank and tab-less lines", () => {
  const map = parseDefinitions("chat\tPetit mammifere.\n\nnogloss\n");
  expect(map.size).toBe(1);
  expect(map.has("nogloss")).toBe(false);
});

test("DefinitionLookup.get is accent-insensitive and returns null when absent", () => {
  const look = new DefinitionLookup(new Map([["eleve", "Personne qui recoit un enseignement."]]));
  expect(look.get("élève")).toBe("Personne qui recoit un enseignement.");
  expect(look.get("ELEVE")).toBe("Personne qui recoit un enseignement.");
  expect(look.get("inconnu")).toBeNull();
});
