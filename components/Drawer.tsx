"use client";

import { useEffect, useRef } from "react";
import type { Investigation, Source } from "@/lib/types";
import { doiUrl, fmtRange } from "@/lib/format";

function SourceLinks({ ids, sources }: { ids: string[]; sources: Map<string, Source> }) {
  return (
    <span className="inline-flex flex-wrap gap-x-2">
      {ids.map((id) => {
        const s = sources.get(id);
        const href = s?.doi ? doiUrl(s.doi) : s?.url ?? null;
        const label = s ? `${s.authors ? s.authors.split(",")[0] + " " : ""}${s.year ?? ""}`.trim() || s.title : id;
        return href ? (
          <a key={id} href={href} target="_blank" rel="noreferrer" className="text-steel underline underline-offset-2">
            [{label}]
          </a>
        ) : (
          <span key={id} className="text-muted">[{label}]</span>
        );
      })}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-2">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-[13px] leading-snug">{children}</div>
    </div>
  );
}

export default function Drawer({
  inv,
  all,
  sources,
  onClose,
  onOpen,
}: {
  inv: Investigation | null;
  all: Investigation[];
  sources: Map<string, Source>;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(null);
  const isOpen = inv !== null;
  useEffect(() => {
    if (!isOpen) return;
    opener.current = document.activeElement;
    const node = ref.current;
    node?.querySelector<HTMLElement>("button")?.focus();
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const f = node.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)");
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [isOpen, onClose]);
  if (!inv) return null;
  const byId = new Map(all.map((i) => [i.id, i]));
  const link = (id: string) => {
    const t = byId.get(id);
    return (
      <button key={id} type="button" className="chip" onClick={() => onOpen(id)}>
        {t ? t.short : id}
      </button>
    );
  };
  const c = inv.conditions;
  return (
    <aside ref={ref} aria-modal="true" className="fixed inset-y-0 right-0 z-30 w-full max-w-[480px] overflow-y-auto border-l border-line bg-white" role="dialog" aria-label={`${inv.short} details`}>
      <div className="sticky top-0 flex items-start justify-between gap-2 border-b border-line bg-white px-4 py-3">
        <div>
          <div className="text-[11px] text-muted">{inv.kind} / {inv.fuelType} / confidence {inv.confidence}</div>
          <h2 className="text-base font-medium">{inv.short}</h2>
          <p className="text-[12.5px] text-muted">{inv.name}</p>
        </div>
        <button type="button" className="btn" onClick={onClose}>Close</button>
      </div>
      <div className="px-4 pb-8">
        <Row label="Objective">{inv.objective}</Row>
        <Row label="Approach">{inv.approach ?? "not reported"}</Row>
        <Row label="Sample">{inv.sample ?? "not reported"}</Row>
        <Row label="Conditions">
          <dl className="num grid grid-cols-[110px_1fr] gap-y-0.5 text-[12.5px]">
            <dt className="text-muted">O2</dt><dd>{fmtRange(c.o2Pct, "%")}</dd>
            <dt className="text-muted">Pressure</dt><dd>{fmtRange(c.pressurePsia, "psia")}</dd>
            <dt className="text-muted">Flow</dt><dd>{fmtRange(c.flowCmS, "cm/s")}</dd>
            <dt className="text-muted">Diluents</dt><dd>{c.diluents.join(", ") || "not reported"}</dd>
            <dt className="text-muted">Gravity</dt><dd>{c.gravity}</dd>
            <dt className="text-muted">Tests</dt><dd>{inv.testCount ?? "not reported"}</dd>
          </dl>
          <div className="mt-1 text-[11px] text-muted">Source: <SourceLinks ids={c.sourceIds} sources={sources} /></div>
        </Row>
        <Row label="Measurements">{inv.measurements.join(", ") || "not reported"}</Row>
        <Row label="Findings">
          {inv.findings.length === 0 && <span className="text-muted">No findings recorded.</span>}
          <ul className="space-y-2">
            {inv.findings.map((f) => (
              <li key={f.id}>
                {f.text}
                {f.value && <span className="num font-medium"> ({f.value})</span>}{" "}
                <SourceLinks ids={f.sourceIds} sources={sources} />
                {!f.verified && <span className="tag ml-1">unverified</span>}
              </li>
            ))}
          </ul>
        </Row>
        <Row label="Habitat relevance">{inv.habitatRelevance ?? "not reported"}</Row>
        <Row label="PSI record">
          <a href={inv.psiUrl} target="_blank" rel="noreferrer" className="text-steel underline underline-offset-2">{inv.psiUrl}</a>
          {inv.psiDoi && <> <a href={doiUrl(inv.psiDoi)} target="_blank" rel="noreferrer" className="text-steel underline underline-offset-2">doi:{inv.psiDoi}</a></>}
          <div className="text-[11px] text-muted">{inv.platform}; {inv.hardware}{inv.years ? `; ${inv.years}` : ""}</div>
        </Row>
        <Row label="Related and reuse lineage">
          <div className="flex flex-wrap items-center gap-1">
            {inv.relatedIds.length === 0 && inv.reusesDataFrom.length === 0 && <span className="text-muted">None recorded.</span>}
            {inv.relatedIds.map(link)}
          </div>
          {inv.reusesDataFrom.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="text-[12px] text-muted">Reuses data from:</span>
              {inv.reusesDataFrom.map(link)}
            </div>
          )}
          {all.filter((o) => o.reusesDataFrom.includes(inv.id)).length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="text-[12px] text-muted">Data reused by:</span>
              {all.filter((o) => o.reusesDataFrom.includes(inv.id)).map((o) => link(o.id))}
            </div>
          )}
        </Row>
      </div>
    </aside>
  );
}
