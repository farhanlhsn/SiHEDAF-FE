import { proxyBackend } from "@/features/auth/session/server/ProxyBackend";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Only numeric ids reach the backend.
  if (!/^\d+$/.test(id)) {
    return Response.json(
      { code: 400, message: "Notifikasi tidak ditemukan." },
      { status: 400 },
    );
  }
  return proxyBackend(`notification/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}
