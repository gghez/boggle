import { el, clear } from "./dom";

/** Render the home screen with a "new game" button and a help button. */
export function renderHome(root: HTMLElement, onStart: () => void, onHelp: () => void): void {
  clear(root);
  // The title is spelled out on ivory dice, echoing the physical Boggle cubes.
  // The letters are decorative (aria-hidden); the <h1> carries the accessible name.
  const dice = [..."BOGGLE"].map((ch) =>
    el("span", { className: "brand-die", textContent: ch, ariaHidden: "true" }),
  );
  const screen = el("div", { className: "screen screen--home" }, [
    el("button", {
      className: "btn help-btn",
      textContent: "?",
      title: "Règles",
      onclick: onHelp,
    }),
    el("h1", { className: "title brand-dice", ariaLabel: "Boggle" }, dice),
    el("p", {
      className: "subtitle",
      textContent: "Trouve un max de mots en 3 minutes.",
    }),
    el("button", {
      className: "btn btn--primary",
      textContent: "Nouvelle partie",
      onclick: onStart,
    }),
  ]);
  root.append(screen);
}
