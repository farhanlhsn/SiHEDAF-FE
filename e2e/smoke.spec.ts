import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Kata sandi", { exact: true }).fill("Rahasia123!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL(/\/(dashboard|hubungkan-perangkat)/);
}

test("landing page renders the hero and the sourced facts", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByText("Ilustrasi sinyal PPG", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Framingham")).toBeAttached();
});

test("protected pages send signed-out visitors to the login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("sign in lands on the dashboard with the latest result", async ({
  page,
}) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Irama terakhirmu normal." }),
  ).toBeVisible();
  await expect(page.getByText("Terhubung").first()).toBeVisible();
});

test("history lists the analyses and opens one", async ({ page }) => {
  await signIn(page);
  await page.goto("/riwayat");
  await expect(
    page.getByRole("heading", { name: "Daftar Riwayat" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Lihat detail analisis/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("date range popover stays inside the screen", async ({ page }) => {
  await signIn(page);
  await page.goto("/riwayat");
  await page.getByRole("button", { name: /Pilih rentang tanggal/ }).click();
  const box = await page
    .getByRole("dialog", { name: "Pilih rentang tanggal" })
    .boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
});

test("profile page shows the account", async ({ page }) => {
  await signIn(page);
  await page.goto("/profil");
  await expect(
    page.getByText("Pengguna Demo").locator("visible=true").first(),
  ).toBeVisible();
});
