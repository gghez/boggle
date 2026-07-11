import { el, clear } from './dom';

export interface RulesOptions {
  onBack: () => void;
}

function section(title: string, body: (Node | string)[]): HTMLElement {
  return el('section', { className: 'rules-section' }, [
    el('h2', { className: 'rules-section__title', textContent: title }),
    ...body,
  ]);
}

function p(text: string): HTMLElement {
  return el('p', { className: 'rules-p', textContent: text });
}

function list(items: string[]): HTMLElement {
  return el(
    'ul',
    { className: 'rules-list' },
    items.map((t) => el('li', { textContent: t })),
  );
}

/**
 * Render the rules page as a dedicated screen. The back button returns to the
 * screen the player came from (home or end) via `onBack`.
 */
export function renderRules(root: HTMLElement, opts: RulesOptions): void {
  clear(root);

  const header = el('div', { className: 'rules-header' }, [
    el('button', { className: 'btn rules-back', textContent: '← Retour', onclick: opts.onBack }),
    el('h1', { className: 'rules-title', textContent: 'Règles' }),
  ]);

  const content = el('div', { className: 'rules-content' }, [
    section('Objectif', [
      p('Trouve un maximum de mots en 3 minutes sur une grille de 4×4 lettres.'),
    ]),
    section('La grille', [
      p(
        'La grille contient 16 dés. Chaque case montre une lettre — sauf la case « Qu », ' +
          'qui est une seule case comptant pour les deux lettres Q et U.',
      ),
      p(
        'Quatre cases portent un bonus (à la Ruzzle) : L×2 / L×3 multiplient la valeur de ' +
          'cette lettre, M×2 / M×3 multiplient le score du mot entier.',
      ),
    ]),
    section('Former un mot', [
      p(
        "Un mot est un chemin sur la grille : commence sur n'importe quelle case, puis passe " +
          'à une case adjacente — horizontalement, verticalement ou en diagonale (8 directions).',
      ),
      list([
        'Une même case ne peut pas être réutilisée dans un mot.',
        'Un mot fait au moins 3 lettres (la case « Qu » en apporte 2).',
      ]),
    ]),
    section('Mots acceptés', [
      p(
        "Seuls comptent les mots présents dans l'ODS8 (Officiel du jeu Scrabble, " +
          '8e édition), le dictionnaire de référence du Scrabble français en compétition.',
      ),
      list([
        'Pas de noms propres : personnes (dont noms de famille), lieux, marques. « Dupont », « Paris », « Zidane » sont refusés.',
        "Pas d'abréviations ni de sigles.",
        "Pas de mots à trait d'union ni de mots nécessitant une apostrophe.",
      ]),
      p(
        "Les accents et les majuscules sont ignorés (é = e) : ils n'influent jamais sur la validité d'un mot.",
      ),
    ]),
    section('Score', [
      p('Chaque lettre a une valeur, comme au Scrabble :'),
      list([
        'E, A, I, N, O, R, S, T, U, L : 1 point',
        'D, G, M : 2 points',
        'B, C, P : 3 points',
        'F, H, V : 4 points',
        'J, Q : 8 points',
        'K, W, X, Y, Z : 10 points',
        '« Qu » : 9 points (Q + U)',
      ]),
      p(
        "Le score d'un mot = (somme des valeurs de ses lettres, bonus L×2/L×3 appliqués) × les " +
          'bonus de mot M×2/M×3 traversés. On ajoute enfin un bonus de longueur : +5 points par ' +
          'lettre au-delà de 4 (rien en dessous de 5 lettres).',
      ),
      p(
        'Le score dépend donc du chemin tracé : passer par les bonnes cases bonus rapporte plus ' +
          'pour un même mot.',
      ),
    ]),
    section('Ton pourcentage', [
      p(
        'Le pourcentage final ne te compare pas à tous les mots cachés dans la grille — ce ' +
          'total inclut des mots trop obscurs pour être saisis à temps, il serait hors de portée.',
      ),
      p(
        'Il te compare à un plafond humain réaliste : le score obtenu en enchaînant, sans ' +
          "t'arrêter et à un rythme normal, autant de mots que les 3 minutes permettent d'en " +
          "saisir. 100 %, c'est donc un objectif atteignable — et un très bon joueur peut même le dépasser.",
      ),
    ]),
    section('Défier un ami', [
      p(
        'La grille, ses cases bonus et ton score à battre sont encodés dans un lien de partage. ' +
          "La personne qui l'ouvre joue exactement la même grille et doit dépasser ton score — " +
          'aucun serveur, tout tient dans le lien.',
      ),
    ]),
  ]);

  root.append(el('div', { className: 'screen screen--rules' }, [header, content]));
}
