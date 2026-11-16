import type { FuelType, Habitat, Investigation, Pillar } from "./types";
import { COVER_TOL_O2, COVER_TOL_PSIA, EXPLICIT_TEST_ATMOSPHERES, type Focus } from "./site";

export const WEIGHTS = { proximity: 0.4, fuel: 0.2, pillar: 0.25, flight: 0.15 } as const;
export const O2_SCALE = 30;
export const P_SCALE = 15;
export const FUEL_SCORE: Record<FuelType, number> = { solid: 1, gas: 0.7, liquid: 0.5 };

export interface RankRow {
  inv: Investigation;
  score: number;
  parts: { proximity: number; fuel: number; pillar: number; flight: number };
  distance: number | null;
  notReported: boolean;
  missing: Missing;
  why: string;
}

function gap(v: number, r: [number, number]): number {
  if (v < r[0]) return r[0] - v;
  if (v > r[1]) return v - r[1];
  return 0;
}

export type Missing = "o2" | "pressure" | "both" | null;

export function missingAxis(inv: Investigation): Missing {
  const { o2Pct, pressurePsia } = inv.conditions;
  if (!o2Pct && !pressurePsia) return "both";
  if (!o2Pct) return "o2";
  if (!pressurePsia) return "pressure";
  return null;
}

export const MISSING_TAG: Record<Exclude<Missing, null>, string> = {
  both: "conditions not reported",
  o2: "O2 not reported",
  pressure: "pressure not reported",
};

export function conditionDistance(inv: Investigation, o2: number, psia: number): number | null {
  const { o2Pct, pressurePsia } = inv.conditions;
  if (!o2Pct && !pressurePsia) return null;
  const dx = o2Pct ? gap(o2, o2Pct) / O2_SCALE : 0;
  const dy = pressurePsia ? gap(psia, pressurePsia) / P_SCALE : 0;
  return Math.sqrt(dx * dx + dy * dy);
}

function pillarMatch(pillars: Pillar[], focus: Focus): number {
  if (focus === "all") return 1;
  return pillars.includes(focus) ? 1 : 0;
}

export function rank(investigations: Investigation[], habitat: Habitat, focus: Focus): RankRow[] {
  const explicitIds = new Set(explicitTests(investigations, habitat.o2Pct, habitat.pressurePsia).map((i) => i.id));
  const rows = investigations.map((inv) => {
    const distance = conditionDistance(inv, habitat.o2Pct, habitat.pressurePsia);
    const missing = missingAxis(inv);
    const notReported = distance === null;
    const full = notReported ? 0.5 : 1 / (1 + distance * 4);
    const proximity = missing === "o2" || missing === "pressure" ? (full + 0.5) / 2 : full;
    const fuel = FUEL_SCORE[inv.fuelType];
    const pillar = pillarMatch(inv.pillars, focus);
    const flight = inv.kind === "flight" ? 1 : 0.7;
    const score =
      100 *
      (WEIGHTS.proximity * proximity + WEIGHTS.fuel * fuel + WEIGHTS.pillar * pillar + WEIGHTS.flight * flight);
    const why = [
      missing === "both"
        ? "Conditions not reported"
        : missing
          ? `${MISSING_TAG[missing][0].toUpperCase()}${MISSING_TAG[missing].slice(1)}; ${describeGap(inv, habitat.o2Pct, habitat.pressurePsia, true, false)}`
          : describeGap(inv, habitat.o2Pct, habitat.pressurePsia, false, explicitIds.has(inv.id)),
      `${inv.fuelType} fuel`,
      focus === "all" ? inv.pillars.join(", ") || "no pillar tag" : pillar ? `matches ${focus}` : `not tagged ${focus}`,
      inv.kind,
    ].join("; ");
    return { inv, score, parts: { proximity, fuel, pillar, flight }, distance, notReported, missing, why };
  });
  return rows.sort((a, b) => b.score - a.score);
}

export function coveredBy(investigations: Investigation[], o2: number, psia: number): Investigation[] {
  return investigations.filter((i) => {
    const { o2Pct, pressurePsia } = i.conditions;
    if (!o2Pct || !pressurePsia) return false;
    return (
      o2 >= o2Pct[0] - COVER_TOL_O2 &&
      o2 <= o2Pct[1] + COVER_TOL_O2 &&
      psia >= pressurePsia[0] - COVER_TOL_PSIA &&
      psia <= pressurePsia[1] + COVER_TOL_PSIA
    );
  });
}

export function coverageByFuel(investigations: Investigation[], o2: number, psia: number) {
  const hits = coveredBy(investigations, o2, psia);
  return {
    solid: hits.filter((i) => i.fuelType === "solid"),
    gas: hits.filter((i) => i.fuelType === "gas"),
    liquid: hits.filter((i) => i.fuelType === "liquid"),
  };
}

export function explicitTests(investigations: Investigation[], o2: number, psia: number): Investigation[] {
  const ids = EXPLICIT_TEST_ATMOSPHERES.filter(
    (e) => Math.abs(e.o2Pct - o2) <= COVER_TOL_O2 && Math.abs(e.pressurePsia - psia) <= COVER_TOL_PSIA,
  ).map((e) => e.investigationId);
  return investigations.filter((i) => ids.includes(i.id));
}

function describeGap(inv: Investigation, o2: number, psia: number, partial: boolean, explicit: boolean): string {
  const { o2Pct, pressurePsia } = inv.conditions;
  const parts: string[] = [];
  if (o2Pct) {
    const g = gap(o2, o2Pct);
    if (g > 0) parts.push(`${Math.round(g * 10) / 10} points ${o2 > o2Pct[1] ? "below" : "above"} this O2`);
  }
  if (pressurePsia) {
    const g = gap(psia, pressurePsia);
    if (g > 0) parts.push(`${Math.round(g * 10) / 10} psia ${psia > pressurePsia[1] ? "below" : "above"} this pressure`);
  }
  if (parts.length) return `tested ${parts.join(" and ")}`.replace(/^t/, partial ? "t" : "T");
  if (!partial) return explicit ? "PSI page lists this exact atmosphere as a test condition" : "Reported ranges include this point";
  return o2Pct ? "reported O2 range includes this value" : "reported pressure range includes this value";
}
