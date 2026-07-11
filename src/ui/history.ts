import type { Tile } from "../grid/generator";
import { clearHistory, deleteGame, listGames, type GameRecord } from "../history/store";
import { el, clear } from "./dom";

export interface HistoryOptions {
  onBack: () => void;
  onReplay: (board: Tile[], wordsToBeat: number | null) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function gameRow(game: GameRecord, opts: HistoryOptions, onDeleted: () => void): HTMLElement {
  const pct = game.humanMaxScore > 0 ? Math.round((game.score / game.humanMaxScore) * 100) : 0;

  const info = el("div", { className: "history-row__info" }, [
    el("div", { className: "history-row__date", textContent: formatDate(game.playedAt) }),
    el("div", {
      className: "history-row__stats",
      textContent: `${game.wordCount}/${game.humanMaxWords} mots · ${game.score}/${game.humanMaxScore} pts · ${pct}%`,
    }),
    ...(game.wordsToBeat != null
      ? [el("div", { className: "history-row__badge", textContent: `Défi : ${game.wordsToBeat} à battre` })]
      : []),
  ]);

  const replayBtn = el("button", {
    className: "btn history-row__btn",
    textContent: "🔁",
    title: "Rejouer cette grille",
    onclick: () => opts.onReplay(game.board, game.wordsToBeat),
  });
  const deleteBtn = el("button", {
    className: "btn history-row__btn",
    textContent: "🗑️",
    title: "Supprimer cette partie",
    onclick: () => {
      deleteGame(game.id);
      onDeleted();
    },
  });

  return el("div", { className: "history-row" }, [
    info,
    el("div", { className: "history-row__actions" }, [replayBtn, deleteBtn]),
  ]);
}

/** Render the game history screen: past games with score, and quick actions. */
export function renderHistory(root: HTMLElement, opts: HistoryOptions): void {
  clear(root);

  const games = listGames();

  const header = el("div", { className: "history-header" }, [
    el("button", { className: "btn history-back", textContent: "← Retour", onclick: opts.onBack }),
    el("h1", { className: "history-title", textContent: "Historique" }),
  ]);

  if (games.length > 0) {
    header.append(
      el("button", {
        className: "btn history-clear",
        textContent: "Vider",
        onclick: () => {
          if (!confirm("Effacer tout l'historique des parties ?")) return;
          clearHistory();
          renderHistory(root, opts);
        },
      }),
    );
  }

  const list = el("div", { className: "history-list" });
  if (games.length === 0) {
    list.append(
      el("p", {
        className: "history-empty",
        textContent: "Aucune partie jouée pour l'instant.",
      }),
    );
  } else {
    for (const game of games) {
      list.append(gameRow(game, opts, () => renderHistory(root, opts)));
    }
  }

  root.append(el("div", { className: "screen screen--history" }, [header, list]));
}
