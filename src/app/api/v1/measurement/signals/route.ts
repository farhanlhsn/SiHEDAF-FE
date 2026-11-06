import { proxyBackend } from "@/features/auth/session/server/ProxyBackend";

export async function GET(request: Request) {
  return proxyBackend("measurement/signals", {
    search: new URL(request.url).search,
  });
}
