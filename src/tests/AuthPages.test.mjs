import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");
const requiredFiles = [
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/lupa-kata-sandi/page.tsx",
  "app/reset-password/page.tsx",
  "app/hubungkan-perangkat/page.tsx",
  "components/auth/AuthShell.tsx",
  "components/auth/AuthVisualPanel.tsx",
  "components/auth/AuthInput.tsx",
  "components/auth/LoginForm.tsx",
  "components/auth/RegisterForm.tsx",
  "components/auth/ForgotPasswordForm.tsx",
  "components/auth/ResetPasswordForm.tsx",
  "components/auth/ConnectDeviceForm.tsx",
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

test("defines five auth routes with PascalCase shared components", async () => {
  const missingFiles = await findMissingFiles();

  assert.deepEqual(missingFiles, [], "auth and device page files are missing");

  for (const componentPath of requiredFiles.slice(5)) {
    const filename = path.basename(componentPath);
    assert.match(filename, /^[A-Z][A-Za-z]+\.tsx$/);
  }
});

test("composes the shared split-screen shell and route-specific forms", async (context) => {
  if ((await findMissingFiles()).length > 0) {
    context.skip("auth and device pages have not been implemented yet");
    return;
  }

  const sources = await Promise.all(
    requiredFiles.map((filePath) =>
      readFile(path.join(sourceDirectory, filePath), "utf8"),
    ),
  );
  const [
    loginPage,
    registerPage,
    forgotPasswordPage,
    resetPasswordPage,
    devicePage,
    shell,
    visualPanel,
  ] = sources;
  const allSource = sources.join("\n");

  assert.match(loginPage, /<AuthShell/);
  assert.match(loginPage, /<LoginForm/);
  assert.match(registerPage, /<AuthShell/);
  assert.match(registerPage, /<RegisterForm/);
  assert.match(forgotPasswordPage, /<ForgotPasswordForm/);
  assert.match(resetPasswordPage, /<ResetPasswordForm/);
  assert.match(devicePage, /<AuthShell/);
  assert.match(devicePage, /<ConnectDeviceForm/);
  assert.match(shell, /<AuthVisualPanel/);
  assert.match(visualPanel, /from "next\/image"/);
  assert.match(visualPanel, /src="\/watch\.png"/);

  for (const copy of [
    "Masuk ke Akun",
    "Daftar Akun",
    "Lupa Kata Sandi",
    "Buat Kata Sandi Baru",
    "Hubungkan Perangkat",
    "Selamat datang",
    "Langkah awal pencegahan",
    "Masukkan Device ID",
  ]) {
    assert.ok(allSource.includes(copy), `missing auth reference copy: ${copy}`);
  }
});

test("implements active form states, password toggles, and fixed navigation", async (context) => {
  if ((await findMissingFiles()).length > 0) {
    context.skip("auth and device pages have not been implemented yet");
    return;
  }

  const [inputSource, loginSource, registerSource, deviceSource] = await Promise.all([
    readFile(path.join(sourceDirectory, "components/auth/AuthInput.tsx"), "utf8"),
    readFile(path.join(sourceDirectory, "components/auth/LoginForm.tsx"), "utf8"),
    readFile(path.join(sourceDirectory, "components/auth/RegisterForm.tsx"), "utf8"),
    readFile(path.join(sourceDirectory, "components/auth/ConnectDeviceForm.tsx"), "utf8"),
  ]);

  for (const formSource of [loginSource, registerSource, deviceSource]) {
    assert.match(formSource, /^["']use client["'];/);
  }

  for (const localStateForm of [deviceSource]) {
    assert.match(localStateForm, /useState/);
    assert.match(localStateForm, /disabled={!isComplete}/);
    assert.match(localStateForm, /required/);
  }

  assert.match(inputSource, /showPassword/);
  assert.match(inputSource, /type="button"/);
  assert.match(loginSource, /useLogin/);
  assert.match(loginSource, /zodResolver\(LoginRequestSchema\)/);
  assert.match(loginSource, /disabled={!isValid \|\| isPending}/);
  assert.match(loginSource, /router\.replace\("\/dashboard"\)/);
  assert.match(registerSource, /useRegister/);
  assert.match(registerSource, /zodResolver\(RegisterFormSchema\)/);
  assert.match(registerSource, /disabled={!isValid \|\| isPending}/);
  assert.match(registerSource, /router\.replace\("\/login"\)/);
  assert.match(deviceSource, /Hubungkan perangkat/);
});

test("keeps auth screens readable and calm for older users", async () => {
  const files = [
    "components/auth/AuthShell.tsx",
    "components/auth/AuthVisualPanel.tsx",
    "components/auth/AuthJourney.tsx",
    "components/auth/AuthInput.tsx",
    "components/auth/LoginForm.tsx",
    "components/auth/RegisterForm.tsx",
    "components/auth/ForgotPasswordForm.tsx",
    "components/auth/ResetPasswordForm.tsx",
    "components/auth/ConnectDeviceForm.tsx",
  ];
  const sources = await Promise.all(
    files.map((filePath) => readFile(path.join(sourceDirectory, filePath), "utf8")),
  );
  const allSource = sources.join("\n");
  const inputSource = sources[3];

  assert.doesNotMatch(allSource, /font-serif/, "no italic serif accent words");
  assert.doesNotMatch(
    allSource,
    /(?<!placeholder:)text-primary-900\/(?:[1-6]\d|[1-9])\b/,
    "navy text below 70% opacity fails WCAG AA on paper",
  );
  assert.doesNotMatch(allSource, /text-\[(?:[0-9]|1[0-2])px\]/, "auth type stays at 13px or larger");
  assert.doesNotMatch(allSource, /opacity-50/, "disabled buttons stay readable instead of fading");
  assert.match(inputSource, /text-\[1rem\]/, "16px inputs avoid iOS zoom on focus");
  assert.match(inputSource, /CircleAlert/, "errors pair colour with an icon");
  assert.match(inputSource, /role="alert"/);
});

test("connects landing entry points to login and registration routes", async () => {
  const [headerSource, ctaSource] = await Promise.all([
    readFile(path.join(sourceDirectory, "components/sections/HeaderSection.tsx"), "utf8"),
    readFile(path.join(sourceDirectory, "components/sections/CtaSection.tsx"), "utf8"),
  ]);

  assert.match(headerSource, /href="\/register"/);
  assert.match(headerSource, /href="\/login"/);
  assert.match(ctaSource, /from "next\/link"/);
  assert.match(ctaSource, /href="\/register"/);
});
