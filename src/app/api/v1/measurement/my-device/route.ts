import { proxyBackend } from "@/features/auth/session/server/ProxyBackend";

export async function GET() {
  return proxyBackend("measurement/my-device");
}
