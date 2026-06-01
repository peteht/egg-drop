import type { DropResult } from '../types';

// Sample as fast as the hardware allows. Stopping-time resolution is capped by
// this interval, so smaller = better at catching hard impacts.
export const SAMPLE_INTERVAL_MS = 10;

// Average deceleration (in g) at which a raw egg typically cracks.
export const CRACK_THRESHOLD_G = 30;

const G = 9.81; // m/s²

const FREEFALL_THRESHOLD = 0.3;
const MIN_FREEFALL_SAMPLES = 4;
const IMPACT_THRESHOLD = 1.8;
const REST_THRESHOLD = 1.3;

type DetectorState = 'waiting' | 'freefall' | 'impact';

/** 3-axis accelerometer reading. */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** Handle returned by createDropDetector. */
export interface DropDetector {
  handleReading: (accel: Vector3) => void;
  reset: () => void;
}

export function magnitude({ x, y, z }: Vector3): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Cosmetic score 0–100 derived from peak g — higher = lower peak force.
 * Display-only; the crack/safe decision is made separately from peakG.
 */
export function protectionScore(peakG: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - peakG * 2.5)));
}

function computeResult(
  freefallSamples: number,
  stopSamples: number,
  peakG: number,
  intervalMs: number,
): DropResult {
  const tFreefall = (freefallSamples * intervalMs) / 1000;
  const vImpact = G * tFreefall;
  const height = 0.5 * G * tFreefall * tFreefall;
  const tStop = (Math.max(stopSamples, 1) * intervalMs) / 1000;
  const estG = vImpact / (tStop * G);

  return {
    peakG: parseFloat(peakG.toFixed(1)),
    estG: parseFloat(estG.toFixed(1)),
    velocity: parseFloat(vImpact.toFixed(2)),
    height: parseFloat(height.toFixed(2)),
    freefallMs: Math.round(tFreefall * 1000),
    stopMs: Math.round(tStop * 1000),
    score: protectionScore(peakG),
    prediction: peakG >= CRACK_THRESHOLD_G ? 'cracked' : 'safe',
  };
}

export function createDropDetector(
  intervalMs: number,
  onResult: (result: DropResult) => void,
): DropDetector {
  let state: DetectorState = 'waiting';
  let freefallSamples = 0;
  let stopSamples = 0;
  let peakG = 0;

  function reset(): void {
    state = 'waiting';
    freefallSamples = 0;
    stopSamples = 0;
    peakG = 0;
  }

  function handleReading(accel: Vector3): void {
    const g = magnitude(accel);
    switch (state) {
      case 'waiting':
        if (g < FREEFALL_THRESHOLD) {
          freefallSamples++;
          if (freefallSamples >= MIN_FREEFALL_SAMPLES) state = 'freefall';
        } else {
          freefallSamples = 0;
        }
        break;
      case 'freefall':
        if (g > IMPACT_THRESHOLD) {
          state = 'impact';
          peakG = g;
          stopSamples = 1;
        } else if (g < FREEFALL_THRESHOLD) {
          freefallSamples++;
        }
        break;
      case 'impact':
        if (g > peakG) peakG = g;
        if (g > REST_THRESHOLD) {
          stopSamples++;
        } else if (g < FREEFALL_THRESHOLD) {
          // g dropped back to near-zero — mid-air bump, not a landing.
          // Discard the pseudo-impact and resume measuring freefall.
          state = 'freefall';
          stopSamples = 0;
          peakG = 0;
        } else {
          // g settling near 1g — real landing, record result.
          onResult(computeResult(freefallSamples, stopSamples, peakG, intervalMs));
          reset();
        }
        break;
    }
  }

  return { handleReading, reset };
}
