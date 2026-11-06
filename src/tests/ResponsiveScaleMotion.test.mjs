import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");

async function readSource(relativePath) {
  return readFile(path.join(sourceDirectory, relativePath), "utf8");
}

test("uses fixed mobile navigation and sticky desktop navigation", async () => {
  const [header, hero] = await Promise.all([
    readSource("components/sections/HeaderSection.tsx"),
    readSource("components/sections/HeroSection.tsx"),
  ]);

  assert.match(header, /h-\[76px\]/);
  assert.match(header, /fixed inset-x-0 top-0/);
  assert.match(header, /md:static/);
  assert.match(header, /md:sticky md:top-0/);
  assert.match(header, /max-w-\[1440px\]/);
  assert.match(hero, /min-h-\[calc\(100svh-76px\)\]/);
  assert.doesNotMatch(hero, /min-h-\[680px\]/);
});

test("floats the mobile menu without turning the public header into a client boundary", async () => {
  const [header, mobileNavigation] = await Promise.all([
    readSource("components/sections/HeaderSection.tsx"),
    readSource("components/sections/MobileNavigation.tsx").catch(() => ""),
  ]);
  const navigationSource = `${header}\n${mobileNavigation}`;

  assert.match(navigationSource, /data-mobile-menu-overlay/);
  assert.match(navigationSource, /absolute inset-x-0 top-\[76px\]/);
  assert.doesNotMatch(header, /["']use client["']/);
  assert.match(mobileNavigation, /["']use client["']/);
});

test("keeps public navigation outside page motion and releases the transform", async () => {
  const [globalStyles, homePage, teamPage] = await Promise.all([
    readSource("app/globals.css"),
    readSource("app/page.tsx"),
    readSource("app/tim-kami/page.tsx"),
  ]);
  const pageEnterStart = globalStyles.indexOf("@keyframes page-enter");
  const pageEnterEnd = globalStyles.indexOf(
    "@keyframes section-reveal",
    pageEnterStart,
  );
  const pageEnterKeyframes = globalStyles.slice(pageEnterStart, pageEnterEnd);

  assert.match(pageEnterKeyframes, /to\s*{[^}]*transform:\s*none/s);
  assert.match(globalStyles, /\.page-enter\s*{[^}]*animation:[^;]*\bbackwards;/s);
  assert.match(homePage, /<HeaderSection\s*\/>[\s\S]*className="page-enter/);
  assert.match(
    teamPage,
    /<HeaderSection activePage="team"\s*\/>[\s\S]*className="page-enter/,
  );
});

test("limits scroll-linked reveal transforms to tablet and desktop", async () => {
  const globalStyles = await readSource("app/globals.css");

  assert.match(
    globalStyles,
    /@media\s*\(min-width:\s*768px\)\s*{[\s\S]*@supports\s*\(animation-timeline:\s*view\(\)\)[\s\S]*\.section-reveal[\s\S]*\.child-reveal/,
  );
});

test("adds global smooth scrolling and progressive reveal motion", async () => {
  const globalStyles = await readSource("app/globals.css");

  assert.match(globalStyles, /scroll-behavior:\s*smooth/);
  assert.match(globalStyles, /scroll-padding-top/);
  assert.match(globalStyles, /overscroll-behavior-y/);
  assert.match(globalStyles, /\.page-enter/);
  assert.match(globalStyles, /\.section-reveal/);
  assert.match(globalStyles, /prefers-reduced-motion/);
});

test("separates the landing CTA from a larger footer", async () => {
  const [cta, footer] = await Promise.all([
    readSource("components/sections/CtaSection.tsx"),
    readSource("components/sections/FooterSection.tsx"),
  ]);

  assert.match(cta, /pb-(?:16|20|24|28|32)/);
  assert.match(footer, /min-h-\[(?:72|80|88|96)px\]/);
  assert.match(footer, /max-w-\[1440px\]/);
});

test("removes unreadable 8px and 9px type from application components", async () => {
  const componentFiles = [
    "components/auth/AuthInput.tsx",
    "components/auth/AuthShell.tsx",
    "components/auth/LoginForm.tsx",
    "components/auth/RegisterForm.tsx",
    "components/dashboard/DashboardOverview.tsx",
    "components/dashboard/DashboardSidebar.tsx",
    "components/dashboard/DashboardTopbar.tsx",
    "components/dashboard/EditProfileView.tsx",
    "components/dashboard/HistoryView.tsx",
    "components/dashboard/NotificationPanel.tsx",
    "components/dashboard/ProfileView.tsx",
    "components/dashboard/SignalChart.tsx",
    "components/sections/FooterSection.tsx",
    "components/sections/HeaderSection.tsx",
    "components/sections/ProcessSection.tsx",
    "components/ui/TeamCard.tsx",
  ];
  const sources = await Promise.all(componentFiles.map(readSource));

  assert.doesNotMatch(sources.join("\n"), /text-\[(?:8|9)px\]/);
});

test("scales auth and dashboard shells without CSS zoom", async () => {
  const [authShell, dashboardShell, globalStyles] = await Promise.all([
    readSource("components/auth/AuthShell.tsx"),
    readSource("components/dashboard/DashboardShell.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(authShell, /min-h-dvh/);
  assert.match(authShell, /max-w-\[(?:560|580|600)px\]/);
  assert.match(dashboardShell, /lg:w-\[(?:232|240|248)px\]/);
  assert.match(dashboardShell, /h-\[(?:68|72)px\]/);
  assert.doesNotMatch(globalStyles, /\bzoom\s*:/);
});

test("stacks history controls without page-level mobile overflow", async () => {
  const history = await readSource("components/dashboard/HistoryView.tsx");

  assert.match(history, /flex flex-col gap-5/);
  assert.match(history, /sm:flex-row/);
  assert.match(history, /flex w-full items-center justify-between/);
  assert.match(history, /sm:w-auto/);
  assert.match(history, /viewportClassName="pb-2"/);
});
