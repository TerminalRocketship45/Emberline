"use client";

import { useMemo, useState } from "react";
import type { Investigation } from "@/lib/types";
import { fmtRange } from "@/lib/format";
import { FUEL_COLOR } from "@/lib/colors";

type SortKey = "short" | "fuelType" | "o2" | "p" | "kind" | "confidence";

const CONF_ORDER = { high: 0, medium: 1, low: 2 } as const;

function sortVal(i: Investigation, k: SortKey): string | number | null {
  switch (k) {
    case "short": return i.short.toLowerCase();
    case "fuelType": return i.fuelType;
    case "o2": return i.conditions.o2Pct ? i.conditions.o2Pct[0] : null;
    case "p": return i.conditions.pressurePsia ? i.conditions.pressurePsia[0] : null;
    case "kind": return i.kind;
    case "confidence": return CONF_ORDER[i.confidence];
  }
}

export default function Experiments({
  investigations,
  selected,
  setSelected,
  onOpen,
  onCompare,
}: {
  investigations: Investigation[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  onOpen: (id: string) => void;
  onCompare: () => void;
}) {
  const [key, setKey] = useState<SortKey>("short");
  const [dir, setDir] = useState<1 | -1>(1);
  const rows = useMemo(
    () =>
      [...investigations].sort((a, b) => {
        const x = sortVal(a, key);
        const y = sortVal(b, key);
        if (x === null && y === null) return 0;
        if (x === null) return 1;
        if (y === null) return -1;
        return (x < y ? -1 : x > y ? 1 : 0) * dir;
      }),
    [investigations, key, dir],
  );
  const head = (k: SortKey, label: string) => (
    <th scope="col" aria-sort={key === k ? (dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className="font-medium uppercase tracking-wide hover:text-ink"
        onClick={() => {
          if (key === k) setDir((d) => (d === 1 ? -1 : 1));
          else {
            setKey(k);
            setDir(1);
          }
        }}
      >
        {label}
        {key === k ? (dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
  const toggle = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter((s) => s !== id));
    else if (selected.length < 3) setSelected([...selected, id]);
  };
  return (
    <section className="panel" aria-labelledby="exp-h">
      <div className="panel-head">
        <h2 id="exp-h">All investigations (N = {investigations.length})</h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted">Select up to 3 to compare</span>
          <button type="button" className="btn" disabled={selected.length < 2} onClick={onCompare}>
            Compare {selected.length}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="grid-table">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Select</span></th>
              {head("short", "Short")}
              <th scope="col">Name</th>
              {head("fuelType", "Fuel type")}
              <th scope="col">Fuels</th>
              {head("o2", "O2 range")}
              {head("p", "Pressure range")}
              <th scope="col">Flow</th>
              <th scope="col">Sample</th>
              <th scope="col">Diluents</th>
              <th scope="col">Sensors</th>
              <th scope="col">Pillars</th>
              {head("kind", "Flight / ground")}
              {head("confidence", "Confidence")}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className={selected.includes(i.id) ? "bg-wash" : ""}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Compare ${i.short}`}
                    checked={selected.includes(i.id)}
                    disabled={!selected.includes(i.id) && selected.length >= 3}
                    onChange={() => toggle(i.id)}
                  />
                </td>
                <td>
                  <button type="button" className="font-medium text-steel underline-offset-2 hover:underline" onClick={() => onOpen(i.id)}>
                    {i.short}
                  </button>
                </td>
                <td className="max-w-[260px] truncate" title={i.name}>{i.name}</td>
                <td>
                  <span className="inline-flex items-center gap-1">
                    <i className="inline-block h-2 w-2" style={{ background: FUEL_COLOR[i.fuelType] }} />
                    {i.fuelType}
                  </span>
                </td>
                <td className="max-w-[200px] truncate" title={i.fuels.join(", ")}>{i.fuels.join(", ") || "not reported"}</td>
                <td className="num">{fmtRange(i.conditions.o2Pct, "%")}</td>
                <td className="num">{fmtRange(i.conditions.pressurePsia, "psia")}</td>
                <td className="num">{fmtRange(i.conditions.flowCmS, "cm/s")}</td>
                <td className="max-w-[160px] truncate" title={i.sample ?? ""}>{i.sample ?? "not reported"}</td>
                <td className="max-w-[100px] truncate" title={i.conditions.diluents.join(", ")}>{i.conditions.diluents.join(", ") || "not reported"}</td>
                <td className="max-w-[160px] truncate" title={i.measurements.join(", ")}>{i.measurements.join(", ") || "not reported"}</td>
                <td>{i.pillars.join(", ") || "not reported"}</td>
                <td>{i.kind}</td>
                <td>{i.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
