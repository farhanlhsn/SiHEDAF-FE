import { proxyBackend } from "@/features/auth/session/server/ProxyBackend";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyBackend(`notification/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}
