import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readSource(relativePath) {
  return readFile(path.join(source, relativePath), "utf8");
}

test("shares backend profile state across dashboard routes", async () => {
  const [shell, provider, topbar] = await Promise.all([
    readSource("components/dashboard/DashboardShell.tsx"),
    readSource("features/profile/client/ProfileProvider.tsx"),
    readSource("components/dashboard/DashboardTopbar.tsx"),
  ]);

  assert.match(shell, /ProfileProvider/);
  assert.match(provider, /fetchCurrentProfile/);
  // A 401 is apiFetch's to handle: the provider keeps its loader and stays quiet.
  assert.match(provider, /if \(result\.status === 401\) return;/);
  assert.doesNotMatch(provider, /router\.replace\(SESSION_EXPIRED_PATH\)/);
  assert.match(provider, /createContext/);
  assert.match(provider, /useProfile/);
  assert.match(provider, /if \(isLoading\)/);
  assert.match(provider, /if \(error \|\| !user\)/);
  assert.match(provider, /Memverifikasi sesi/);
  assert.match(provider, /Konten dashboard belum dapat ditampilkan/);
  assert.match(topbar, /useProfile/);
  assert.doesNotMatch(topbar, /Armand Setya/);
});

test("connects account actions to mutation hooks and toast feedback", async () => {
  const [profile, edit, passwordHook, profileHook, logoutHook] =
    await Promise.all([
      readSource("components/dashboard/ProfileView.tsx"),
      readSource("components/dashboard/EditProfileView.tsx"),
      readSource("features/profile/client/hooks/UseUpdatePassword.ts"),
      readSource("features/profile/client/hooks/UseUpdateProfile.ts"),
      readSource("features/profile/client/hooks/UseLogout.ts"),
    ]);

  assert.match(profile, /useProfile/);
  assert.match(profile, /useUpdatePassword/);
  assert.match(profile, /useLogout/);
  assert.match(profile, /toast\.success/);
  assert.match(profile, /router\.replace\("\/login"\)/);
  assert.doesNotMatch(profile, /ProfileStorage|localStorage|simulasi/i);

  assert.match(edit, /useUpdateProfile/);
  assert.match(edit, /UpdateProfileRequestSchema/);
  assert.match(edit, /disabled/);
  assert.match(edit, /Email tidak dapat diubah/);
  assert.doesNotMatch(edit, /ProfileStorage|localStorage|FileReader|type="file"/);

  assert.match(passwordHook, /updatePassword/);
  assert.match(profileHook, /updateProfile/);
  assert.match(profileHook, /updateUser/);
  assert.match(logoutHook, /logoutAccount/);
});
