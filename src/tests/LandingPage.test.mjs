import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");
const appDirectory = path.join(sourceDirectory, "app");
const serverComponentPaths = [
  "components/sections/HeaderSection.tsx",
  "components/sections/HeroSection.tsx",
  "components/sections/AboutSection.tsx",
  "components/sections/FeaturesSection.tsx",
  "components/sections/ProcessSection.tsx",
  "components/sections/CtaSection.tsx",
  "components/sections/FooterSection.tsx",
  "components/landing/RhythmCompare.tsx",
  "components/landing/AfFacts.tsx",
  "components/landing/DayDial.tsx",
  "components/landing/LineArt.tsx",
  "components/landing/ThreadPoint.tsx",
  "components/landing/ThreadStation.tsx",
  "components/ui/BrandLogo.tsx",
  "components/ui/SectionLabel.tsx",
  "components/ui/ArrowIcon.tsx",
];
const clientIslandPaths = [
  "components/landing/LivePulseMonitor.tsx",
  "components/landing/InView.tsx",
  "components/landing/ScrollThread.tsx",
];
const hookPaths = [
  "components/landing/hooks/UseLivePulse.ts",
  "components/landing/hooks/UseInView.ts",
  "components/landing/hooks/UseScrollThread.ts",
  "components/landing/hooks/UseReducedMotion.ts",
];
const landingPaths = [
  ...serverComponentPaths,
  ...clientIslandPaths,
  ...hookPaths,
];

async function findMissing(paths) {
  const checks = await Promise.all(
    paths.map(async (relativePath) => {
      try {
        await access(path.join(sourceDirectory, relativePath));
        return null;
      } catch {
        return relativePath;
      }
    }),
  );

  return checks.filter(Boolean);
}

async function readAll(paths) {
  return Promise.all(
    paths.map((relativePath) =>
      readFile(path.join(sourceDirectory, relativePath), "utf8"),
    ),
  );
}

test("keeps landing sections as Server Components with small client islands", async () => {
  assert.deepEqual(
    await findMissing(landingPaths),
    [],
    "landing files are missing",
  );

  for (const [index, source] of (
    await readAll(serverComponentPaths)
  ).entries()) {
    assert.match(
      path.basename(serverComponentPaths[index]),
      /^[A-Z][A-Za-z]+\.tsx$/,
    );
    assert.doesNotMatch(
      source,
      /["']use client["']/,
      serverComponentPaths[index],
    );
  }

  for (const [index, source] of (await readAll(clientIslandPaths)).entries()) {
    assert.match(
      source,
      /^["']use client["'];/,
      `${clientIslandPaths[index]} must be a client island`,
    );
    assert.match(
      source,
      /from "@\/components\/landing\/hooks\/Use[A-Z]/,
      "island logic lives in a hook",
    );
  }
});

test("composes the sections in order with the approved story, assets, and anchors", async (context) => {
  if ((await findMissing(landingPaths)).length > 0) {
    context.skip("landing files have not been implemented yet");
    return;
  }

  const pageSource = await readFile(
    path.join(appDirectory, "page.tsx"),
    "utf8",
  );
  const allSource = [pageSource, ...(await readAll(landingPaths))].join("\n");

  let previousIndex = -1;
  for (const section of [
    "HeaderSection",
    "HeroSection",
    "AboutSection",
    "FeaturesSection",
    "ProcessSection",
    "CtaSection",
    "FooterSection",
  ]) {
    const sectionIndex = pageSource.indexOf(`<${section}`);
    assert.ok(
      sectionIndex > previousIndex,
      `${section} is missing or out of order`,
    );
    previousIndex = sectionIndex;
  }

  for (const copy of [
    "Jantungmu bisa",
    "berdetak",
    "kacau",
    "tanpa terasa",
    "Stroke adalah ancaman yang bisa dicegah",
    "Bisa bedakan?",
    "Teknologi pemantauan",
    "Langkah sederhana",
    "Jantungmu kerja tanpa henti",
    "Sistem Hemat Energi Detektor Atrial Fibrilasi",
  ]) {
    assert.ok(allSource.includes(copy), `missing copy: ${copy}`);
  }

  assert.match(allSource, /src="\/logo\.png"/);
  assert.match(allSource, /src="\/watch\.png"/);
  assert.match(allSource, /from "next\/image"/);
  assert.doesNotMatch(
    allSource,
    /\bpriority\b(?:=|\s|\/)/,
    "next/image priority is deprecated in Next 16",
  );

  for (const anchor of ["tentang", "fitur", "cara-kerja"]) {
    assert.match(
      allSource,
      new RegExp(`href(?:=|:)\\s*["']/?#${anchor}["']`),
      `missing #${anchor} link`,
    );
    assert.ok(
      allSource.includes(`id="${anchor}"`),
      `missing #${anchor} target`,
    );
  }

  assert.match(allSource, /href(?:=|:)\s*["']\/tim-kami["']/);
});

test("labels demo signals as illustrations and keeps the medical disclaimer", async (context) => {
  if ((await findMissing(landingPaths)).length > 0) {
    context.skip("landing files have not been implemented yet");
    return;
  }

  const [hero, monitor, footer] = await readAll([
    "components/sections/HeroSection.tsx",
    "components/landing/LivePulseMonitor.tsx",
    "components/sections/FooterSection.tsx",
  ]);

  assert.match(`${hero}\n${monitor}`, /Ilustrasi sinyal/);
  assert.match(footer, /bukan pengganti diagnosis\s+dokter/);
  assert.match(footer, /<InView\b/);
  assert.match(footer, /footer-letter/);
  assert.match(footer, /footer-pulse/);
});

test("pauses looping motion offscreen and honours reduced motion", async (context) => {
  if ((await findMissing(landingPaths)).length > 0) {
    context.skip("landing files have not been implemented yet");
    return;
  }

  const [livePulse, inView, reducedMotion] = await readAll([
    "components/landing/hooks/UseLivePulse.ts",
    "components/landing/hooks/UseInView.ts",
    "components/landing/hooks/UseReducedMotion.ts",
  ]);

  assert.match(reducedMotion, /prefers-reduced-motion: reduce/);
  assert.match(livePulse, /useReducedMotion/);
  assert.match(livePulse, /IntersectionObserver/);
  assert.match(livePulse, /visibilitychange/);
  assert.match(livePulse, /cancelAnimationFrame/);
  assert.match(inView, /IntersectionObserver/);
  assert.match(inView, /disconnect\(\)/);
});

test("drops template accents and keeps landing text readable", async (context) => {
  if ((await findMissing(landingPaths)).length > 0) {
    context.skip("landing files have not been implemented yet");
    return;
  }

  const sources = (
    await readAll([...serverComponentPaths, ...clientIslandPaths])
  ).join("\n");

  assert.doesNotMatch(sources, /font-serif/, "no italic serif accent words");
  assert.doesNotMatch(
    sources,
    /text-primary-900\/(?:[1-6]\d|[1-9])\b/,
    "navy text below 70% opacity fails WCAG AA on the light background",
  );
  assert.doesNotMatch(
    sources,
    /text-white\/(?:[1-5]\d|[1-9])\b/,
    "white text below 60% opacity fails WCAG AA on the navy background",
  );
  assert.doesNotMatch(
    sources,
    /text-\[(?:8|9|10|11)px\]/,
    "landing type stays at 12px or larger",
  );
});

test("threads one continuous line through every section", async (context) => {
  if ((await findMissing(landingPaths)).length > 0) {
    context.skip("landing files have not been implemented yet");
    return;
  }

  const pageSource = await readFile(
    path.join(appDirectory, "page.tsx"),
    "utf8",
  );
  const [thread, hero, about, features, process, cta] = await readAll([
    "components/landing/hooks/UseScrollThread.ts",
    "components/sections/HeroSection.tsx",
    "components/sections/AboutSection.tsx",
    "components/sections/FeaturesSection.tsx",
    "components/sections/ProcessSection.tsx",
    "components/sections/CtaSection.tsx",
  ]);

  assert.match(pageSource, /<ScrollThread\s*\/>/);
  assert.ok(
    pageSource.indexOf("<ScrollThread") < pageSource.indexOf("<FooterSection"),
    "the line ends before the footer",
  );
  for (const [name, source] of Object.entries({
    hero,
    about,
    features,
    process,
    cta,
  })) {
    assert.match(
      source,
      /<Thread(?:Point|Station)\b/,
      `${name} has no thread anchor`,
    );
  }
  assert.match(thread, /buildThread/);
  assert.match(thread, /useReducedMotion/);
  assert.match(thread, /ResizeObserver/);
  assert.match(thread, /passive: true/);
  assert.match(thread, /cancelAnimationFrame/);
});

test("landing medical figures stay within what the literature supports", async () => {
  const facts = await readFile(
    path.join(sourceDirectory, "components/landing/AfFacts.tsx"),
    "utf8",
  );
  const features = await readFile(
    path.join(sourceDirectory, "components/sections/FeaturesSection.tsx"),
    "utf8",
  );

  // Earlier copy ("1 dari 2 tidak terdiagnosis", "5–7×", "20–25%") had no source.
  assert.doesNotMatch(facts, /1 dari 2|5–7×|20–25%/);
  assert.match(facts, /Framingham/);
  // No model accuracy is claimed until validation results are published.
  assert.doesNotMatch(features, /akurasi/i);
});
