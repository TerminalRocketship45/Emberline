"use client";

import { useCallback, useMemo, useState } from "react";
import type { AppData } from "@/lib/data";
import { FOCUS_OPTIONS, SITE_NAME, SITE_PURPOSE, type Focus } from "@/lib/site";
import Envelope from "./Envelope";
import Experiments from "./Experiments";
import Compare from "./Compare";
import Drawer from "./Drawer";
import Method from "./Method";
import AnalystSlot from "./AnalystSlot";

const TABS = ["Envelope", "Experiments", "Analyst", "Method"] as const;
type Tab = (typeof TABS)[number];

export default function Dashboard({ data }: { data: AppData }) {
  const { investigations, habitats, sources, tests, evalResults } = data;
  const [tab, setTab] = useState<Tab>("Envelope");
  const [habitatId, setHabitatId] = useState(habitats[0]?.id ?? "");
  const [focus, setFocus] = useState<Focus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const habitat = habitats.find((h) => h.id === habitatId) ?? habitats[0];
  const srcMap = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const open = useCallback((id: string) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);
  const openInv = investigations.find((i) => i.id === openId) ?? null;

  if (!habitat) {
    return <main className="p-6 text-sm text-muted">Data files are not available yet.</main>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col">
      <header className="border-b border-line bg-white px-4 pb-0 pt-1.5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="min-w-0 flex-1 basis-[360px]">
            <h1 className="flex items-center gap-2 text-[17px] font-medium leading-tight">
              <span className="inline-block h-3 w-1 bg-amber" aria-hidden="true" />
              {SITE_NAME}
            </h1>
            <p className="text-[12px] leading-snug text-muted">{SITE_PURPOSE}</p>
          </div>
          <label className="field">
            <span>Habitat</span>
            <select value={habitat.id} onChange={(e) => setHabitatId(e.target.value)}>
              {habitats.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.shortName} ({h.o2Pct}% O2, {h.pressurePsia} psia, {h.gravityG} g)
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Focus</span>
            <select value={focus} onChange={(e) => setFocus(e.target.value as Focus)}>
              {FOCUS_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="-mb-2 mt-1 flex gap-1" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls="panel" tabIndex={tab === t ? 0 : -1} onKeyDown={(e) => { const k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (k) { const n = TABS[(TABS.indexOf(t) + k + TABS.length) % TABS.length]; setTab(n); document.getElementById(`tab-${n}`)?.focus(); } }} onClick={() => setTab(t)} className={`tab ${tab === t ? "tab-on" : ""}`}>
              {t}
            </button>
          ))}
        </div>
      </header>
      <main id="panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex-1 p-3">
        {tab === "Envelope" && (
          <Envelope investigations={investigations} tests={tests} habitats={habitats} habitat={habitat} focus={focus} sources={sources} onOpen={open} />
        )}
        {tab === "Experiments" && (
          <div className="flex flex-col gap-3">
            {comparing && selected.length >= 2 && (
              <Compare items={selected.map((id) => investigations.find((i) => i.id === id)!).filter(Boolean)} onClose={() => setComparing(false)} />
            )}
            <Experiments investigations={investigations} selected={selected} setSelected={(s) => { setSelected(s); if (s.length < 2) setComparing(false); }} onOpen={open} onCompare={() => setComparing(true)} />
          </div>
        )}
        {tab === "Analyst" && (
          <section className="panel" aria-label="Analyst">
            <AnalystSlot habitatId={habitat.id} />
          </section>
        )}
        {tab === "Method" && <Method investigations={investigations} sources={sources} tests={tests} evalResults={evalResults} />}
      </main>
      <Drawer inv={openInv} all={investigations} sources={srcMap} onClose={close} onOpen={open} />
    </div>
  );
}
