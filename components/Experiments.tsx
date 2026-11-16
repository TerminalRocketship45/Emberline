"use client";

import { useMemo, useState } from "react";
import type { FuelType, Investigation } from "@/lib/types";
import { rangeText } from "@/lib/present";
import { ACCENT, GREY_BAR } from "@/lib/colors";

type SortKey = "short" | "fuelType" | "o2" | "p" | "kind";
type FuelFilter = "all" | FuelType;
type KindFilter = "all" | "flight" | "ground";

function sortVal(i: Investigation, k: SortKey): string | number | null {
  switch (k) {
    case "short": return i.short.toLowerCase();
    case "fuelType": return i.fuelType;
    case "o2": return i.conditions.o2Pct ? i.conditions.o2Pct[0] : null;
    case "p": return i.conditions.pressurePsia ? i.conditions.pressurePsia[0] : null;
    case "kind": return i.kind;
  }
}

const NR = (
  <span className="text-muted" title="not reported">
    {"—"}
  </span>
);

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
  const [q, setQ] = useState("");
  const [fuel, setFuel] = useState<FuelFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return investigations
      .filter((i) => fuel === "all" || i.fuelType === fuel)
      .filter((i) => kind === "all" || i.kind === kind)
      .filter((i) => !needle || `${i.short} ${i.name} ${i.id}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        const x = sortVal(a, key);
        const y = sortVal(b, key);
        if (x === null && y === null) return 0;
        if (x === null) return 1;
        if (y === null) return -1;
        return (x < y ? -1 : x > y ? 1 : 0) * dir;
      });
  }, [investigations, key, dir, q, fuel, kind]);
  const head = (k: SortKey, label: string) => (
    <th scope="col" aria-sort={key === k ? (dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className="hover:text-ink"
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
  const chips = <T extends string>(opts: readonly T[], value: T, set: (v: T) => void, label: string) => (
    <div className="flex gap-1.5" role="group" aria-label={label}>
      {opts.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => set(o)} className={`pill capitalize ${value === o ? "pill-on" : ""}`}>
          {o}
        </button>
      ))}
    </div>
  );
  return (
    <section className="mx-auto w-full max-w-[1100px]" aria-labelledby="exp-h">
      <h2 id="exp-h" className="text-[15px] font-semibold">Investigations</h2>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search investigations"
          aria-label="Search investigations"
          className="w-[260px] border border-line bg-white px-3 py-1.5 text-[13px]"
        />
        {chips(["all", "solid", "liquid", "gas"] as const, fuel, setFuel, "Fuel type")}
        {chips(["all", "flight", "ground"] as const, kind, setKind, "Flight or ground")}
        <div className="ml-auto flex items-center gap-3">
          {selected.length > 0 && <span className="text-[12px] text-muted">{selected.length} selected</span>}
          <button type="button" className="btn" disabled={selected.length < 2} onClick={onCompare}>
            Compare
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto border border-line bg-white">
        <table className="grid-table roomy">
          <thead>
            <tr>
              <th scope="col" className="w-10"><span className="sr-only">Select</span></th>
              {head("short", "Investigation")}
              {head("fuelType", "Fuel")}
              {head("o2", "O2 range")}
              {head("p", "Pressure")}
              {head("kind", "Type")}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className={`cursor-pointer hover:bg-wash ${selected.includes(i.id) ? "bg-wash" : ""}`} onClick={() => onOpen(i.id)}>
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Compare ${i.short}`}
                    checked={selected.includes(i.id)}
                    disabled={!selected.includes(i.id) && selected.length >= 3}
                    onChange={() => toggle(i.id)}
                  />
                </td>
                <td>
                  <button type="button" className="text-left text-[14px] font-medium" onClick={(e) => { e.stopPropagation(); onOpen(i.id); }}>
                    {i.short}
                  </button>
                  <div className="max-w-[480px] truncate text-[12px] text-muted" title={i.name}>{i.name}</div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-2">
                    <i className="inline-block h-2 w-2 rounded-full" style={{ background: i.fuelType === "solid" ? ACCENT : GREY_BAR }} />
                    <span className="capitalize">{i.fuelType}</span>
                  </span>
                </td>
                <td className="num">{i.conditions.o2Pct ? rangeText(i.conditions.o2Pct, "%") : NR}</td>
                <td className="num">{i.conditions.pressurePsia ? rangeText(i.conditions.pressurePsia, " psia") : NR}</td>
                <td className="capitalize">{i.kind}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-muted">No investigations match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
