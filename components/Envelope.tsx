"use client";

import { useMemo } from "react";
import type { Habitat, Investigation, Source, TestPoint } from "@/lib/types";
import type { Focus } from "@/lib/site";
import { MISSING_TAG, coverageByFuel, explicitTests, missingAxis } from "@/lib/ranking";
import { FUEL_COLOR, FUEL_LABEL } from "@/lib/colors";
import EnvelopeChart from "./EnvelopeChart";
import Ranking from "./Ranking";
import SpreadCard from "./SpreadCard";

const names = (a: { short: string }[]) => a.map((c) => c.short).join(", ");

export default function Envelope({
  investigations,
  tests,
  habitats,
  habitat,
  focus,
  sources,
  onOpen,
}: {
  investigations: Investigation[];
  tests: TestPoint[];
  habitats: Habitat[];
  habitat: Habitat;
  focus: Focus;
  sources: Source[];
  onOpen: (id: string) => void;
}) {
  const cov = useMemo(() => coverageByFuel(investigations, habitat.o2Pct, habitat.pressurePsia), [investigations, habitat]);
  const explicit = useMemo(() => explicitTests(investigations, habitat.o2Pct, habitat.pressurePsia), [investigations, habitat]);
  const ferkul = sources.find((x) => x.id === "ferkul-2026-lpsc");
  const spanning = [...cov.gas, ...cov.liquid, ...cov.solid];
  const incomplete = investigations.filter((i) => missingAxis(i) !== null);
  const drawn = investigations.length - investigations.filter((i) => missingAxis(i) === "both").length;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-3">
        <section className="panel flex flex-col" aria-labelledby="env-h">
          <div className="panel-head">
            <h2 id="env-h">Fire envelope: reported O2 and pressure ranges of NASA PSI investigations</h2>
            <span className="num text-[11px] text-muted">
              N = {drawn} of {investigations.length} investigations drawn, {tests.length} CFI-G tests
            </span>
          </div>
          <div className="mx-3 mb-1 space-y-0.5 border border-line bg-wash px-2 py-1 text-[12px] leading-snug" role="status">
            <div>
              <span className="font-medium text-amberink">{habitat.name}</span>
              <span className="num text-muted"> {habitat.o2Pct}% O2, {habitat.pressurePsia} psia, {habitat.gravityG} g</span>
            </div>
            <div>
              {spanning.length ? (
                <>Reported O2 and pressure ranges span this atmosphere: {names(spanning)}. </>
              ) : (
                <span className="font-medium">No PSI investigation range covers this atmosphere. </span>
              )}
              {explicit.length > 0 && (
                <>
                  PSI page lists this atmosphere as a test condition: <span className="font-medium">{names(explicit)}</span>.{" "}
                </>
              )}
              {cov.solid.length ? (
                <>Solid-material ranges spanning it: {names(cov.solid)}.</>
              ) : (
                <span className="font-medium">No solid-material test in this PSI set spans this atmosphere.</span>
              )}
            </div>
          </div>
          <div className="relative h-[290px] px-1 lg:h-[310px]">
            <EnvelopeChart investigations={investigations} tests={tests} habitats={habitats} selected={habitat} onOpen={onOpen} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 pb-1 pt-1 text-[10.5px] text-muted">
            {(Object.keys(FUEL_COLOR) as (keyof typeof FUEL_COLOR)[]).map((f) => (
              <span key={f} className="inline-flex items-center gap-1">
                <i className="inline-block h-2.5 w-3 border" style={{ background: FUEL_COLOR[f] + "29", borderColor: FUEL_COLOR[f] }} />
                {FUEL_LABEL[f]} range
              </span>
            ))}
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2.5 w-3 border border-dashed" style={{ borderColor: "#0072B2" }} />
              one axis only
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-0 w-4 border-t border-[#6B7684]" />
              estimated flame spread vs ISS (lower bound, Olson et al. 2008)
            </span>
            <span>Dots: CFI-G tests. Source: NASA PSI.</span>
          </div>
          <p className="px-3 pb-1 text-[10.5px] leading-snug text-muted">
            Crews breathe O2 partial pressure; fire responds to O2 fraction (
            {ferkul?.url ? (
              <a href={ferkul.url} target="_blank" rel="noreferrer" className="text-steel underline underline-offset-2">Ferkul et al., LPSC 2026</a>
            ) : (
              "Ferkul et al., LPSC 2026"
            )}
            ). Ranges are bounding boxes, not test points. Coverage ignores gravity: all PSI flight data are microgravity, and PSI has no partial-gravity data for {habitat.gravityG > 0 && habitat.gravityG < 1 ? `this ${habitat.gravityG} g habitat` : "0.16 g habitats"}.
          </p>
        </section>
        <section className="panel" aria-labelledby="nr-h">
          <div className="panel-head">
            <h2 id="nr-h">Conditions incomplete or not reported ({incomplete.length})</h2>
            <span className="text-[11px] text-muted">missing axis named on each chip</span>
          </div>
          <ul className="flex flex-wrap gap-1 px-3 pb-3">
            {incomplete.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => onOpen(i.id)} className="chip">
                  {i.short}
                  <span className="ml-1 text-muted">{MISSING_TAG[missingAxis(i)!]}</span>
                </button>
              </li>
            ))}
            {incomplete.length === 0 && <li className="text-xs text-muted">None.</li>}
          </ul>
        </section>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <SpreadCard habitat={habitat} sources={sources} />
        <Ranking investigations={investigations} habitat={habitat} focus={focus} onOpen={onOpen} />
      </div>
    </div>
  );
}
