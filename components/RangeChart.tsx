"use client";

import { useEffect, useRef, useState } from "react";
import type { Habitat, Investigation } from "@/lib/types";
import { ACCENT, GREY_BAR } from "@/lib/colors";
import { HEADLINE_HABITATS, o2Rows, rangeText } from "@/lib/present";

const X_MIN = 10;
const X_MAX = 45;
const LEFT = 112;
const RIGHT = 84;
const STRIP = 58;
const ROW = 30;
const AXIS = 30;
const BAR = 10;

const INK = "#1b2129";
const MUTED = "#5a6572";
const LINE = "#8a929d";

export default function RangeChart({
  investigations,
  habitats,
  habitat,
  solidMax,
  onOpen,
}: {
  investigations: Investigation[];
  habitats: Habitat[];
  habitat: Habitat;
  solidMax: number;
  onOpen: (id: string) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(680);
  const [focused, setFocused] = useState<string | null>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(420, Math.floor(el.clientWidth))));
    ro.observe(el);
    setW(Math.max(420, Math.floor(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  const rows = o2Rows(investigations);
  const x1 = w - RIGHT;
  const xs = (v: number) => LEFT + ((Math.min(Math.max(v, X_MIN), X_MAX) - X_MIN) / (X_MAX - X_MIN)) * (x1 - LEFT);
  const plotH = rows.length * ROW;
  const H = STRIP + plotH + AXIS;
  const hovered = hover ? rows.find((r) => r.id === hover.id) : null;
  const lines = HEADLINE_HABITATS.map((h) => habitats.find((x) => x.id === h.id)).filter((h): h is Habitat => !!h);
  const anchor = (i: number) => (i === 0 ? "middle" : i === 1 ? "end" : "start");
  const dx = (i: number) => (i === 0 ? 0 : i === 1 ? -6 : 6);

  return (
    <div ref={wrap} className="relative w-full">
      <svg width={w} height={H} role="img" aria-label="Reported oxygen range of each NASA investigation, with the three habitat atmospheres marked" className="block">
        {solidMax < X_MAX && (
          <>
            <rect x={xs(solidMax)} y={STRIP} width={x1 - xs(solidMax)} height={plotH} fill={ACCENT} opacity={0.08} />
            <text x={xs(solidMax) + 6} y={13} fontSize={12} fill={MUTED}>No solid-material tests</text>
          </>
        )}
        {lines.map((h, i) => {
          const sel = h.id === habitat.id;
          const x = xs(h.o2Pct);
          return (
            <g key={h.id}>
              <line x1={x} x2={x} y1={STRIP - 6} y2={STRIP + plotH} stroke={sel ? ACCENT : LINE} strokeWidth={sel ? 1.75 : 1} strokeDasharray={sel ? undefined : "4 3"} />
              <text x={x + dx(i)} y={34} fontSize={12} textAnchor={anchor(i)} fill={sel ? INK : MUTED}>
                {HEADLINE_HABITATS[i].label}
              </text>
              <text x={x + dx(i)} y={50} fontSize={12} textAnchor={anchor(i)} fill={sel ? INK : MUTED}>
                {`${h.o2Pct}%`}
              </text>
            </g>
          );
        })}
        {rows.map((r, k) => {
          const [lo, hi] = r.conditions.o2Pct!;
          const cy = STRIP + k * ROW + ROW / 2;
          const solid = r.fuelType === "solid";
          const fill = solid ? ACCENT : GREY_BAR;
          const over = hi > X_MAX;
          const a = xs(lo);
          const b = xs(hi);
          const on = hover?.id === r.id;
          return (
            <g
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={`${r.short}, ${r.fuelType}, O2 ${rangeText(r.conditions.o2Pct, "%")}`}
              style={{ cursor: "pointer" }}
              aria-describedby="env-h"
              onClick={() => onOpen(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(r.id);
                }
              }}
              onMouseMove={(e) => {
                const box = wrap.current?.getBoundingClientRect();
                if (box) setHover({ id: r.id, x: e.clientX - box.left, y: e.clientY - box.top });
              }}
              onMouseLeave={() => setHover(null)}
              onFocus={() => { setFocused(r.id); setHover({ id: r.id, x: LEFT + 20, y: cy + 10 }); }}
              onBlur={() => { setFocused(null); setHover(null); }}
            >
              <rect x={1} y={cy - ROW / 2 + 1} width={w - 2} height={ROW - 2} fill={on ? "#eef0f3" : "transparent"} stroke={focused === r.id ? "#2f5d8a" : "none"} strokeWidth={2} />
              <line x1={LEFT} x2={x1} y1={cy} y2={cy} stroke="#e6e9ed" strokeWidth={1} />
              <text x={LEFT - 12} y={cy + 4} fontSize={12} textAnchor="end" fill={INK}>{r.short}</text>
              {hi === lo ? (
                <circle cx={a} cy={cy} r={5} fill={fill} />
              ) : (
                <rect x={a} y={cy - BAR / 2} width={Math.max(b - a, 2)} height={BAR} rx={2} fill={fill} />
              )}
              {over && <polygon points={`${x1},${cy - 6} ${x1 + 8},${cy} ${x1},${cy + 6}`} fill={fill} />}
              <text x={x1 + 16} y={cy + 4} fontSize={12} fill={MUTED}>
                {solid ? "" : r.fuelType}
                {over ? ` → ${hi}%` : ""}
              </text>
            </g>
          );
        })}
        <line x1={LEFT} x2={x1} y1={STRIP + plotH} y2={STRIP + plotH} stroke={LINE} strokeWidth={1} />
        {[10, 15, 20, 25, 30, 35, 40, 45].map((t) => (
          <g key={t}>
            <line x1={xs(t)} x2={xs(t)} y1={STRIP + plotH} y2={STRIP + plotH + (t % 10 === 0 ? 5 : 3)} stroke={LINE} />
            {t % 10 === 0 && (
              <text x={xs(t)} y={STRIP + plotH + 20} fontSize={12} textAnchor="middle" fill={MUTED} className="num">{`${t}%`}</text>
            )}
          </g>
        ))}
      </svg>
      {hovered && hover && (
        <div
          className="pointer-events-none absolute z-10 w-[250px] border border-line bg-white px-3 py-2 text-[12px] leading-snug"
          style={{ left: Math.min(hover.x + 14, Math.max(0, w - 260)), top: hover.y + 14 }}
          role="tooltip"
        >
          <div className="font-medium text-ink">{hovered.name}</div>
          <div className="num mt-1 text-muted">O2 {rangeText(hovered.conditions.o2Pct, "%")}</div>
          <div className="num text-muted">
            Pressure {hovered.conditions.pressurePsia ? rangeText(hovered.conditions.pressurePsia, " psia") : "not reported"}
          </div>
          <div className="text-muted">
            {hovered.testCount ?? "Unreported number of"} tests, {hovered.kind}
          </div>
        </div>
      )}
    </div>
  );
}
