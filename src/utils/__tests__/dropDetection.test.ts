import {
  magnitude,
  protectionScore,
  createDropDetector,
  CRACK_THRESHOLD_G,
  SAMPLE_INTERVAL_MS,
} from '../dropDetection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Phone at rest — ~1g pointing down. */
const REST = { x: 0, y: 0, z: 1 };

/** True freefall — weightless. */
const FREEFALL = { x: 0, y: 0, z: 0 };

/** Spike to a given magnitude along the z axis. */
const spike = (g: number) => ({ x: 0, y: 0, z: g });

/**
 * Push the detector through a complete drop cycle:
 *   freefallCount × freefall samples → impact spike → stopCount × above-REST
 *   samples → one at-rest sample to settle.
 */
function runDrop(
  detector: ReturnType<typeof createDropDetector>,
  opts: { freefallCount?: number; impactG?: number; stopCount?: number } = {},
): void {
  const { freefallCount = 10, impactG = 5, stopCount = 0 } = opts;
  for (let i = 0; i < freefallCount; i++) detector.handleReading(FREEFALL);
  detector.handleReading(spike(impactG));
  for (let i = 0; i < stopCount; i++) detector.handleReading(spike(2)); // above REST_THRESHOLD
  detector.handleReading(REST);
}

// ─── magnitude ────────────────────────────────────────────────────────────────

describe('magnitude', () => {
  it('is 0 in true freefall', () => {
    expect(magnitude(FREEFALL)).toBe(0);
  });

  it('is ~1g at rest', () => {
    expect(magnitude(REST)).toBeCloseTo(1);
  });

  it('follows sqrt(x²+y²+z²)', () => {
    expect(magnitude({ x: 3, y: 4, z: 0 })).toBeCloseTo(5);
  });

  it('is symmetric across axes', () => {
    const val = magnitude({ x: 1, y: 2, z: 2 });
    expect(val).toBeCloseTo(3);
    expect(magnitude({ x: 2, y: 1, z: 2 })).toBeCloseTo(val);
  });
});

// ─── protectionScore ──────────────────────────────────────────────────────────

describe('protectionScore', () => {
  it('is 100 at 0g (perfect cushion)', () => {
    expect(protectionScore(0)).toBe(100);
  });

  it('is 0 at 40g and beyond (clamps at floor)', () => {
    expect(protectionScore(40)).toBe(0);
    expect(protectionScore(1000)).toBe(0);
  });

  it('decreases as force increases', () => {
    expect(protectionScore(5)).toBeGreaterThan(protectionScore(20));
    expect(protectionScore(20)).toBeGreaterThan(protectionScore(35));
  });

  it('scores 25 at crack threshold (30g)', () => {
    // 100 - 30 * 2.5 = 25
    expect(protectionScore(CRACK_THRESHOLD_G)).toBe(25);
  });

  it('never goes negative', () => {
    expect(protectionScore(500)).toBe(0);
  });
});

// ─── createDropDetector — state machine ───────────────────────────────────────

describe('createDropDetector', () => {
  it('does not fire while the phone is at rest', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    for (let i = 0; i < 200; i++) det.handleReading(REST);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('does not fire on impact without enough freefall samples first', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    // Only 3 samples — MIN_FREEFALL_SAMPLES is 4, so state never leaves 'waiting'
    for (let i = 0; i < 3; i++) det.handleReading(FREEFALL);
    det.handleReading(spike(10));
    det.handleReading(REST);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('fires exactly once after a clean drop', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    runDrop(det);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('result contains all required fields', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    runDrop(det);
    const result = onResult.mock.calls[0][0];
    expect(result).toMatchObject({
      peakG: expect.any(Number),
      estG: expect.any(Number),
      velocity: expect.any(Number),
      height: expect.any(Number),
      freefallMs: expect.any(Number),
      stopMs: expect.any(Number),
      score: expect.any(Number),
      prediction: expect.stringMatching(/^(safe|cracked)$/),
    });
  });

  it('prediction is cracked when peakG >= CRACK_THRESHOLD_G', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    runDrop(det, { impactG: CRACK_THRESHOLD_G + 1 });
    expect(onResult.mock.calls[0][0].prediction).toBe('cracked');
  });

  it('prediction is safe when peakG < CRACK_THRESHOLD_G', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    runDrop(det, { impactG: CRACK_THRESHOLD_G - 1 });
    expect(onResult.mock.calls[0][0].prediction).toBe('safe');
  });

  it('peakG reflects the highest reading during impact', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    for (let i = 0; i < 10; i++) det.handleReading(FREEFALL);
    det.handleReading(spike(4));   // enters impact
    det.handleReading(spike(9));   // new peak
    det.handleReading(spike(6));   // lower — peakG stays at 9
    det.handleReading(REST);
    expect(onResult.mock.calls[0][0].peakG).toBeCloseTo(9);
  });

  it('freefallMs grows with more freefall samples', () => {
    const short = jest.fn();
    const long  = jest.fn();
    runDrop(createDropDetector(SAMPLE_INTERVAL_MS, short), { freefallCount: 5 });
    runDrop(createDropDetector(SAMPLE_INTERVAL_MS, long),  { freefallCount: 30 });
    expect(long.mock.calls[0][0].freefallMs).toBeGreaterThan(short.mock.calls[0][0].freefallMs);
  });

  it('stopMs grows with more above-REST samples', () => {
    const few  = jest.fn();
    const many = jest.fn();
    runDrop(createDropDetector(SAMPLE_INTERVAL_MS, few),  { stopCount: 1 });
    runDrop(createDropDetector(SAMPLE_INTERVAL_MS, many), { stopCount: 10 });
    expect(many.mock.calls[0][0].stopMs).toBeGreaterThan(few.mock.calls[0][0].stopMs);
  });

  it('score decreases as peakG increases', () => {
    const low  = jest.fn();
    const high = jest.fn();
    runDrop(createDropDetector(SAMPLE_INTERVAL_MS, low),  { impactG: 2  });
    runDrop(createDropDetector(SAMPLE_INTERVAL_MS, high), { impactG: 20 });
    expect(low.mock.calls[0][0].score).toBeGreaterThan(high.mock.calls[0][0].score);
  });

  it('score is based on peakG, not estG', () => {
    // Both runs have the same freefall + stop time (same estG), but different
    // impact spikes (different peakG). Scores must differ.
    const a = jest.fn();
    const b = jest.fn();
    runDrop(createDropDetector(SAMPLE_INTERVAL_MS, a), { impactG: 3,  stopCount: 5 });
    runDrop(createDropDetector(SAMPLE_INTERVAL_MS, b), { impactG: 25, stopCount: 5 });
    expect(a.mock.calls[0][0].score).not.toBe(b.mock.calls[0][0].score);
  });

  it('discards mid-air bump and waits for real landing', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    // Freefall
    for (let i = 0; i < 10; i++) det.handleReading(FREEFALL);
    // Brief bump (enters impact then g drops back to near-zero)
    det.handleReading(spike(3));
    for (let i = 0; i < 5; i++) det.handleReading(FREEFALL); // g drops → mid-air bump fix
    expect(onResult).not.toHaveBeenCalled(); // no result yet
    // Real landing
    det.handleReading(spike(3));
    det.handleReading(REST);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('fires correctly on a second drop after the first completes', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    runDrop(det);
    runDrop(det);
    expect(onResult).toHaveBeenCalledTimes(2);
  });

  it('ignores mid-range g (between freefall and impact thresholds) while in freefall state', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    // Enter freefall state
    for (let i = 0; i < 10; i++) det.handleReading(FREEFALL);
    // Feed g in the dead zone (>0.3 but <1.8) — should not transition to impact
    for (let i = 0; i < 5; i++) det.handleReading(spike(1.0));
    // Then a real impact + settle
    det.handleReading(spike(5));
    det.handleReading(REST);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('reset() aborts an in-progress freefall and requires re-arm', () => {
    const onResult = jest.fn();
    const det = createDropDetector(SAMPLE_INTERVAL_MS, onResult);
    for (let i = 0; i < 10; i++) det.handleReading(FREEFALL);
    det.reset(); // abort mid-freefall
    det.handleReading(spike(10)); // should not trigger — waiting state again
    det.handleReading(REST);
    expect(onResult).not.toHaveBeenCalled();
  });
});
