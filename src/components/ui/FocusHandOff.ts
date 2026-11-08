/**
 * Where focus goes when an error panel that holds it disappears (a retry
 * replaced it), so it is not dropped on <body>. Pure over the DOM nodes it is
 * given, so it is unit-tested with stand-ins.
 */

/** Where the walk up stops (included): the page's main, a dialog, or body. */
export const FOCUS_CHAIN_END = 'main, [role="dialog"], body';

/** The headings that can take focus, in document order. */
export const FOCUS_HEADINGS = "h1, h2, h3, h4";

/**
 * The panel's ancestors, from its parent up to and including the nearest
 * main, dialog or body. Read while the panel is still in the page.
 */
export function focusChain(panel: HTMLElement): HTMLElement[] {
  const chain: HTMLElement[] = [];
  for (let node = panel.parentElement; node; node = node.parentElement) {
    chain.push(node);
    if (node.matches(FOCUS_CHAIN_END)) break;
  }
  return chain;
}

/**
 * The heading to focus once the panel is gone: the first h1–h4 of the first
 * chain element that is still in the page and holds one. null when focus was
 * not really dropped (something else took it meanwhile, e.g. a dialog that
 * just opened) or when no such heading exists.
 */
export function headingToFocus(
  chain: readonly HTMLElement[],
  active: Element | null,
  body: Element | null,
): HTMLElement | null {
  if (active && active !== body) return null;

  for (const node of chain) {
    if (!node.isConnected) continue;
    const heading = node.querySelector<HTMLElement>(FOCUS_HEADINGS);
    if (heading) return heading;
  }

  return null;
}
