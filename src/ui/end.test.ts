import { renderEnd } from "./end";
import { DefinitionLookup } from "../dictionary/definitions";
import { GameEngine } from "../game/engine";
import type { Tile } from "../grid/generator";

const board: Tile[] = ["A", "R", "C", ...Array(13).fill("Z")];

function makeEngineWithArc(): GameEngine {
  const engine = new GameEngine(board, { has: (w) => w === "arc" });
  engine.submitPath([0, 1, 2]); // records "arc" as found
  return engine;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

test("renders found and missed words as chips", () => {
  const root = document.createElement("div");
  renderEnd(root, {
    engine: makeEngineWithArc(),
    board,
    wordsToBeat: null,
    maxWords: 2,
    maxScore: 2,
    paths: new Map([["arc", [0, 1, 2]], ["car", [2, 1, 0]]]),
    definitions: Promise.resolve(new DefinitionLookup(new Map())),
    onNewGrid: () => {},
    onReplaySame: () => {},
    onHelp: () => {},
  });
  expect(root.querySelectorAll(".chip").length).toBe(2); // arc (found) + car (missed)
  expect(root.querySelector(".tab")!.textContent).toBe("Trouvés (1)");
});

test("tapping a word traces it and shows its definition", async () => {
  const root = document.createElement("div");
  renderEnd(root, {
    engine: makeEngineWithArc(),
    board,
    wordsToBeat: null,
    maxWords: 1,
    maxScore: 1,
    paths: new Map([["arc", [0, 1, 2]]]),
    definitions: Promise.resolve(new DefinitionLookup(new Map([["arc", "Portion de courbe."]]))),
    onNewGrid: () => {},
    onReplaySame: () => {},
    onHelp: () => {},
  });
  const chip = root.querySelector(".chip") as HTMLElement;
  chip.click();
  const cells = root.querySelectorAll(".cell");
  expect(cells[0].classList.contains("cell--active")).toBe(true);
  expect(cells[1].classList.contains("cell--active")).toBe(true);
  await flush(); // let the definitions promise resolve
  expect(root.querySelector(".def__text")!.textContent).toBe("Portion de courbe.");
});

test("missed word without a gloss shows a fallback", async () => {
  const root = document.createElement("div");
  renderEnd(root, {
    engine: makeEngineWithArc(),
    board,
    wordsToBeat: null,
    maxWords: 2,
    maxScore: 2,
    paths: new Map([["arc", [0, 1, 2]], ["car", [2, 1, 0]]]),
    definitions: Promise.resolve(new DefinitionLookup(new Map())),
    onNewGrid: () => {},
    onReplaySame: () => {},
    onHelp: () => {},
  });
  // "CAR" is the missed word; its chip exists in the DOM even while its tab is hidden.
  const carChip = [...root.querySelectorAll(".chip")].find(
    (c) => c.textContent === "CAR",
  ) as HTMLElement;
  carChip.click();
  await flush();
  expect(root.querySelector(".def__text")!.textContent).toBe("Définition indisponible.");
});
