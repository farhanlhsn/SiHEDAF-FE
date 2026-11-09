// Tiny mock of the SiHEDAF backend with synthetic data for the Playwright smoke tests.
// Base /api/v1; port from MOCK_BACKEND_PORT (default 4010). GET /api/v1/__mode switches states.
import http from "node:http";

const PORT = Number(process.env.MOCK_BACKEND_PORT ?? 4010);
const DEVICE_ID = "11111111-2222-4333-8444-555555555555";
const USER = { id: 1, fullname: "Pengguna Demo", email: "demo@example.com", profileImage: null };

// Deterministic PRNG so every start produces identical data.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Clean synthetic PPG at 50 Hz: systolic peak + dicrotic notch. `irregular`
// jitters beat intervals (AF-like) or adds a fast flutter wave.
function ppg(samples, { bpm = 72, irregular = false, flutter = false, seed = 1 } = {}) {
  const rand = rng(seed);
  const out = [];
  let period = (60 / bpm) * 50;
  let i = 0;
  while (i < samples) {
    const len = Math.max(20, Math.round(irregular ? period * (0.55 + rand() * 0.95) : period));
    for (let k = 0; k < len && i < samples; k++, i++) {
      const t = k / len;
      const systolic = Math.exp(-Math.pow((t - 0.22) / 0.09, 2));
      const dicrotic = 0.35 * Math.exp(-Math.pow((t - 0.5) / 0.1, 2));
      const amp = irregular ? 0.7 + rand() * 0.5 : 1;
      let v = 20000 + 9000 * amp * (systolic + dicrotic) + 800 * Math.sin(i / 40);
      if (flutter) v += 1500 * Math.sin(i * 0.9);
      out.push(Math.round(v + (rand() - 0.5) * 120));
    }
  }
  return out;
}

const WIB_MS = 7 * 3600 * 1000;
// 9 Nov 2026 16:46 WIB
const NEWEST = Date.UTC(2026, 10, 9, 16, 46) - WIB_MS;
const AF_IDX = new Set([2, 11, 19]);
const AFL_IDX = new Set([8]);
const COUNT = 25;

const history = Array.from({ length: COUNT }, (_, i) => {
  // 16:46 is when the recording started; the AI result lands 3 minutes later.
  const requested = new Date(NEWEST - i * 8 * 3600 * 1000);
  const completed = new Date(requested.getTime() + 3 * 60 * 1000);
  const af = AF_IDX.has(i);
  const afl = AFL_IDX.has(i);
  const resultClass = af ? 1 : afl ? 2 : 0;
  const conf = af ? [0.942, 0.874, 0.936][[...AF_IDX].indexOf(i)] : afl ? 0.881 : (i < 2 ? 0.967 : 0.94 + ((i * 7) % 5) / 100);
  return {
    id: 100 - i,
    status: "COMPLETED",
    resultLabel: af ? "Atrial Fibrillation (AF)" : afl ? "Atrial Flutter (AFL)" : "Normal (N)",
    resultClass,
    confidenceLevel: Number(conf.toFixed(3)),
    requestedAt: requested.toISOString(),
    completedAt: completed.toISOString(),
    createdAt: requested.toISOString(),
    updatedAt: completed.toISOString(),
    deviceId: DEVICE_ID,
    device: { deviceNumber: "DEMO-001" },
    ppgResult: {
      rawPpgData: ppg(af || afl ? 9000 : 1500, { bpm: 68 + (i % 9), irregular: af, flutter: afl, seed: 10 + i }),
    },
  };
});

const latestRow = {
  ...history[0],
  ppgResult: { rawPpgData: ppg(7500, { bpm: 72, seed: 5 }) },
};

// --- controllable states for design captures: GET /__mode?latest=&device=&notif=&fresh=&slow= ---
const mode = { latest: "normal", device: "online", notif: "ok", fresh: "normal", hist: "ok", stopped: false, slowStop: false };
function freshRow(kind) {
  const af = kind === "af";
  const now = new Date();
  if (kind === "short" || kind === "unavailable") {
    return {
      ...history[0],
      id: 9002,
      resultLabel: kind === "short" ? "Not Enough Data" : "Normal (N)",
      resultClass: 0,
      confidenceLevel: 0,
      requestedAt: new Date(now.getTime() - 40 * 1000).toISOString(),
      completedAt: now.toISOString(),
      createdAt: new Date(now.getTime() - 40 * 1000).toISOString(),
      updatedAt: now.toISOString(),
      ppgResult: { rawPpgData: ppg(kind === "short" ? 100 : 1200, { bpm: 72, seed: 7 }) },
    };
  }
  return {
    ...history[af ? 2 : 0],
    id: 9001,
    requestedAt: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
    completedAt: now.toISOString(),
    createdAt: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    confidenceLevel: af ? 0.913 : 0.968,
    ppgResult: { rawPpgData: ppg(9000, { bpm: af ? 74 : 72, irregular: af, seed: af ? 21 : 5 }) },
  };
}

const summary = {
  totalData: COUNT,
  totalAfib: AF_IDX.size,
  totalNormal: COUNT - AF_IDX.size - AFL_IDX.size,
};

const notifications = [
  [6, "AF_DETECTED", "Medical Alert!", "Terdeteksi potensi Atrial Fibrillation pada rekaman terakhir. Konsultasikan dengan dokter.", history[2].completedAt, false],
  [5, "SYSTEM_INFO", "Pengukuran Selesai", "Pengukuran selesai dan hasil analisis sudah tersedia.", history[0].completedAt, false],
  [4, "SYSTEM_INFO", "Pengukuran Selesai", "Pengukuran selesai dan hasil analisis sudah tersedia.", history[1].completedAt, true],
  [3, "SYSTEM_INFO", "Pengukuran Selesai", "Pengukuran selesai dan hasil analisis sudah tersedia.", history[2].completedAt, true],
  [2, "AF_DETECTED", "Medical Alert!", "Terdeteksi potensi Atrial Flutter pada rekaman terakhir. Konsultasikan dengan dokter.", history[8].completedAt, true],
  [1, "SYSTEM_INFO", "Pengukuran Selesai", "Pengukuran selesai dan hasil analisis sudah tersedia.", history[3].completedAt, true],
].map(([id, type, title, message, createdAt, isRead]) => ({ id, userId: 1, title, message, type, isRead, createdAt }));
// newest first
notifications.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

const envelope = (data, extra = {}) => ({
  code: 200,
  status: "success",
  recordsTotal: Array.isArray(data) ? data.length : 1,
  data,
  errors: null,
  ...extra,
});

function utcDay(iso) {
  return iso.slice(0, 10);
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => resolve(b));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname.replace(/^\/api\/v1\//, "").replace(/\/+$/, "");
  const q = url.searchParams;
  await readBody(req);

  if (path === "__mode") {
    if (q.get("reset") !== null) Object.assign(mode, { latest: "normal", device: "online", notif: "ok", fresh: "normal", hist: "ok", stopped: false, slowStop: false });
    for (const [k, v] of q.entries()) if (k in mode) mode[k] = v === "true" ? true : v === "false" ? false : v;
    return send(res, 200, { ok: true, mode });
  }

  // Auth endpoints that need no token.
  if (req.method === "POST" && path === "auth/login") {
    return send(res, 200, envelope({ access_token: "mock-access-token", refresh_token: "mock-refresh-token" }));
  }
  if (req.method === "POST" && path === "auth/refresh-token") {
    return send(res, 200, envelope({ access_token: "mock-access-token" }));
  }
  if (req.method === "POST" && path === "auth/register") {
    return send(res, 200, envelope({ message: "Registrasi berhasil." }));
  }

  // Reset-password verify answers a 302 to the FE reset route, like the real backend.
  if (req.method === "GET" && path.startsWith("auth/verify-reset-password/")) {
    const token = path.slice("auth/verify-reset-password/".length);
    res.writeHead(302, { Location: `/reset-password?token=${token}` });
    return res.end();
  }

  // Everything else needs the bearer token.
  if (req.headers.authorization !== "Bearer mock-access-token") {
    return send(res, 403, { code: 403, status: "error", message: "Invalid Token" });
  }

  if (req.method === "GET" && path === "auth/me") return send(res, 200, envelope({ user: USER }));
  if (path === "auth/me/update") return send(res, 200, envelope({ message: "ok" }));
  if (path === "auth/me/update-password") return send(res, 200, envelope({ message: "ok" }));

  if (req.method === "GET" && path === "measurement/my-device") {
    if (mode.device === "none") return send(res, 200, envelope(null));
    if (mode.device === "error") return send(res, 500, { code: 500, status: "error", message: "boom" });
    const now = new Date().toISOString();
    if (mode.device === "stale") {
      const recent = new Date(Date.now() - 50 * 1000).toISOString();
      return send(res, 200, envelope({ id: DEVICE_ID, deviceNumber: "DEMO-001", status: "ONLINE", battery: 87, batteryLevel: 87, lastSeen: recent, updatedAt: recent, createdAt: "2026-10-01T03:00:00.000Z" }));
    }
    if (mode.device === "offline") {
      const old = new Date(Date.now() - 42 * 60 * 1000).toISOString();
      return send(res, 200, envelope({ id: DEVICE_ID, deviceNumber: "DEMO-001", status: "OFFLINE", battery: 87, batteryLevel: 87, lastSeen: old, updatedAt: old, createdAt: "2026-10-01T03:00:00.000Z" }));
    }
    return send(
      res,
      200,
      envelope({
        id: DEVICE_ID,
        deviceNumber: "DEMO-001",
        status: "ONLINE",
        battery: 87,
        batteryLevel: 87,
        lastSeen: now,
        updatedAt: now,
        createdAt: "2026-10-01T03:00:00.000Z",
      }),
    );
  }

  if (req.method === "POST" && path === "measurement/bind") {
    return send(res, 200, envelope({ message: "Perangkat berhasil terhubung." }));
  }
  if (req.method === "POST" && (path === "measurement/start" || path === "measurement/stop")) {
    if (path === "measurement/stop") mode.stopped = true;
    if (path === "measurement/start") mode.stopped = false;
    return send(res, 200, envelope({ message: "ok" }));
  }

  if (req.method === "GET" && path === "measurement/latest") {
    if (mode.latest === "error") return send(res, 500, { code: 500, status: "error", message: "boom" });
    if (mode.latest === "null") return send(res, 200, envelope(null));
    if (mode.stopped && mode.fresh !== "stale") return send(res, 200, envelope(freshRow(mode.fresh)));
    if (mode.latest === "af") return send(res, 200, envelope(freshRow("af")));
    return send(res, 200, envelope(latestRow));
  }

  if (req.method === "GET" && path === "measurement/signals") {
    const minutes = Math.max(1, Number(q.get("minutes")) || 12);
    // Concatenate recent completed sessions inside the window (3-minute recordings).
    // Sparse enough that the chart draws readable beats (about 30 peaks).
    const data = ppg(Math.min(700, 120 + minutes * 40), { bpm: 120, seed: 5 });
    return send(res, 200, envelope({ rawPpgData: data }));
  }

  if (req.method === "GET" && path === "measurement/history") {
    if (mode.hist === "error") return send(res, 500, { code: 500, status: "error", message: "boom" });
    const page = Math.max(1, Number(q.get("page")) || 1);
    const limit = Math.max(1, Number(q.get("limit")) || 10);
    const start = q.get("startDate");
    const end = q.get("endDate");
    const rows = history.filter((r) => {
      const d = utcDay(r.completedAt);
      return (!start || d >= start) && (!end || d <= end);
    });
    const totalPages = Math.max(1, Math.ceil(rows.length / limit));
    const slice = rows.slice((page - 1) * limit, page * limit);
    return send(
      res,
      200,
      envelope({
        data: slice,
        metadata: { page, limit, totalData: rows.length, totalPages },
        summary,
      }),
    );
  }

  if (req.method === "GET" && path === "notification") {
    if (mode.notif === "error") return send(res, 500, { code: 500, status: "error", message: "boom" });
    if (mode.notif === "empty") return send(res, 200, envelope([]));
    return send(res, 200, envelope(notifications));
  }
  if (path.startsWith("notification/")) {
    return send(res, 200, envelope({ message: "ok" }));
  }

  send(res, 404, { code: 404, status: "error", message: `No mock for ${path}` });
});

server.listen(PORT, () => console.log(`mock backend on :${PORT}`));
