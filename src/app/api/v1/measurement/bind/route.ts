import { proxyBackend } from "@/features/auth/session/server/ProxyBackend";
import {
  DEVICE_ALREADY_BOUND,
  DEVICE_NOT_FOUND,
  DEVICE_SERVICE_UNAVAILABLE,
} from "@/features/device/server/DeviceServiceError";
import { BindDeviceRequestSchema } from "@/features/device/shared/DeviceSchema";
import type { BindDeviceResponse } from "@/features/device/shared/DeviceTypes";

function json(body: BindDeviceResponse, status: number) {
  return Response.json(body, { status });
}

function backendMessage(body: unknown) {
  const errors = (body as { errors?: { message?: unknown } } | null)?.errors;
  return typeof errors?.message === "string" ? errors.message : null;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json(
      { success: false, message: "Format permintaan tidak valid." },
      400,
    );
  }

  const parsed = BindDeviceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        success: false,
        message: "Periksa kembali ID perangkat.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      422,
    );
  }

  const response = await proxyBackend("measurement/bind", {
    method: "POST",
    body: JSON.stringify(parsed.data),
    contentType: "application/json",
  });
  const result = (await response.json()) as {
    code?: unknown;
    message?: unknown;
    data?: { message?: unknown };
  };

  // Session failures keep the proxy's `{ code, message }` shape.
  if (response.status === 401) {
    return json({ success: false, message: String(result.message) }, 401);
  }

  if (response.ok) {
    const message = result.data?.message;
    if (result.code === 200 && typeof message === "string" && message) {
      return json({ success: true, message }, 200);
    }
    return json({ success: false, message: DEVICE_SERVICE_UNAVAILABLE }, 502);
  }

  const detail = backendMessage(result);
  if (response.status === 400 || response.status === 404) {
    return json({ success: false, message: detail ?? DEVICE_NOT_FOUND }, 400);
  }
  if (response.status === 409) {
    return json({ success: false, message: detail ?? DEVICE_ALREADY_BOUND }, 409);
  }
  return json({ success: false, message: DEVICE_SERVICE_UNAVAILABLE }, 502);
}
