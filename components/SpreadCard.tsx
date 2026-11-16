import type { Habitat, Source } from "@/lib/types";
import { estimateSpread, N_HIGH, N_LOW } from "@/lib/model";

export default function SpreadCard({ habitat, sources }: { habitat: Habitat; sources: Source[] }) {
  const olson = sources.find((x) => x.id === "olson-2008-tm");
  const ferkul = sources.find((x) => x.id === "ferkul-2026-lpsc");
  const cite = (s: Source | undefined, label: string) =>
    s?.url ? (
      <a href={s.url} target="_blank" rel="noreferrer" className="text-steel underline underline-offset-2">{label}</a>
    ) : (
      label
    );
  const est = estimateSpread(habitat.o2Pct, habitat.pressurePsia);
  const max = 2.2;
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <section className="panel" aria-labelledby="spread-h">
      <div className="panel-head">
        <h2 id="spread-h">Flame spread vs ISS air</h2>
        <span className="tag">{est.kind === "reference" ? "reference" : "estimate"}</span>
      </div>
      {est.kind !== "out-of-range" ? (
        <div className="px-3 pb-3">
          <div className="flex items-baseline gap-2">
            {est.kind === "reference" ? (
              <>
                <span className="num text-2xl font-medium text-ink">1.00</span>
                <span className="text-xs text-muted">x ISS speed: this is the reference air, no estimate</span>
              </>
            ) : (
              <>
                <span className="num text-2xl font-medium text-ink">
                  {est.low.toFixed(2)} to {est.high.toFixed(2)}
                </span>
                <span className="text-xs text-muted">x ISS speed (n = {N_LOW} to {N_HIGH})</span>
              </>
            )}
          </div>
          <div className="relative mt-2 h-3 border border-line bg-white" aria-hidden="true">
            <div className="absolute inset-y-0 bg-amber" style={{ left: pct(est.low), width: `calc(${pct(est.high)} - ${pct(est.low)})` }} />
            <div className="absolute inset-y-0 w-px bg-ink" style={{ left: pct(1) }} />
          </div>
          <div className="num mt-0.5 flex justify-between text-[10px] text-muted">
            <span>0 x</span>
            <span>1.0 x ISS</span>
            <span>2.2 x</span>
          </div>
          <p className="mt-1.5 text-[10.5px] leading-snug text-muted">
            Estimate, thin fabrics, valid 21 to 40% O2, 0.5 to 1 atm. Opposed flow, anchored on one fabric; over-predicts near flammability limits; ignores confinement and thick fuels. Source: Olson et al. 2008, NASA/TM-2008-215260.
          </p>
          <p className="mt-0.5 text-[10.5px] leading-snug text-muted">
            Microgravity can lower the burning limit by up to about 4% O2 versus the 1 g NASA-STD-6001 Test 1 ({cite(olson, "Olson et al. 2008")}); lunar gravity may be as bad or worse ({cite(ferkul, "Ferkul et al., LPSC 2026")}).
          </p>
        </div>
      ) : (
        <p className="px-3 pb-3 text-[12px] leading-snug text-muted">
          Not shown for {habitat.shortName}: {habitat.o2Pct}% O2 at {habitat.pressurePsia} psia is outside the correlation&apos;s valid range (21 to 40% O2, 0.5 to 1 atm; no estimate is shown below 21% O2). Source: Olson et al. 2008, NASA/TM-2008-215260.
        </p>
      )}
    </section>
  );
}
