import type { Investigation } from "@/lib/types";
import { fmtRange } from "@/lib/format";

const FIELDS: { label: string; get: (i: Investigation) => string }[] = [
  { label: "Name", get: (i) => i.name },
  { label: "Fuel type", get: (i) => i.fuelType },
  { label: "Fuels", get: (i) => i.fuels.join(", ") || "not reported" },
  { label: "Sample", get: (i) => i.sample ?? "not reported" },
  { label: "O2", get: (i) => fmtRange(i.conditions.o2Pct, "%") },
  { label: "Pressure", get: (i) => fmtRange(i.conditions.pressurePsia, "psia") },
  { label: "Flow", get: (i) => fmtRange(i.conditions.flowCmS, "cm/s") },
  { label: "Diluents", get: (i) => i.conditions.diluents.join(", ") || "not reported" },
  { label: "Gravity", get: (i) => i.conditions.gravity },
  { label: "Pillars", get: (i) => i.pillars.join(", ") || "not reported" },
  { label: "Flight or ground", get: (i) => i.kind },
  { label: "Platform", get: (i) => i.platform },
  { label: "Measurements", get: (i) => i.measurements.join(", ") || "not reported" },
  { label: "Tests", get: (i) => (i.testCount === null ? "not reported" : String(i.testCount)) },
  { label: "Findings", get: (i) => i.findings.map((f) => f.text).join(" ") || "none recorded" },
  { label: "Confidence", get: (i) => i.confidence },
];

export default function Compare({ items, onClose }: { items: Investigation[]; onClose: () => void }) {
  return (
    <section className="panel" aria-labelledby="cmp-h">
      <div className="panel-head">
        <h2 id="cmp-h">Compare: {items.map((i) => i.short).join(" / ")}</h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted"><i className="mr-1 inline-block h-2 w-2 bg-amber" />rows that differ</span>
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="grid-table compare">
          <thead>
            <tr>
              <th scope="col">Field</th>
              {items.map((i) => <th key={i.id} scope="col">{i.short}</th>)}
            </tr>
          </thead>
          <tbody>
            {FIELDS.map((f) => {
              const vals = items.map(f.get);
              const differs = new Set(vals).size > 1;
              return (
                <tr key={f.label} className={differs ? "diff" : ""}>
                  <th scope="row" className="font-medium text-muted">{f.label}</th>
                  {vals.map((v, i) => <td key={items[i].id} className="max-w-[320px] align-top">{v}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
