// ─── Core domain types ────────────────────────────────────────────────────────

export type Prediction = 'safe' | 'cracked';

export type Surface = 'solid' | 'carpet' | 'grass';

/**
 * Raw physics output from a single drop — everything computed by the detector
 * before the record is persisted.
 */
export interface DropResult {
  peakG: number;
  estG: number;
  velocity: number;
  height: number;
  freefallMs: number;
  stopMs: number;
  score: number;
  prediction: Prediction;
}

/**
 * Persisted drop — extends DropResult with identity, timestamp, and the
 * optional real-egg validation fields.
 */
export interface DropRecord extends DropResult {
  id: string;
  date: string;
  surface?: Surface;
  eggTested: boolean;
  actualResult: Prediction | null;
  predictionCorrect: boolean | null;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  Drop: undefined;
  Result: { record: DropRecord };
  History: undefined;
};
