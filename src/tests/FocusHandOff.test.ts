import assert from "node:assert/strict";
import test from "node:test";

import {
  FOCUS_CHAIN_END,
  FOCUS_HEADINGS,
  focusChain,
  headingToFocus,
} from "../components/ui/FocusHandOff";

/** A stand-in for an element: just what the hand-off reads. */
type FakeNode = {
  name: string;
  parentElement: FakeNode | null;
  isConnected: boolean;
  matches(selector: string): boolean;
  querySelector(selector: string): FakeNode | null;
};

function node(
  name: string,
  parent: FakeNode | null,
  { end = false, heading = null as FakeNode | null } = {},
): FakeNode {
  return {
    name,
    parentElement: parent,
    isConnected: true,
    matches(selector) {
      assert.equal(selector, FOCUS_CHAIN_END);
      return end;
    },
    querySelector(selector) {
      assert.equal(selector, FOCUS_HEADINGS);
      return heading;
    },
  };
}

const asElement = (fake: FakeNode | null) => fake as unknown as HTMLElement;
const names = (chain: readonly HTMLElement[]) =>
  chain.map((element) => (element as unknown as FakeNode).name);

test("the walk up stops at the nearest main, dialog or body, which it includes", () => {
  assert.equal(FOCUS_CHAIN_END, 'main, [role="dialog"], body');
  assert.equal(FOCUS_HEADINGS, "h1, h2, h3, h4");

  const body = node("body", null, { end: true });
  const main = node("main", body, { end: true });
  const article = node("article", main);
  const td = node("td", article);
  const panel = node("panel", td);
  assert.deepEqual(names(focusChain(asElement(panel))), ["td", "article", "main"]);

  const dialog = node("dialog", body, { end: true });
  const dialogPanel = node("panel", node("div", dialog));
  assert.deepEqual(names(focusChain(asElement(dialogPanel))), ["div", "dialog"]);

  // The notification rail sits beside main, so its walk ends at body.
  const aside = node("aside", node("rail", body));
  assert.deepEqual(
    names(focusChain(asElement(node("panel", node("div", aside))))),
    ["div", "aside", "rail", "body"],
  );

  assert.deepEqual(focusChain(asElement(node("detached", null))), []);
});

test("focus goes to the first heading of the first ancestor still in the page that has one", () => {
  const body = node("body", null, { end: true });
  const h2 = node("h2", null);
  // Riwayat: the cell stays (now "Memuat riwayat...") but has no heading;
  // the list's article holds "Daftar Riwayat".
  const main = node("main", body, { end: true, heading: node("h1", null) });
  const article = node("article", main, { heading: h2 });
  const td = node("td", article);
  const chain = [td, article, main].map(asElement);
  assert.equal(headingToFocus(chain, null, asElement(body)), asElement(h2));

  // The wristband card was replaced: skip it, the page's h1 comes next.
  const h1 = node("h1", null);
  const page = node("page", main, { heading: h1 });
  const card = { ...node("card", page, { heading: node("h2", null) }), isConnected: false };
  assert.equal(
    headingToFocus([card, page, main].map(asElement), asElement(body), asElement(body)),
    asElement(h1),
  );

  // The profile gate: the card is gone and the loader's main has no heading.
  const gateMain = node("main", body, { end: true });
  const gateCard = { ...node("card", gateMain), isConnected: false };
  assert.equal(headingToFocus([gateCard, gateMain].map(asElement), null, asElement(body)), null);
  assert.equal(headingToFocus([], null, asElement(body)), null);
});

test("focus that something else took meanwhile stays there", () => {
  const body = node("body", null, { end: true });
  const article = node("article", body, { heading: node("h2", null) });
  const chain = [article].map(asElement);
  // A dialog that just opened holds focus: the page behind it is not focused.
  const dialog = node("dialog", body, { end: true });
  assert.equal(headingToFocus(chain, asElement(dialog), asElement(body)), null);
  // Dropped focus is null or body: then the heading takes it.
  assert.notEqual(headingToFocus(chain, null, asElement(body)), null);
  assert.notEqual(headingToFocus(chain, asElement(body), asElement(body)), null);
});
