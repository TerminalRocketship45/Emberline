export const N_LOW = 0.9;
export const N_HIGH = 1.25;
export const P_EXP = 0.05;
export const X_REF = 0.21;
export const P_REF_PSIA = 14.7;
export const VALID_O2: [number, number] = [21, 40];
export const VALID_PSIA: [number, number] = [7.35, 14.7];
export const REFERENCE_TOL_O2 = 1;
export const REFERENCE_TOL_PSIA = 0.3;

export type SpreadKind = "estimate" | "reference" | "out-of-range";

export interface SpreadEstimate {
  low: number;
  high: number;
  kind: SpreadKind;
}

export function multiplier(o2Pct: number, psia: number, n: number): number {
  return Math.pow(o2Pct / 100 / X_REF, n) * Math.pow(psia / P_REF_PSIA, P_EXP);
}

export function estimateSpread(o2Pct: number, psia: number): SpreadEstimate {
  const a = multiplier(o2Pct, psia, N_LOW);
  const b = multiplier(o2Pct, psia, N_HIGH);
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  if (Math.abs(o2Pct - X_REF * 100) <= REFERENCE_TOL_O2 && Math.abs(psia - P_REF_PSIA) <= REFERENCE_TOL_PSIA) {
    return { low: 1, high: 1, kind: "reference" };
  }
  const valid = o2Pct >= VALID_O2[0] && o2Pct <= VALID_O2[1] && psia >= VALID_PSIA[0] && psia <= VALID_PSIA[1];
  return { low, high, kind: valid ? "estimate" : "out-of-range" };
}
