import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_BASELINE,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  REQUEST_TIMEOUT_MS,
  analysisStatusLabel,
  formatElapsed,
  isFreshResult,
  pollForFreshResult,
  rememberResult,
  requestSignal,
  restartAction,
  sessionStartFrom,
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

test("isFreshResult requires a labelled result that differs from the previous one", () => {
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

  // A labelled result with an id becomes the new baseline and ends the session check.
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

  // A finished, unlabelled row changes nothing.
  assert.equal(rememberResult(idless, { id: 9, status: "COMPLETED" }), idless);
});

test("restartAction offers a restart only once no session is running", () => {
  const ready = { deviceOnline: true, busy: false };
  assert.equal(restartAction("idle", ready), "ready");
  assert.equal(restartAction("result", ready), "ready");
  assert.equal(restartAction("timeout", ready), "ready");
  assert.equal(restartAction("recording", ready), "hidden");
  assert.equal(restartAction("analysing", ready), "hidden");
  assert.equal(restartAction("result", { deviceOnline: true, busy: true }), "busy");
  assert.equal(restartAction("result", { deviceOnline: false, busy: false }), "offline");
  assert.equal(restartAction("result", { deviceOnline: false, busy: true }), "offline");
  assert.equal(restartAction("recording", { deviceOnline: false, busy: true }), "hidden");
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
