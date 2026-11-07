/**
 * Pure PPG waveform helpers for the landing-page illustrations.
 *
 * The shapes are illustrative, not medical data: a normal rhythm keeps
 * beat-to-beat intervals nearly equal, while Atrial Fibrillation (AF) makes
 * them "irregularly irregular" and lets the pulse amplitude wander.
 */

export type Rhythm = "normal" | "af";

export type PulseBeat = {
  start: number;
  duration: number;
  amplitude: number;
  rhythm: Rhythm;
};

export type PulseSample = {
  value: number;
  rhythm: Rhythm;
  bpm: number;
  beatIndex: number;
};

export type PulseSchedule = ReadonlyArray<{ rhythm: Rhythm; beats: number }>;

/** Small deterministic PRNG (mulberry32) so illustrations render the same on server and client. */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(x: number, center: number, sigma: number) {
  return Math.exp(-(((x - center) / sigma) ** 2) / 2);
}

/** Amplitude (≈0–1) of a single PPG pulse, `seconds` after the beat onset. */
export function ppgBeatShape(seconds: number) {
  if (seconds < 0) {
    return 0;
  }

  const systolic = gaussian(seconds, 0.16, seconds < 0.16 ? 0.05 : 0.07);
  const dicrotic = 0.38 * gaussian(seconds, 0.4, 0.07);
  const rise = 1 / (1 + Math.exp(-(seconds - 0.2) / 0.04));
  const diastolicDecay =
    0.12 * rise * Math.exp(-Math.max(0, seconds - 0.4) / 0.35);

  return systolic + dicrotic + diastolicDecay;
}

/** Beat-to-beat (RR) intervals in seconds. */
export function rrIntervals(
  rhythm: Rhythm,
  count: number,
  random: () => number,
  baseInterval: number,
) {
  if (rhythm === "normal") {
    return Array.from(
      { length: count },
      () => baseInterval * (1 + (random() - 0.5) * 0.06),
    );
  }

  // AF: faster on average and "irregularly irregular" — no two neighbouring
  // intervals are allowed to look alike, so the chaos is visible at a glance.
  const intervals: number[] = [];
  let previous = baseInterval;

  for (let index = 0; index < count; index += 1) {
    let factor = 0.45 + random() * 0.8;

    if (Math.abs(factor * baseInterval - previous) < baseInterval * 0.2) {
      factor = factor > 0.85 ? factor - 0.32 : factor + 0.36;
    }

    previous = factor * baseInterval;
    intervals.push(previous);
  }

  return intervals;
}

type PulseStreamOptions = {
  baseBpm: number;
  schedule: PulseSchedule;
  seed: number;
};

/** A looping pulse signal that follows a rhythm schedule (e.g. normal → AF → normal). */
export function createPulseStream({
  baseBpm,
  schedule,
  seed,
}: PulseStreamOptions) {
  const baseInterval = 60 / baseBpm;
  const random = createRandom(seed);
  const beats: PulseBeat[] = [];
  let cursor = 0;
  let previousDuration = baseInterval;

  for (const segment of schedule) {
    for (const duration of rrIntervals(
      segment.rhythm,
      segment.beats,
      random,
      baseInterval,
    )) {
      const fill = Math.min(1, previousDuration / baseInterval);
      const amplitude =
        segment.rhythm === "normal"
          ? 0.92 + random() * 0.08
          : Math.min(
              1,
              Math.max(
                0.3,
                0.28 + 0.72 * fill ** 1.6 + (random() - 0.5) * 0.14,
              ),
            );

      beats.push({
        start: cursor,
        duration,
        amplitude,
        rhythm: segment.rhythm,
      });
      cursor += duration;
      previousDuration = duration;
    }
  }

  const duration = cursor;

  function beatIndexAt(time: number) {
    let low = 0;
    let high = beats.length - 1;

    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (beats[middle].start <= time) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }

    return low;
  }

  function sampleAt(time: number): PulseSample {
    const looped = ((time % duration) + duration) % duration;
    const index = beatIndexAt(looped);
    const beat = beats[index];
    const sinceOnset = looped - beat.start;
    let value = beat.amplitude * ppgBeatShape(sinceOnset);
    let lookback = sinceOnset;

    // Let the tails of the two previous pulses overlap the current one, so short
    // AF intervals start their upstroke from the previous diastolic level.
    for (let step = 1; step <= 2; step += 1) {
      const previous = beats[(index - step + beats.length) % beats.length];
      lookback += previous.duration;
      value += previous.amplitude * ppgBeatShape(lookback);
    }

    return {
      value,
      rhythm: beat.rhythm,
      bpm: Math.round(60 / beat.duration),
      beatIndex: index,
    };
  }

  function firstBeatOf(rhythm: Rhythm) {
    return beats.find((beat) => beat.rhythm === rhythm)?.start ?? -1;
  }

  return {
    beats: beats as ReadonlyArray<PulseBeat>,
    duration,
    sampleAt,
    firstBeatOf,
  };
}

export type PulseStream = ReturnType<typeof createPulseStream>;

type RhythmWindowOptions = {
  rhythm: Rhythm;
  seed: number;
  /** Whole beats shown in the window, so the strip starts and ends at a beat onset. */
  beats: number;
  samples: number;
  baseBpm?: number;
};

/**
 * A fixed strip of signal measured in whole beats. `t` and interval edges are
 * fractions (0–1) of the strip width, so overlays line up with any width.
 */
export function rhythmWindow({
  rhythm,
  seed,
  beats,
  samples,
  baseBpm = 72,
}: RhythmWindowOptions) {
  const stream = createPulseStream({
    baseBpm,
    seed,
    schedule: [{ rhythm, beats: beats + 2 }],
  });
  const windowBeats = stream.beats.slice(0, beats);
  const duration = windowBeats.reduce((sum, beat) => sum + beat.duration, 0);
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const value = Math.min(
      1.1,
      Math.max(0, stream.sampleAt(t * duration).value),
    );

    return { t, value };
  });
  const intervals = windowBeats.map((beat) => ({
    start: beat.start / duration,
    end: (beat.start + beat.duration) / duration,
    seconds: beat.duration,
  }));

  return { duration, intervals, points };
}

function round(value: number) {
  return Number(value.toFixed(2)).toString();
}

/** Polyline path for values in 0–1; 1 maps to the top edge. */
export function buildSvgPath(
  values: ReadonlyArray<number>,
  width: number,
  height: number,
) {
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = round(index * step);
      const y = round(height - value * height);

      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join("");
}

export function formatSeconds(seconds: number) {
  return seconds.toFixed(2).replace(".", ",");
}
