import type { Habitat, Investigation } from "@/lib/types";
import { FOCUS_OPTIONS, type Focus } from "@/lib/site";
import { WEIGHTS, rank } from "@/lib/ranking";
import { plainReason } from "@/lib/present";
import { useMemo } from "react";

const PARTS = [
  { key: "proximity", label: "Conditions" },
  { key: "fuel", label: "Fuel" },
  { key: "pillar", label: "Pillar" },
  { key: "flight", label: "Flight" },
] as const;

export default function Ranking({
  investigations,
  habitat,
  focus,
  setFocus,
  onOpen,
}: {
  investigations: Investigation[];
  habitat: Habitat;
  focus: Focus;
  setFocus: (f: Focus) => void;
  onOpen: (id: string) => void;
}) {
  const rows = useMemo(() => rank(investigations, habitat, focus).slice(0, 5), [investigations, habitat, focus]);
  return (
    <section className="border border-line bg-white px-5 py-5" aria-labelledby="rank-h">
      <h2 id="rank-h" className="text-[15px] font-semibold">Most relevant for this habitat</h2>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Focus">
        {FOCUS_OPTIONS.map((f) => (
          <button key={f} type="button" aria-pressed={focus === f} onClick={() => setFocus(f)} className={`pill capitalize ${focus === f ? "pill-on" : ""}`}>
            {f}
          </button>
        ))}
      </div>
      <ol className="mt-2 list-decimal pl-7 marker:font-mono marker:text-[12px] marker:text-muted">
        {rows.map((r) => {
          const tip = `Score ${r.score.toFixed(0)} of 100. ${PARTS.map((p) => `${p.label} ${(WEIGHTS[p.key] * r.parts[p.key] * 100).toFixed(0)} of ${WEIGHTS[p.key] * 100}`).join(", ")}. ${r.why}`;
          return (
            <li key={r.inv.id} className="border-t border-line first:border-t-0">
              <button type="button" onClick={() => onOpen(r.inv.id)} title={tip} className="block w-full py-3 text-left hover:bg-wash focus-visible:outline-2 focus-visible:outline-steel">
                <div className="flex items-baseline gap-3">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{r.inv.short}</span>
                  <span className="num text-[15px]">{r.score.toFixed(0)}</span>
                </div>
                <div className="mt-1.5 h-1 bg-wash">
                  <div className="h-1 bg-[#8a929d]" style={{ width: `${r.score}%` }} />
                </div>
                <div className="mt-1.5 truncate text-[12px] text-muted">{plainReason(r, habitat)}</div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
