import { proxyBackend } from "@/features/auth/session/server/ProxyBackend";

export async function POST() {
  return proxyBackend("measurement/stop", { method: "POST" });
}
