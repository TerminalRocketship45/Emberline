import type { Range } from "./types";

export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function fmtRange(r: Range | null, unit: string): string {
  if (!r) return "not reported";
  return r[0] === r[1] ? `${fmtNum(r[0])} ${unit}` : `${fmtNum(r[0])} to ${fmtNum(r[1])} ${unit}`;
}

export function doiUrl(doi: string): string {
  return `https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//, "")}`;
}
