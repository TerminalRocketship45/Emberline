"use client";

import type { Habitat, Investigation, Source } from "@/lib/types";
import type { Focus } from "@/lib/site";
import { heroTitle, partialPressure, solidMaxO2, spreadKpi } from "@/lib/present";
import RangeChart from "./RangeChart";
import Ranking from "./Ranking";

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-line bg-white px-5 py-4">
      <div className="num text-[32px] font-medium leading-none text-ink">{value}</div>
      <div className="mt-2 text-[12px] leading-snug text-muted">{label}</div>
    </div>
  );
}

export default function Envelope({
  investigations,
  habitats,
  habitat,
  focus,
  setFocus,
  sources,
  onOpen,
}: {
  investigations: Investigation[];
  habitats: Habitat[];
  habitat: Habitat;
  focus: Focus;
  setFocus: (f: Focus) => void;
  sources: Source[];
  onOpen: (id: string) => void;
}) {
  const solidMax = solidMaxO2(investigations);
  const spread = spreadKpi(habitat);
  const iss = habitats.find((h) => h.id === "iss");
  const ferkul = sources.find((x) => x.id === "ferkul-2026-lpsc");
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi value={String(investigations.length)} label="NASA PSI combustion investigations" />
        <Kpi value={`${solidMax}%`} label="highest O2 in any solid-material test" />
        <Kpi value={`${habitat.o2Pct}%`} label="O2 in selected habitat" />
        <Kpi value={spread.value} label={spread.label} />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
        <section className="border border-line bg-white px-5 py-5" aria-labelledby="env-h">
          <h2 id="env-h" className="mb-3 text-[15px] font-semibold leading-snug">{heroTitle(habitat, solidMax)}</h2>
          <RangeChart investigations={investigations} habitats={habitats} habitat={habitat} solidMax={solidMax} onOpen={onOpen} />
          <p className="mt-3 text-[12px] leading-snug text-muted">
            Bars: reported O2 ranges. Microgravity only; no partial-gravity data.
          </p>
        </section>
        <Ranking investigations={investigations} habitat={habitat} focus={focus} setFocus={setFocus} onOpen={onOpen} />
      </div>
      <section className="border border-line bg-white px-5 py-5" aria-labelledby="bvf-h">
        <h2 id="bvf-h" className="text-[15px] font-semibold">Breathing vs fire</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="num text-[32px] font-medium leading-none">{partialPressure(habitat.o2Pct, habitat.pressurePsia)} psia</div>
            <div className="mt-2 text-[12px] text-muted">
              O2 partial pressure{iss ? ` (ISS ${partialPressure(iss.o2Pct, iss.pressurePsia)})` : ""}
            </div>
          </div>
          <div>
            <div className="num text-[32px] font-medium leading-none">{habitat.o2Pct}%</div>
            <div className="mt-2 text-[12px] text-muted">O2 fraction{iss ? ` (ISS ${iss.o2Pct}%)` : ""}</div>
          </div>
        </div>
        <p className="mt-4 text-[15px]">
          Crews breathe partial pressure; fire responds to fraction (
          {ferkul?.url ? (
            <a href={ferkul.url} target="_blank" rel="noreferrer" className="text-steel underline underline-offset-2">Ferkul et al., LPSC 2026</a>
          ) : (
            "Ferkul et al., LPSC 2026"
          )}
          ).
        </p>
      </section>
    </div>
  );
}
