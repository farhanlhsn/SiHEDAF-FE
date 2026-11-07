import assert from "node:assert/strict";
import test from "node:test";
import { SessionExpiredError } from "../features/auth/session/client/ApiFetch";
import {
  EMPTY_BASELINE,
  MAX_RECORDING_MS,
  OVERTIME_HINT_AFTER_MS,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  RECORDING_WATCH_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
  TOGGLE_TIMEOUT_MS,
  afterStopRefused,
  afterToggleTimeout,
  analysisStatusLabel,
  formatElapsed,
  isFreshResult,
  isTimeoutError,
  pollForFreshResult,
  recordingClock,
  rememberInitial,
  rememberResult,
  rememberSession,
  requestSignal,
  restartAction,
  runningSessionFrom,
  sessionStartFrom,
  toggleAnswer,
  toggleBlock,
  waitFor,
} from "../components/dashboard/MonitoringSession";

test("polling constants", () => {
  assert.equal(POLL_INTERVAL_MS, 3000);
  assert.equal(POLL_MAX_ATTEMPTS, 20);
});

test("formatElapsed formats MM:SS and H:MM:SS", () => {
  assert.equal(formatElapsed(0), "00:00");
  assert.equal(formatElapsed(59_999), "00:59");
  assert.equal(formatElapsed(252_000), "04:12");
  assert.equal(formatElapsed(3_599_000), "59:59");
  assert.equal(formatElapsed(3_725_000), "1:02:05");
});

test("formatElapsed guards invalid input", () => {
  assert.equal(formatElapsed(-5), "00:00");
  assert.equal(formatElapsed(Number.NaN), "00:00");
  assert.equal(formatElapsed(Number.POSITIVE_INFINITY), "00:00");
});

test("isFreshResult treats every COMPLETED kind as final and pending never", () => {
  const done = { status: "COMPLETED" };
  assert.equal(isFreshResult({ id: 6, ...done, resultClass: 0, resultLabel: "Not Enough Data", confidenceLevel: 0 }, 5), true);
  assert.equal(isFreshResult({ id: 6, ...done, resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0 }, 5), true);
  assert.equal(isFreshResult({ id: 6, ...done, resultClass: 2, resultLabel: "Atrial Flutter", confidenceLevel: 0.8 }, 5), true);
  assert.equal(isFreshResult({ id: 6, status: "IN_PROGRESS", resultClass: 1 }, 5), false);
  assert.equal(isFreshResult({ id: 6, ...done }, 5), false);
});

test("isFreshResult requires a final result that differs from the previous one", () => {
  assert.equal(isFreshResult({ id: 6, resultLabel: "Normal" }, 5), true);
  assert.equal(isFreshResult({ id: 5, resultLabel: "Normal" }, 5), false);
  assert.equal(isFreshResult({ id: 6 }, 5), false);
  assert.equal(isFreshResult(null, 5), false);
  assert.equal(isFreshResult(undefined, null), false);
  assert.equal(isFreshResult({ id: 1, resultLabel: "AF" }, null), true);
  assert.equal(isFreshResult({ resultLabel: "AF" }, 5), true);
});

test("analysisStatusLabel maps API statuses to Indonesian", () => {
  assert.equal(analysisStatusLabel("COMPLETED"), "Selesai");
  assert.equal(analysisStatusLabel("completed"), "Selesai");
  assert.equal(analysisStatusLabel("IN_PROGRESS"), "Sedang berjalan");
  assert.equal(analysisStatusLabel("in_progress"), "Sedang berjalan");
  assert.equal(analysisStatusLabel("WHATEVER"), "—");
  assert.equal(analysisStatusLabel(undefined), "—");
  assert.equal(analysisStatusLabel(null), "—");
});

test("sessionStartFrom reads createdAt of an in-progress session", () => {
  const iso = "2026-11-06T10:00:00Z";
  assert.equal(sessionStartFrom({ status: "IN_PROGRESS", createdAt: iso }), Date.parse(iso));
  assert.equal(sessionStartFrom({ status: "in_progress", createdAt: iso }), Date.parse(iso));
  assert.equal(sessionStartFrom({ status: "COMPLETED", createdAt: iso }), null);
  assert.equal(sessionStartFrom({ status: "IN_PROGRESS", createdAt: "nope" }), null);
  assert.equal(sessionStartFrom({ status: "IN_PROGRESS" }), null);
  assert.equal(sessionStartFrom(null), null);
});

test("isFreshResult ignores a repeat of an id-less result by its timestamp", () => {
  const previousTimestamp = "2026-11-06T10:05:00Z";
  assert.equal(
    isFreshResult(
      { resultLabel: "Normal", completedAt: previousTimestamp },
      5,
      { previousTimestamp },
    ),
    false,
  );
  assert.equal(
    isFreshResult(
      { resultLabel: "Normal", createdAt: previousTimestamp },
      null,
      { previousTimestamp },
    ),
    false,
  );
  assert.equal(
    isFreshResult(
      { resultLabel: "Normal", completedAt: "2026-11-06T10:20:00Z" },
      5,
      { previousTimestamp },
    ),
    true,
  );
});

test("isFreshResult only accepts the resumed session's result while no earlier id is known", () => {
  const session = { sessionId: 42, sessionCreatedAt: "2026-11-06T10:00:00Z" };

  // The resumed row itself, now labelled.
  assert.equal(isFreshResult({ id: 42, resultLabel: "Normal" }, null, session), true);
  // A newer row created after the session started.
  assert.equal(
    isFreshResult({ id: 43, resultLabel: "AF", createdAt: "2026-11-06T10:00:00Z" }, null, session),
    true,
  );
  // An older result from before the session.
  assert.equal(
    isFreshResult({ id: 41, resultLabel: "Normal", createdAt: "2026-11-06T09:00:00Z" }, null, session),
    false,
  );
  // Unknown age and a different id: not this session's result.
  assert.equal(isFreshResult({ id: 41, resultLabel: "Normal" }, null, session), false);
  assert.equal(
    isFreshResult({ id: 41, resultLabel: "Normal", createdAt: "nope" }, null, session),
    false,
  );
  // Only a createdAt is known about the session.
  assert.equal(
    isFreshResult(
      { resultLabel: "Normal", createdAt: "2026-11-06T10:01:00Z" },
      null,
      { sessionCreatedAt: "2026-11-06T10:00:00Z" },
    ),
    true,
  );
  // A known earlier id takes over from the session check.
  assert.equal(isFreshResult({ id: 41, resultLabel: "Normal" }, 40, session), true);
  // Nothing usable about the session: any labelled result counts.
  assert.equal(
    isFreshResult({ id: 41, resultLabel: "Normal" }, null, { sessionCreatedAt: "nope" }),
    true,
  );
});

test("rememberResult tracks the shown result and a resumed session", () => {
  assert.deepEqual(EMPTY_BASELINE, {
    previousResultId: null,
    previousTimestamp: null,
    sessionId: null,
    sessionCreatedAt: null,
  });

  const resumed = rememberResult(EMPTY_BASELINE, {
    id: 42,
    status: "IN_PROGRESS",
    createdAt: "2026-11-06T10:00:00Z",
  });
  assert.deepEqual(resumed, {
    previousResultId: null,
    previousTimestamp: null,
    sessionId: 42,
    sessionCreatedAt: "2026-11-06T10:00:00Z",
  });

  // A final result with an id becomes the new baseline and ends the session check.
  assert.deepEqual(rememberResult(resumed, { id: 42, resultLabel: "Normal" }), {
    previousResultId: 42,
    previousTimestamp: null,
    sessionId: null,
    sessionCreatedAt: null,
  });

  // Without an id, its timestamp is remembered and the earlier id is kept.
  const idless = rememberResult(
    { ...EMPTY_BASELINE, previousResultId: 7 },
    { resultLabel: "AF", completedAt: "2026-11-06T10:05:00Z", createdAt: "2026-11-06T10:00:00Z" },
  );
  assert.deepEqual(idless, {
    previousResultId: 7,
    previousTimestamp: "2026-11-06T10:05:00Z",
    sessionId: null,
    sessionCreatedAt: null,
  });
  assert.equal(
    isFreshResult(
      { resultLabel: "AF", completedAt: "2026-11-06T10:05:00Z" },
      idless.previousResultId,
      idless,
    ),
    false,
  );

  // A COMPLETED row with no result at all (pending) changes nothing.
  assert.equal(rememberResult(idless, { id: 9, status: "COMPLETED" }), idless);
});

test("short, unavailable and flutter rows become the baseline, so an old one is not fresh after Stop", () => {
  const done = { status: "COMPLETED" };
  const rows = [
    { id: 30, ...done, resultClass: 0, resultLabel: "Not Enough Data", confidenceLevel: 0 },
    { id: 31, ...done, resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0 },
    { id: 32, ...done, resultClass: 2, resultLabel: "Atrial Flutter", confidenceLevel: 0.8 },
  ];

  for (const row of rows) {
    const baseline = rememberResult(EMPTY_BASELINE, row);
    assert.deepEqual(baseline, { ...EMPTY_BASELINE, previousResultId: row.id });
    // The same row polled again after Stop is not the new session's result…
    assert.equal(isFreshResult(row, baseline.previousResultId, baseline), false);
    // …the next one is.
    assert.equal(isFreshResult({ ...row, id: row.id + 100 }, baseline.previousResultId, baseline), true);
    // The first /latest teaches the same baseline.
    assert.deepEqual(rememberInitial(EMPTY_BASELINE, row), baseline);
  }

  // Without an id, the timestamp of a short row is remembered instead.
  const idless = { ...done, resultClass: 0, resultLabel: "Not Enough Data", confidenceLevel: 0, completedAt: "2026-11-07T03:00:05Z" };
  const remembered = rememberResult(EMPTY_BASELINE, idless);
  assert.equal(remembered.previousTimestamp, "2026-11-07T03:00:05Z");
  assert.equal(isFreshResult(idless, remembered.previousResultId, remembered), false);
});

test("restartAction offers a restart only once no session is running", () => {
  const ready = { device: "online", busy: false } as const;
  assert.equal(restartAction("idle", ready), "ready");
  assert.equal(restartAction("result", ready), "ready");
  assert.equal(restartAction("timeout", ready), "ready");
  assert.equal(restartAction("recording", ready), "hidden");
  assert.equal(restartAction("analysing", ready), "hidden");
  assert.equal(restartAction("result", { device: "online", busy: true }), "busy");
  assert.equal(restartAction("result", { device: "offline", busy: false }), "offline");
  assert.equal(restartAction("result", { device: "offline", busy: true }), "offline");
  assert.equal(restartAction("recording", { device: "offline", busy: true }), "hidden");
});

test("restartAction reports a missing network before device checks", () => {
  const base = { device: "online", busy: false, networkOnline: false } as const;
  assert.equal(restartAction("idle", base), "no-network");
  assert.equal(restartAction("result", { ...base, device: "offline" }), "no-network");
  assert.equal(restartAction("result", { ...base, device: "error" }), "no-network");
  assert.equal(restartAction("recording", base), "hidden");
  assert.equal(restartAction("analysing", base), "hidden");
  assert.equal(
    restartAction("idle", { device: "online", busy: false, networkOnline: true }),
    "ready",
  );
});

test("restartAction never claims the device is offline when its state is unknown", () => {
  assert.equal(restartAction("result", { device: "error", busy: false }), "device-unknown");
  assert.equal(restartAction("timeout", { device: "error", busy: false }), "device-unknown");
  assert.equal(restartAction("idle", { device: "error", busy: true }), "device-unknown");
  assert.equal(restartAction("recording", { device: "error", busy: false }), "hidden");
  assert.equal(restartAction("analysing", { device: "error", busy: false }), "hidden");
});

test("restartAction treats no bound device like an offline one", () => {
  assert.equal(restartAction("result", { device: "none", busy: false }), "offline");
  assert.equal(restartAction("idle", { device: "none", busy: true }), "offline");
});

test("restartAction lets a stale wristband try again: the backend decides", () => {
  assert.equal(restartAction("result", { device: "stale", busy: false }), "ready");
  assert.equal(restartAction("timeout", { device: "stale", busy: true }), "busy");
  assert.equal(restartAction("idle", { device: "stale", busy: false, networkOnline: false }), "no-network");
  assert.equal(restartAction("recording", { device: "stale", busy: false }), "hidden");
});

test("toggleBlock says why Mulai/Hentikan Monitoring is unavailable", () => {
  assert.equal(toggleBlock("idle", { device: "online", networkOnline: true }), null);
  assert.equal(toggleBlock("recording", { device: "online", networkOnline: true }), null);
  // No internet blocks both starting and stopping, as before.
  assert.equal(toggleBlock("idle", { device: "online", networkOnline: false }), "no-network");
  assert.equal(toggleBlock("recording", { device: "error", networkOnline: false }), "no-network");
  // An unknown device state blocks starting, not stopping a running session.
  assert.equal(toggleBlock("idle", { device: "error", networkOnline: true }), "device-unknown");
  assert.equal(toggleBlock("result", { device: "error", networkOnline: true }), "device-unknown");
  assert.equal(toggleBlock("timeout", { device: "error", networkOnline: true }), "device-unknown");
  assert.equal(toggleBlock("recording", { device: "error", networkOnline: true }), null);
  // Loading, offline or no device: starting is unavailable (explained by the device card).
  for (const device of ["loading", "offline", "none"] as const) {
    assert.equal(toggleBlock("idle", { device, networkOnline: true }), "device-unavailable");
  }
});

test("toggleBlock never blocks Stop for the wristband's sake: the backend's stop does not check it", () => {
  for (const device of ["online", "stale", "offline", "none", "loading", "error"] as const) {
    assert.equal(toggleBlock("recording", { device, networkOnline: true }), null, `Stop blocked for ${device}`);
    assert.equal(toggleBlock("recording", { device, networkOnline: false }), "no-network");
  }
});

test("toggleBlock lets a stale wristband start; a refusal comes back from the backend", () => {
  assert.equal(toggleBlock("idle", { device: "stale", networkOnline: true }), null);
  assert.equal(toggleBlock("result", { device: "stale", networkOnline: true }), null);
  assert.equal(toggleBlock("timeout", { device: "stale", networkOnline: true }), null);
  assert.equal(toggleBlock("idle", { device: "stale", networkOnline: false }), "no-network");
});

function fakeClock() {
  const log: string[] = [];
  return {
    log,
    wait: async (ms: number) => {
      log.push(`wait ${ms}`);
    },
  };
}

test("pollForFreshResult fetches at once, then waits between attempts", async () => {
  const { log, wait } = fakeClock();
  const responses = [null, { id: 1 }, { id: 2 }];
  const outcome = await pollForFreshResult({
    fetchLatest: async () => {
      log.push("fetch");
      return responses.shift() ?? null;
    },
    isFresh: (data: { id: number }) => data.id === 2,
    wait,
    isCancelled: () => false,
    maxAttempts: 5,
    intervalMs: 3000,
  });

  assert.deepEqual(outcome, { kind: "fresh", data: { id: 2 } });
  assert.deepEqual(log, ["fetch", "wait 3000", "fetch", "wait 3000", "fetch"]);
});

test("pollForFreshResult times out after maxAttempts and counts failures as attempts", async () => {
  const { log, wait } = fakeClock();
  let calls = 0;
  const outcome = await pollForFreshResult({
    fetchLatest: async () => {
      calls += 1;
      log.push("fetch");
      if (calls % 2 === 1) throw new Error("network down");
      return null; // non-200
    },
    isFresh: () => true,
    wait,
    isCancelled: () => false,
    maxAttempts: 4,
    intervalMs: 10,
  });

  assert.deepEqual(outcome, { kind: "timeout" });
  assert.equal(calls, 4);
  assert.deepEqual(log, ["fetch", "wait 10", "fetch", "wait 10", "fetch", "wait 10", "fetch"]);
});

test("pollForFreshResult never accepts a stale response", async () => {
  const outcome = await pollForFreshResult({
    fetchLatest: async () => ({ id: 5 }),
    isFresh: () => false,
    wait: async () => {},
    isCancelled: () => false,
    maxAttempts: 3,
    intervalMs: 1,
  });

  assert.deepEqual(outcome, { kind: "timeout" });
});

test("pollForFreshResult stops without further fetches once cancelled", async () => {
  let cancelled = false;
  let calls = 0;
  const outcome = await pollForFreshResult({
    fetchLatest: async () => {
      calls += 1;
      return null;
    },
    isFresh: () => true,
    wait: async () => {
      if (calls === 2) cancelled = true;
    },
    isCancelled: () => cancelled,
    maxAttempts: 10,
    intervalMs: 1,
  });

  assert.deepEqual(outcome, { kind: "cancelled" });
  assert.equal(calls, 2);
});

test("pollForFreshResult drops a fresh response that arrives after cancelling", async () => {
  let cancelled = false;
  const outcome = await pollForFreshResult({
    fetchLatest: async () => {
      cancelled = true;
      return { id: 9 };
    },
    isFresh: () => true,
    wait: async () => {},
    isCancelled: () => cancelled,
    maxAttempts: 3,
    intervalMs: 1,
  });

  assert.deepEqual(outcome, { kind: "cancelled" });
});

test("requestSignal times out and follows the caller's signal", async () => {
  assert.equal(REQUEST_TIMEOUT_MS, 10_000);

  const timed = requestSignal(undefined, 5);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(timed.aborted, true);

  const lifetime = new AbortController();
  const signal = requestSignal(lifetime.signal);
  assert.equal(signal.aborted, false);
  lifetime.abort();
  assert.equal(signal.aborted, true);
});

test("waitFor resolves after the delay, or at once when aborted", async () => {
  const startedAt = Date.now();
  await waitFor(20, new AbortController().signal);
  assert.ok(Date.now() - startedAt >= 15);

  const controller = new AbortController();
  const pending = waitFor(60_000, controller.signal);
  controller.abort();
  await pending;

  const aborted = new AbortController();
  aborted.abort();
  await waitFor(60_000, aborted.signal);
});

test("rememberInitial fills only a baseline that knows nothing yet", () => {
  const latest = { id: 7, resultLabel: "Normal", status: "COMPLETED" };
  assert.deepEqual(rememberInitial(EMPTY_BASELINE, latest), {
    ...EMPTY_BASELINE,
    previousResultId: 7,
  });
  // An equal-by-value empty baseline counts as empty too.
  assert.equal(rememberInitial({ ...EMPTY_BASELINE }, latest).previousResultId, 7);

  // A fresh result was already remembered: a slow first /latest must not undo it.
  const known = { ...EMPTY_BASELINE, previousResultId: 9 };
  assert.equal(rememberInitial(known, latest), known);
  const resumed = { ...EMPTY_BASELINE, sessionId: 12, sessionCreatedAt: "2026-11-06T10:00:00Z" };
  assert.equal(rememberInitial(resumed, latest), resumed);
});

test("restartAction treats a device still loading as busy, not offline", () => {
  assert.equal(restartAction("result", { device: "loading", busy: false }), "busy");
  assert.equal(restartAction("idle", { device: "offline", busy: false }), "offline");
  assert.equal(restartAction("recording", { device: "loading", busy: false }), "hidden");
});

test("afterToggleTimeout adopts the state that /latest reports", () => {
  const running = { status: "IN_PROGRESS", createdAt: "2026-11-06T10:00:00Z" };
  const processing = { status: "PROCESSING" };
  const done = { status: "COMPLETED", resultLabel: "Normal" };

  assert.deepEqual(afterToggleTimeout("start", running), { phase: "recording", tookEffect: true });
  assert.deepEqual(afterToggleTimeout("start", done), { phase: "idle", tookEffect: false });
  assert.deepEqual(afterToggleTimeout("start", null), { phase: "idle", tookEffect: false });
  assert.deepEqual(afterToggleTimeout("stop", running), { phase: "recording", tookEffect: false });
  assert.deepEqual(afterToggleTimeout("stop", processing), { phase: "analysing", tookEffect: true });
  assert.deepEqual(afterToggleTimeout("stop", done), { phase: "analysing", tookEffect: true });
  assert.deepEqual(afterToggleTimeout("stop", null), { phase: "analysing", tookEffect: true });
});

test("afterToggleTimeout adopts a session the history reports after a start timed out", () => {
  // The real /latest only returns COMPLETED rows: the newest history row tells a started session.
  const running = { id: 77, createdAt: "2026-11-07T03:00:00Z", startedAt: Date.parse("2026-11-07T03:00:00Z") };
  const done = { status: "COMPLETED", resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0.9 };

  assert.deepEqual(afterToggleTimeout("start", done, running), { phase: "recording", tookEffect: true });
  assert.deepEqual(afterToggleTimeout("start", null, running), { phase: "recording", tookEffect: true });
  assert.deepEqual(afterToggleTimeout("start", done, null), { phase: "idle", tookEffect: false });
  assert.deepEqual(afterToggleTimeout("start", null, null), { phase: "idle", tookEffect: false });
  // The old /latest IN_PROGRESS path still works without a history answer.
  assert.deepEqual(
    afterToggleTimeout("start", { status: "IN_PROGRESS" }, null),
    { phase: "recording", tookEffect: true },
  );
  // A stop never reads the history: the analysing poll decides.
  assert.deepEqual(afterToggleTimeout("stop", done, running), { phase: "analysing", tookEffect: true });
});

test("start and stop wait longer than polls; timeouts are told apart from failures", () => {
  assert.equal(TOGGLE_TIMEOUT_MS, 30_000);
  assert.ok(TOGGLE_TIMEOUT_MS > REQUEST_TIMEOUT_MS);
  assert.equal(isTimeoutError(new DOMException("timed out", "TimeoutError")), true);
  assert.equal(isTimeoutError(new DOMException("aborted", "AbortError")), true);
  assert.equal(isTimeoutError(new TypeError("Failed to fetch")), false);
  assert.equal(isTimeoutError(new SyntaxError("Unexpected token")), false);
  assert.equal(isTimeoutError(undefined), false);
});

test("pollForFreshResult stops on an expired session instead of retrying", async () => {
  const { log, wait } = fakeClock();
  let fetches = 0;
  const outcome = await pollForFreshResult({
    fetchLatest: async () => {
      fetches += 1;
      throw new SessionExpiredError();
    },
    isFresh: () => true,
    wait,
    isCancelled: () => false,
    maxAttempts: 5,
    intervalMs: 3000,
  });

  assert.deepEqual(outcome, { kind: "cancelled" });
  assert.equal(fetches, 1);
  assert.deepEqual(log, []);
});

test("a recording lasts at most 3 minutes and is watched every 5 s", () => {
  assert.equal(MAX_RECORDING_MS, 180_000);
  assert.equal(RECORDING_WATCH_INTERVAL_MS, 5000);
});

test("recordingClock counts up to 03:00, then reports overtime", () => {
  assert.deepEqual(recordingClock(0), { overtime: false, elapsed: "00:00", limit: "03:00", text: "00:00 / 03:00" });
  assert.deepEqual(recordingClock(72_000), { overtime: false, elapsed: "01:12", limit: "03:00", text: "01:12 / 03:00" });
  assert.deepEqual(recordingClock(179_999), { overtime: false, elapsed: "02:59", limit: "03:00", text: "02:59 / 03:00" });
  assert.deepEqual(recordingClock(180_000), { overtime: true, stalled: false });
  assert.deepEqual(recordingClock(3_600_000), { overtime: true, stalled: true });
});

test("recordingClock asks for Stop once overtime has lasted more than 30 s", () => {
  assert.equal(OVERTIME_HINT_AFTER_MS, 30_000);
  assert.deepEqual(recordingClock(MAX_RECORDING_MS + 29_999), { overtime: true, stalled: false });
  assert.deepEqual(recordingClock(MAX_RECORDING_MS + 30_000), { overtime: true, stalled: false });
  assert.deepEqual(recordingClock(MAX_RECORDING_MS + 30_001), { overtime: true, stalled: true });
});

test("recordingClock never shows a negative or broken time", () => {
  // A server clock ahead of the reader's gives a negative elapsed time on resume.
  assert.deepEqual(recordingClock(-4000), { overtime: false, elapsed: "00:00", limit: "03:00", text: "00:00 / 03:00" });
  assert.deepEqual(recordingClock(Number.NaN), { overtime: false, elapsed: "00:00", limit: "03:00", text: "00:00 / 03:00" });
});

test("toggleAnswer tells done, refused by the backend and failed on the way apart", () => {
  assert.equal(toggleAnswer(200, 200), "ok");
  // The backend refuses: no device, wristband offline or not seen for 30 s, a session already running, nothing to stop.
  assert.equal(toggleAnswer(400, 400), "refused");
  assert.equal(toggleAnswer(400, "BAD_REQUEST"), "refused");
  assert.equal(toggleAnswer(404, 404), "refused");
  assert.equal(toggleAnswer(200, 400), "refused");
  assert.equal(toggleAnswer(200, undefined), "refused");
  // The server or the way to it failed: not a statement about the wristband.
  assert.equal(toggleAnswer(500, undefined), "failed");
  assert.equal(toggleAnswer(502, 502), "failed");
  assert.equal(toggleAnswer(504, 504), "failed");
});

test("afterStopRefused shows a result the wristband finished by itself, else goes idle", () => {
  const fresh = { id: 9, status: "COMPLETED", resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0.9 };
  const old = { id: 5, status: "COMPLETED", resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0.9 };
  const isFresh = (data: { id: number }) => data.id !== 5;

  assert.deepEqual(afterStopRefused(fresh, isFresh), { kind: "result", data: fresh });
  assert.deepEqual(afterStopRefused(old, isFresh), { kind: "idle" });
  assert.deepEqual(afterStopRefused(null, isFresh), { kind: "idle" });
  assert.deepEqual(afterStopRefused(undefined, isFresh), { kind: "idle" });
});

function history(items: unknown[], code: unknown = 200) {
  return {
    code,
    status: "OK",
    data: { summary: {}, metadata: { totalFiltered: items.length, currentPage: 1, totalPages: 1, limit: 1 }, data: items },
  };
}

test("runningSessionFrom resumes the newest history row only while it is IN_PROGRESS", () => {
  const requestedAt = "2026-11-07T03:00:00.000Z";
  const createdAt = "2026-11-07T03:00:00.500Z";

  assert.deepEqual(
    runningSessionFrom(history([{ id: 510, status: "IN_PROGRESS", requestedAt, createdAt }])),
    { id: 510, createdAt, startedAt: Date.parse(requestedAt) },
  );
  assert.deepEqual(
    runningSessionFrom(history([{ id: 510, status: "in_progress", createdAt }])),
    { id: 510, createdAt, startedAt: Date.parse(createdAt) },
    "without requestedAt the start is createdAt",
  );
  // Running but its start is unknown: still resumed; the hook counts from now.
  assert.deepEqual(
    runningSessionFrom(history([{ id: 510, status: "IN_PROGRESS", requestedAt: "nope" }])),
    { id: 510, createdAt: null, startedAt: null },
  );
  assert.deepEqual(
    runningSessionFrom(history([{ status: "IN_PROGRESS", requestedAt }])),
    { id: null, createdAt: null, startedAt: Date.parse(requestedAt) },
  );

  // Nothing running.
  for (const status of ["COMPLETED", "FAILED", "PENDING", "EXPIRED", undefined]) {
    assert.equal(runningSessionFrom(history([{ id: 510, status, requestedAt }])), null, String(status));
  }
  assert.equal(runningSessionFrom(history([])), null);
  // Only the first (newest) row counts.
  assert.equal(
    runningSessionFrom(history([{ id: 511, status: "COMPLETED" }, { id: 510, status: "IN_PROGRESS", requestedAt }])),
    null,
  );
});

test("runningSessionFrom ignores answers that are not a history page", () => {
  const row = { id: 510, status: "IN_PROGRESS", requestedAt: "2026-11-07T03:00:00Z" };
  assert.equal(runningSessionFrom(history([row], 400)), null);
  assert.equal(runningSessionFrom({ ...history([row]), code: undefined }), null);
  assert.equal(runningSessionFrom({ code: 200, data: null }), null);
  assert.equal(runningSessionFrom({ code: 200, data: { data: "nope" } }), null);
  assert.equal(runningSessionFrom({ code: 200, data: { data: [null] } }), null);
  assert.equal(runningSessionFrom(null), null);
  assert.equal(runningSessionFrom("nope"), null);
});

test("rememberSession lets the resumed session's own result count as fresh", () => {
  const session = { id: 510, createdAt: "2026-11-07T03:00:00Z", startedAt: Date.parse("2026-11-07T03:00:00Z") };

  // Resumed before the first /latest arrived: only this session's result is fresh.
  const resumed = rememberSession(EMPTY_BASELINE, session);
  assert.deepEqual(resumed, { ...EMPTY_BASELINE, sessionId: 510, sessionCreatedAt: "2026-11-07T03:00:00Z" });
  const earlier = { id: 499, status: "COMPLETED", resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0.9, createdAt: "2026-11-07T01:00:00Z" };
  const own = { id: 510, status: "COMPLETED", resultClass: 1, resultLabel: "AFIB", confidenceLevel: 0.9, createdAt: "2026-11-07T03:00:00Z" };
  assert.equal(isFreshResult(earlier, resumed.previousResultId, resumed), false);
  assert.equal(isFreshResult(own, resumed.previousResultId, resumed), true);
  // A slow first /latest does not undo the resumed session.
  assert.equal(rememberInitial(resumed, earlier), resumed);

  // Resumed after the first /latest: the earlier id is kept.
  const known = rememberSession({ ...EMPTY_BASELINE, previousResultId: 499 }, session);
  assert.equal(known.previousResultId, 499);
  assert.equal(isFreshResult(earlier, known.previousResultId, known), false);
  assert.equal(isFreshResult(own, known.previousResultId, known), true);
});
