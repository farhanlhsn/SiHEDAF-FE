import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("installs the Radix scroll-area primitive", async () => {
  const packageSource = await readFile(path.join(project, "package.json"), "utf8");

  assert.match(packageSource, /@radix-ui\/react-scroll-area/);
});

test("exposes an automatic horizontal ScrollArea component", async () => {
  const component = await readFile(
    path.join(project, "src/components/ui/ScrollArea.tsx"),
    "utf8",
  ).catch(() => "");

  assert.match(component, /^"use client";/);
  assert.match(component, /ScrollAreaPrimitive\.Root/);
  assert.match(component, /type="auto"/);
  assert.match(component, /ScrollAreaPrimitive\.Viewport/);
  assert.match(component, /orientation="horizontal"/);
  assert.match(component, /ScrollAreaPrimitive\.Thumb/);
  assert.match(component, /bg-primary-200/);
  assert.doesNotMatch(component, /forceMount/);
});

test("names the scroll region and only exposes it while the content overflows", async () => {
  const component = await readFile(
    path.join(project, "src/components/ui/ScrollArea.tsx"),
    "utf8",
  );

  assert.match(component, /new ResizeObserver/);
  assert.match(component, /new MutationObserver/);
  assert.match(component, /document\.fonts\?\.ready/);
  // Rows slide in 5px (stagger-item), which widens the content until the animation ends.
  assert.match(component, /addEventListener\("animationend", measure\)/);
  assert.match(component, /scrollWidth - viewport\.clientWidth > 1/);
  assert.match(component, /role: "region"/);
  assert.match(component, /tabIndex: 0/);
  assert.match(component, /\{overflows \? \(\s*<ScrollAreaPrimitive\.Scrollbar/);
  // aria-label on the bare scrollbar div is not allowed; the viewport region carries the name.
  assert.doesNotMatch(component, /<ScrollAreaPrimitive\.Scrollbar[^>]*aria-label/);
});
