import { el, clear } from "./dom";

/** Render the home screen with a "new game" button. */
export function renderHome(root: HTMLElement, onStart: () => void): void {
  clear(root);
  const screen = el("div", { className: "screen screen--home" }, [
    el("h1", { className: "title", textContent: "Boggle" }),
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
