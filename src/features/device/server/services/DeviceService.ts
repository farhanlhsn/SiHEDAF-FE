import { z } from "zod";

import { buildBackendApiUrl } from "@/features/auth/shared/server/BackendUrl";

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type DeviceServiceOptions = {
  baseUrl?: string;
  fetcher?: Fetcher;
  signal?: AbortSignal;
};

const BackendMyDeviceResponseSchema = z.object({
  code: z.number(),
  status: z.string(),
  data: z.object({
    id: z.string(),
    deviceNumber: z.string(),
  }).passthrough().nullable(),
});

export async function checkDeviceBound(
  accessToken: string,
  options: DeviceServiceOptions = {},
): Promise<boolean> {
  let url: string;
  try {
    url = buildBackendApiUrl("measurement/my-device", options.baseUrl);
  } catch {
    return false;
  }

  try {
    const response = await (options.fetcher ?? fetch)(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(10_000),
    });

    if (!response.ok) return false;

    const body = await response.json();
    const parsed = BackendMyDeviceResponseSchema.safeParse(body);
    
    if (!parsed.success || parsed.data.code !== 200) return false;

    return parsed.data.data !== null;
  } catch {
    return false;
  }
}
