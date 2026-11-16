import type { Habitat, Investigation } from "@/lib/types";
import type { Focus } from "@/lib/site";
import { MISSING_TAG, WEIGHTS, rank } from "@/lib/ranking";
import { useMemo, useState } from "react";

const SEG = [
  { key: "proximity", label: "Conditions", color: "#2F5D8A" },
  { key: "fuel", label: "Fuel", color: "#6F94B8" },
  { key: "pillar", label: "Pillar", color: "#B8620A" },
  { key: "flight", label: "Flight", color: "#E0A867" },
] as const;

export default function Ranking({
  investigations,
  habitat,
  focus,
  onOpen,
}: {
  investigations: Investigation[];
  habitat: Habitat;
  focus: Focus;
  onOpen: (id: string) => void;
}) {
  const [all, setAll] = useState(false);
  const rows = useMemo(() => rank(investigations, habitat, focus).slice(0, all ? 8 : 5), [investigations, habitat, focus, all]);
  return (
    <section className="panel" aria-labelledby="rank-h">
      <div className="panel-head">
        <h2 id="rank-h">Most relevant investigations</h2>
        <span className="text-[11px] text-muted">score 0 to 100</span>
      </div>
      <div className="flex flex-wrap gap-x-3 px-3 pb-1 text-[10px] text-muted">
        {SEG.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <i className="inline-block h-2 w-2" style={{ background: s.color }} />
            {s.label} {WEIGHTS[s.key] * 100}%
          </span>
        ))}
      </div>
      <ol className="divide-y divide-line">
        {rows.map((r, idx) => (
          <li key={r.inv.id}>
            <button type="button" onClick={() => onOpen(r.inv.id)} className="block w-full px-3 py-1 text-left hover:bg-wash focus-visible:outline-2 focus-visible:outline-steel" title={r.why}>
              <div className="flex items-center gap-2">
                <span className="num w-4 text-[11px] text-muted">{idx + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{r.inv.short}</span>
                {r.missing && <span className="tag">{MISSING_TAG[r.missing]}</span>}
                <span className="num w-8 text-right text-[12.5px]">{r.score.toFixed(0)}</span>
              </div>
              <div className="ml-6 mt-0.5 flex h-1.5 border border-line bg-white">
                {SEG.map((s) => (
                  <div key={s.key} style={{ width: `${WEIGHTS[s.key] * r.parts[s.key] * 100}%`, background: s.color }} />
                ))}
              </div>
              <div className="ml-6 truncate text-[10.5px] text-muted">{r.why}</div>
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="w-full border-t border-line py-1 text-[11.5px] text-steel hover:bg-wash" onClick={() => setAll((v) => !v)}>
        {all ? "Show top 5" : "Show top 8"}
      </button>
    </section>
  );
}
