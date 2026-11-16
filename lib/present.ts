import type { FuelType, Habitat, Investigation, Range } from "./types";
import type { RankRow } from "./ranking";
import { estimateSpread } from "./model";
import { COVER_TOL_O2, COVER_TOL_PSIA, EXPLICIT_TEST_ATMOSPHERES } from "./site";

export const FUEL_ORDER: Record<FuelType, number> = { solid: 0, liquid: 1, gas: 2 };

export const HEADLINE_HABITATS: { id: string; label: string }[] = [
  { id: "iss", label: "ISS" },
  { id: "lunar-base", label: "Lunar base" },
  { id: "exploration", label: "Lunar habitat & rover" },
];

export function o2Rows(investigations: Investigation[]): Investigation[] {
  return investigations
    .filter((i) => i.conditions.o2Pct)
    .sort((a, b) => {
      const f = FUEL_ORDER[a.fuelType] - FUEL_ORDER[b.fuelType];
      if (f !== 0) return f;
      return a.conditions.o2Pct![1] - b.conditions.o2Pct![1];
    });
}

export function solidMaxO2(investigations: Investigation[]): number {
  return Math.max(
    0,
    ...investigations.filter((i) => i.fuelType === "solid" && i.conditions.o2Pct).map((i) => i.conditions.o2Pct![1]),
  );
}

const n = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10));

export function rangeText(r: Range | null, unit: string): string {
  if (!r) return "";
  return r[0] === r[1] ? `${n(r[0])}${unit}` : `${n(r[0])}–${n(r[1])}${unit}`;
}

export function heroTitle(habitat: Habitat, solidMax: number): string {
  return habitat.o2Pct > solidMax
    ? "No NASA fabric or plastic burn test reaches this habitat’s oxygen"
    : "This habitat’s oxygen is within NASA’s solid-material tests";
}

export function spreadKpi(habitat: Habitat): { value: string; label: string } {
  const est = estimateSpread(habitat.o2Pct, habitat.pressurePsia);
  if (est.kind === "reference") return { value: "1×", label: "reference: ISS air" };
  if (est.kind === "out-of-range") return { value: "—", label: "outside model range" };
  return { value: `${est.low.toFixed(1)}–${est.high.toFixed(1)}×`, label: "est. flame spread vs ISS air" };
}

export function partialPressure(o2Pct: number, psia: number): number {
  return Math.round(((o2Pct / 100) * psia) * 10) / 10;
}

function gapOf(v: number, r: Range): number {
  if (v < r[0]) return r[0] - v;
  if (v > r[1]) return v - r[1];
  return 0;
}

export function plainReason(r: RankRow, habitat: Habitat): string {
  const { o2Pct, pressurePsia } = r.inv.conditions;
  if (!o2Pct && !pressurePsia) return "Conditions unreported";
  const go = o2Pct ? gapOf(habitat.o2Pct, o2Pct) : 0;
  const gp = pressurePsia ? gapOf(habitat.pressurePsia, pressurePsia) : 0;
  if (go > 0) return `O2 ${n(go)} points ${habitat.o2Pct > o2Pct![1] ? "lower" : "higher"}`;
  if (gp > 0) return `${n(gp)} psia ${habitat.pressurePsia > pressurePsia![1] ? "lower" : "higher"}`;
  if (!o2Pct) return "O2 unreported";
  if (!pressurePsia) return "Pressure unreported";
  const explicit = EXPLICIT_TEST_ATMOSPHERES.some(
    (e) => e.investigationId === r.inv.id && Math.abs(e.o2Pct - habitat.o2Pct) <= COVER_TOL_O2 && Math.abs(e.pressurePsia - habitat.pressurePsia) <= COVER_TOL_PSIA,
  );
  return explicit ? "Tested at this atmosphere" : "Spans habitat";
}
