"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppData } from "@/lib/data";
import { SITE_NAME, type Focus } from "@/lib/site";
import Envelope from "./Envelope";
import Experiments from "./Experiments";
import Compare from "./Compare";
import Drawer from "./Drawer";
import Method from "./Method";
import { HEADLINE_HABITATS } from "@/lib/present";
import AnalystSlot from "./AnalystSlot";

const TABS = ["Envelope", "Experiments", "Analyst", "Method"] as const;
type Tab = (typeof TABS)[number];

export default function Dashboard({ data }: { data: AppData }) {
  const { investigations, habitats, sources, tests, evalResults } = data;
  const [tab, setTab] = useState<Tab>("Envelope");
  const [habitatId, setHabitatId] = useState(habitats.find((h) => h.id === "exploration")?.id ?? habitats[0]?.id ?? "");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    const down = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [moreOpen]);
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

  const primary = HEADLINE_HABITATS.map((h) => ({ ...h, habitat: habitats.find((x) => x.id === h.id) })).filter((h) => h.habitat);
  const extra = habitats.filter((h) => !HEADLINE_HABITATS.some((p) => p.id === h.id));
  const extraOn = extra.some((h) => h.id === habitat.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col">
      <header className="border-b border-line bg-white px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-3">
          <h1 className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber" aria-hidden="true" />
            {SITE_NAME}
          </h1>
          <div className="flex items-center gap-2" role="group" aria-label="Habitat">
            <div className="seg">
              {primary.map((h) => (
                <button key={h.id} type="button" aria-pressed={habitat.id === h.id} title={`${h.habitat!.o2Pct}% O2, ${h.habitat!.pressurePsia} psia`} onClick={() => setHabitatId(h.id)} className={`seg-b ${habitat.id === h.id ? "seg-on" : ""}`}>
                  {h.label}
                </button>
              ))}
            </div>
            {extra.length > 0 && (
              <div className="relative" ref={moreRef}>
                <button type="button" aria-label="More habitats" title="More habitats" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)} className={`seg-b border border-line ${extraOn ? "seg-on" : ""}`}>
                  {extraOn ? habitat.shortName : "\u22ef"}
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] border border-line bg-white py-1">
                    {extra.map((h) => (
                      <button key={h.id} type="button" aria-pressed={habitat.id === h.id} onClick={() => { setHabitatId(h.id); setMoreOpen(false); }} className="block w-full px-3 py-1.5 text-left text-[12px] hover:bg-wash">
                        {h.shortName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1" role="tablist" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t} type="button" role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls="panel" tabIndex={tab === t ? 0 : -1} onKeyDown={(e) => { const k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (k) { const n = TABS[(TABS.indexOf(t) + k + TABS.length) % TABS.length]; setTab(n); document.getElementById(`tab-${n}`)?.focus(); } }} onClick={() => setTab(t)} className={`tab ${tab === t ? "tab-on" : ""}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main id="panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex-1 px-6 py-6">
        {tab === "Envelope" && (
          <Envelope investigations={investigations} habitats={habitats} habitat={habitat} focus={focus} setFocus={setFocus} sources={sources} onOpen={open} />
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
          <section className="analyst-skin mx-auto w-full max-w-[880px]" aria-label="Analyst">
            <AnalystSlot habitatId={habitat.id} />
          </section>
        )}
        {tab === "Method" && <Method investigations={investigations} sources={sources} tests={tests} evalResults={evalResults} />}
      </main>
      <Drawer inv={openInv} all={investigations} sources={srcMap} onClose={close} onOpen={open} />
    </div>
  );
}
