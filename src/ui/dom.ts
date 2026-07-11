/** Tiny element factory: el("div", { className: "x" }, ["text", childNode]). */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const c of children) node.append(c);
  return node;
}

/** Remove all children of an element. */
export function clear(node: HTMLElement): void {
  node.replaceChildren();
}

/** Show a transient toast message at the bottom of the screen. */
export function toast(message: string): void {
  const t = el('div', { className: 'toast', textContent: message });
  document.body.append(t);
  setTimeout(() => t.classList.add('toast--in'), 10);
  setTimeout(() => {
    t.classList.remove('toast--in');
    setTimeout(() => t.remove(), 300);
  }, 1800);
}
