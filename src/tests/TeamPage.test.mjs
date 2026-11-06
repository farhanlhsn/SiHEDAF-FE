import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");
const requiredFiles = [
  "app/tim-kami/page.tsx",
  "components/sections/TeamSection.tsx",
  "components/ui/TeamCard.tsx",
];

async function findMissingFiles() {
  const checks = await Promise.all(
    requiredFiles.map(async (filePath) => {
      try {
        await access(path.join(sourceDirectory, filePath));
        return null;
      } catch {
        return filePath;
      }
    }),
  );

  return checks.filter(Boolean);
}

test("defines the team route with PascalCase Server Components", async () => {
  const missingFiles = await findMissingFiles();

  assert.deepEqual(missingFiles, [], "team-page files are missing");

  for (const componentPath of requiredFiles.slice(1)) {
    const filename = path.basename(componentPath);
    const source = await readFile(path.join(sourceDirectory, componentPath), "utf8");

    assert.match(filename, /^[A-Z][A-Za-z]+\.tsx$/);
    assert.doesNotMatch(source, /["']use client["']/);
  }
});

test("renders four blank team cards with active route navigation", async (context) => {
  if ((await findMissingFiles()).length > 0) {
    context.skip("team-page files have not been implemented yet");
    return;
  }

  const [pageSource, teamSource, cardSource, headerSource, navigationSource] =
    await Promise.all([
      readFile(path.join(sourceDirectory, requiredFiles[0]), "utf8"),
      readFile(path.join(sourceDirectory, requiredFiles[1]), "utf8"),
      readFile(path.join(sourceDirectory, requiredFiles[2]), "utf8"),
      readFile(
        path.join(sourceDirectory, "components/sections/HeaderSection.tsx"),
        "utf8",
      ),
      readFile(
        path.join(sourceDirectory, "components/sections/PublicNavigation.ts"),
        "utf8",
      ),
    ]);
  const allSource = [
    pageSource,
    teamSource,
    cardSource,
    headerSource,
    navigationSource,
  ].join("\n");

  assert.ok(pageSource.indexOf("<HeaderSection") < pageSource.indexOf("<TeamSection"));
  assert.ok(pageSource.indexOf("<TeamSection") < pageSource.indexOf("<FooterSection"));
  assert.match(pageSource, /activePage="team"/);
  assert.match(teamSource, /Tim pengembang/);
  assert.match(teamSource, /di balik/);
  assert.doesNotMatch(teamSource, /font-serif/);
  assert.match(teamSource, /SiHEDAF/);

  for (const role of [
    "UI/UX Designer",
    "Frontend Developer",
    "Backend Developer",
    "AI Developer",
  ]) {
    assert.ok(teamSource.includes(role), `missing team role: ${role}`);
  }

  assert.match(teamSource, /name: "Casta Garneta"/);
  assert.match(teamSource, /name: "Hauzan Rafi Attallah"/);
  assert.match(teamSource, /name: "Muhammad Rifki Anandita"/);
  assert.match(teamSource, /name: "Agung Ramadhan"/);
  assert.match(cardSource, /LinkedIn/);
  assert.match(cardSource, /bg-gradient-to-b/);
  assert.match(headerSource, /from "next\/link"/);
  assert.match(allSource, /\/tim-kami/);
  assert.doesNotMatch(allSource, /["']use client["']/);
});
