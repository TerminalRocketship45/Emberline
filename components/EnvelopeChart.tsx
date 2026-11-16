"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Habitat, Investigation, TestPoint } from "@/lib/types";
import { AMBER, AMBER_FILL, FUEL_COLOR } from "@/lib/colors";
import { fmtRange } from "@/lib/format";
import { O2_AXIS, O2_HABITAT, P_AXIS, P_HABITAT } from "@/lib/site";
import { MISSING_TAG, missingAxis } from "@/lib/ranking";
import { N_LOW, P_EXP, P_REF_PSIA, VALID_O2, VALID_PSIA, X_REF } from "@/lib/model";

const Plot = dynamic(() => import("./PlotlyChart"), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center text-sm text-muted">Loading chart</div>,
});

function hexRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

const GREY = "#3A424C";
const MIST = "#6B7684";
const CONTOURS = [1.25, 1.5, 1.75];

interface Props {
  investigations: Investigation[];
  tests: TestPoint[];
  habitats: Habitat[];
  selected: Habitat;
  onOpen: (id: string) => void;
}

export default function EnvelopeChart({ investigations, tests, habitats, selected, onOpen }: Props) {
  const [full, setFull] = useState(false);
  const outside = selected.o2Pct > O2_HABITAT[1] || selected.pressurePsia > P_HABITAT[1];
  const wide = full || outside;
  const X = wide ? O2_AXIS : O2_HABITAT;
  const Y = wide ? P_AXIS : P_HABITAT;

  const { data, layout } = useMemo(() => {
    const traces: Plotly.Data[] = [];
    const shapes: Partial<Plotly.Shape>[] = [];
    const annotations: Partial<Plotly.Annotations>[] = [];
    const spanY = Y[1] - Y[0];
    const clampX = (v: number) => Math.min(Math.max(v, X[0]), X[1]);
    const clampY = (v: number) => Math.min(Math.max(v, Y[0]), Y[1]);

    const solidMax = Math.max(
      ...investigations.filter((i) => i.fuelType === "solid" && i.conditions.o2Pct).map((i) => i.conditions.o2Pct![1]),
    );
    if (Number.isFinite(solidMax) && solidMax < X[1]) {
      shapes.push({ type: "rect", x0: solidMax, x1: X[1], y0: Y[0], y1: Y[1], fillcolor: "rgba(0,114,178,0.045)", line: { width: 0 }, layer: "below" });
      shapes.push({ type: "line", x0: solidMax, x1: solidMax, y0: Y[0], y1: Y[1], line: { color: FUEL_COLOR.solid, width: 1.5, dash: "dash" }, layer: "above" });
      annotations.push({
        x: solidMax,
        y: Y[1],
        xanchor: "left",
        yanchor: "top",
        xshift: 6,
        yshift: -4,
        align: "left",
        showarrow: false,
        text: `<b>No solid-material test above ${solidMax}% O2</b><br>in these 24 PSI investigations`,
        font: { size: 10.5, color: FUEL_COLOR.solid },
      });
    }

    const curve = { x: [] as number[], y: [] as number[] };
    const ppO2 = (X_REF * P_REF_PSIA);
    for (let x = Math.max(X[0], 10); x <= X[1]; x += 0.5) {
      const p = ppO2 / (x / 100);
      if (p <= Y[1]) {
        curve.x.push(x);
        curve.y.push(p);
      }
    }
    traces.push({
      type: "scatter",
      mode: "lines",
      x: curve.x,
      y: curve.y,
      hoverinfo: "skip",
      line: { color: AMBER, width: 1.25, dash: "dot" },
    } as Plotly.Data);
    const lx = X[1] - 0.5;
    annotations.push({
      x: lx,
      y: ppO2 / (lx / 100),
      xanchor: "right",
      yanchor: "top",
      yshift: -6,
      showarrow: false,
      align: "left",
      text: "Same breathing O2 as ISS<br>(O2 partial pressure 3.1 psia)",
      font: { size: 9.5, color: AMBER },
    });

    CONTOURS.forEach((m) => {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let p = VALID_PSIA[0]; p <= VALID_PSIA[1] + 1e-9; p += 0.25) {
        const x = 100 * X_REF * Math.pow(m / Math.pow(p / P_REF_PSIA, P_EXP), 1 / N_LOW);
        if (x >= VALID_O2[0] && x <= VALID_O2[1]) {
          xs.push(x);
          ys.push(p);
        }
      }
      if (!xs.length) return;
      traces.push({
        type: "scatter",
        mode: "lines",
        x: xs,
        y: ys,
        hovertemplate: `${m}x ISS flame spread (estimate, lower bound)<extra></extra>`,
        line: { color: MIST, width: 1 },
      } as Plotly.Data);
      annotations.push({
        x: xs[xs.length - 1],
        y: ys[ys.length - 1],
        xanchor: "center",
        yanchor: "bottom",
        yshift: 1,
        showarrow: false,
        text: `${m}x`,
        font: { size: 9, color: MIST },
      });
    });

    const withBoth = investigations.filter((i) => i.conditions.o2Pct && i.conditions.pressurePsia);
    const labelSlots: { x: number; y: number }[] = [];
    withBoth
      .filter((i) => i.fuelType !== "solid")
      .forEach((i) => {
        const o = i.conditions.o2Pct!;
        const p = i.conditions.pressurePsia!;
        const col = FUEL_COLOR[i.fuelType];
        shapes.push({
          type: "rect",
          x0: o[0],
          x1: o[1],
          y0: p[0],
          y1: p[1],
          fillcolor: "rgba(0,0,0,0)",
          line: { color: hexRgba(col, 0.75), width: 0.75 },
          layer: "above",
        });
        let lx2 = clampX(o[0]) + 0.4;
        let ly2 = clampY(p[0]) + 0.02 * spanY;
        while (labelSlots.some((s) => Math.abs(s.x - lx2) < (X[1] - X[0]) * 0.1 && Math.abs(s.y - ly2) < spanY * 0.05)) {
          ly2 += spanY * 0.055;
        }
        labelSlots.push({ x: lx2, y: ly2 });
        if (lx2 < X[1] && ly2 < Y[1]) {
          annotations.push({
            x: lx2,
            y: ly2,
            xanchor: "left",
            yanchor: "bottom",
            showarrow: false,
            text: i.short,
            font: { size: 9.5, color: col },
          });
        }
        traces.push({
          type: "scatter",
          mode: "markers",
          x: [(clampX(o[0]) + clampX(o[1])) / 2],
          y: [(clampY(p[0]) + clampY(p[1])) / 2],
          customdata: [i.id],
          text: [`<b>${i.short}</b><br>${i.name}<br>O2 ${fmtRange(o, "%")}<br>Pressure ${fmtRange(p, "psia")}<br>${i.kind}`],
          hoverinfo: "text",
          marker: { size: 14, color: "rgba(0,0,0,0)" },
        } as Plotly.Data);
      });

    const solid = withBoth.filter((i) => i.fuelType === "solid");
    const pts = new Map<string, Investigation[]>();
    solid.forEach((i) => {
      const o = i.conditions.o2Pct!;
      const p = i.conditions.pressurePsia!;
      if (o[0] === o[1] && p[0] === p[1]) {
        const k = `${o[0]}|${p[0]}`;
        pts.set(k, [...(pts.get(k) ?? []), i]);
      } else {
        shapes.push({ type: "rect", x0: o[0], x1: o[1], y0: p[0], y1: p[1], fillcolor: hexRgba(FUEL_COLOR.solid, 0.12), line: { color: FUEL_COLOR.solid, width: 1.5 }, layer: "above" });
        annotations.push({ x: clampX(o[0]) + 0.3, y: clampY(p[1]) - 0.02 * spanY, xanchor: "left", yanchor: "top", showarrow: false, text: i.short, font: { size: 10, color: FUEL_COLOR.solid } });
      }
    });
    pts.forEach((group) => {
      const o = group[0].conditions.o2Pct![0];
      const p = group[0].conditions.pressurePsia![0];
      traces.push({
        type: "scatter",
        mode: "text+markers",
        x: [o],
        y: [p],
        customdata: [group[0].id],
        text: [group.map((g) => g.short).join(" / ")],
        textposition: "bottom left",
        textfont: { size: 10.5, color: FUEL_COLOR.solid },
        hovertemplate: group.map((g) => `<b>${g.short}</b><br>${g.name}<br>O2 ${fmtRange(g.conditions.o2Pct, "%")}, ${fmtRange(g.conditions.pressurePsia, "psia")}<extra></extra>`),
        marker: { symbol: "circle", size: 11, color: FUEL_COLOR.solid, line: { color: "#fff", width: 1 } },
      } as Plotly.Data);
    });

    const partial = investigations.filter((i) => {
      const m = missingAxis(i);
      return m === "o2" || m === "pressure";
    });
    const hx: number[] = [];
    const hy: number[] = [];
    const hid: string[] = [];
    const htext: string[] = [];
    const hcol: string[] = [];
    partial.forEach((i, k) => {
      const m = missingAxis(i)!;
      const col = FUEL_COLOR[i.fuelType];
      const isSolid = i.fuelType === "solid";
      const dashed = { color: isSolid ? col : hexRgba(col, 0.6), width: isSolid ? 1.25 : 0.75, dash: isSolid ? ("dash" as const) : ("dot" as const) };
      const r = (m === "pressure" ? i.conditions.o2Pct : i.conditions.pressurePsia)!;
      const pad = r[0] === r[1] ? (m === "pressure" ? 0.25 : 0.2) : 0;
      const lo = r[0] - pad;
      const hi = r[1] + pad;
      const note = `<b>${i.short}</b><br>${i.name}<br>O2 ${fmtRange(i.conditions.o2Pct, "%")}<br>Pressure ${fmtRange(i.conditions.pressurePsia, "psia")}<br><i>${MISSING_TAG[m]}: band spans the whole axis</i>`;
      if (m === "pressure") {
        shapes.push({ type: "rect", x0: lo, x1: hi, y0: Y[0], y1: Y[1], fillcolor: isSolid ? hexRgba(col, 0.1) : "rgba(0,0,0,0)", line: dashed, layer: "above" });
        hx.push(clampX((lo + hi) / 2));
        hy.push(Y[0] + spanY * (0.04 + 0.06 * k));
        if (isSolid && Math.abs(hi - solidMax) > 1)
          annotations.push({ x: clampX((lo + hi) / 2), y: Y[0] + spanY * (0.04 + 0.06 * k), xanchor: "left", yanchor: "middle", xshift: 8, showarrow: false, text: i.short, font: { size: 9.5, color: col } });
      } else {
        shapes.push({ type: "rect", x0: X[0], x1: X[1], y0: clampY(lo), y1: clampY(hi), fillcolor: "rgba(0,0,0,0)", line: dashed, layer: "above" });
        hx.push(X[1] - (X[1] - X[0]) * 0.05);
        hy.push((clampY(lo) + clampY(hi)) / 2);
      }
      hid.push(i.id);
      htext.push(note);
      hcol.push(col);
    });
    if (partial.length) {
      traces.push({
        type: "scatter",
        mode: "markers",
        x: hx,
        y: hy,
        customdata: hid,
        text: htext,
        hoverinfo: "text",
        marker: { symbol: "diamond-open", size: 8, color: hcol },
      } as Plotly.Data);
    }

    if (tests.length) {
      traces.push({
        type: "scatter",
        mode: "markers",
        x: tests.map((t) => t.o2Pct),
        y: tests.map((t) => t.pressurePsia),
        text: tests.map((t) => `${t.investigationId} ${t.testId}<br>${t.fuel}<br>O2 ${t.o2Pct} %, ${t.pressurePsia} psia, ${t.ignited === true ? "ignited" : t.ignited === false ? "no ignition" : "outcome not reported"}`),
        hoverinfo: "text",
        marker: { size: 3.5, color: tests.map((t) => (t.ignited ? AMBER_FILL : "#8A939E")), opacity: 0.35 },
      } as Plotly.Data);
    }

    const groups: Habitat[][] = [];
    habitats.forEach((h) => {
      const g = groups.find((a) => Math.abs(a[0].o2Pct - h.o2Pct) <= 1 && Math.abs(a[0].pressurePsia - h.pressurePsia) <= 0.5);
      if (g) g.push(h);
      else groups.push([h]);
    });
    groups.forEach((g, gi) => {
      const isSel = g.some((h) => h.id === selected.id);
      const h = g[0];
      traces.push({
        type: "scatter",
        mode: "text+markers",
        x: [h.o2Pct],
        y: [h.pressurePsia],
        text: [g.map((a) => a.shortName).join(" / ")],
        textposition: g.length > 1 ? "top left" : gi % 2 === 0 ? "top right" : "bottom right",
        textfont: { size: isSel ? 12 : 10.5, color: isSel ? AMBER : GREY, family: "IBM Plex Sans, sans-serif" },
        hovertemplate: g.map((a) => `${a.name}<br>${a.o2Pct} % O2, ${a.pressurePsia} psia, ${a.gravityG} g<extra></extra>`),
        marker: {
          symbol: isSel ? "diamond" : "x",
          size: isSel ? 14 : 9,
          color: isSel ? AMBER_FILL : GREY,
          line: { color: isSel ? "#fff" : GREY, width: isSel ? 1.5 : 1.75 },
        },
      } as Plotly.Data);
    });

    const axis = {
      gridcolor: "#ECEFF2",
      zeroline: false,
      linecolor: "#B9C0C8",
      mirror: true,
      ticks: "outside" as const,
    };
    const layout = {
      autosize: true,
      margin: { l: 46, r: 12, t: 8, b: 40 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "#FFFFFF",
      font: { family: "IBM Plex Sans, sans-serif", size: 11, color: "#3A424C" },
      shapes,
      annotations,
      showlegend: false,
      hovermode: "closest",
      transition: { duration: 400, easing: "cubic-in-out" },
      xaxis: { ...axis, title: { text: "Oxygen, % by volume", standoff: 6 }, range: X, dtick: wide ? 10 : 5 },
      yaxis: { ...axis, title: { text: "Total pressure, psia", standoff: 6 }, range: Y, dtick: wide ? 10 : 5 },
    } as Partial<Plotly.Layout>;
    return { data: traces, layout };
  }, [investigations, tests, habitats, selected, X, Y, wide]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-2 top-1 z-10 flex border border-line bg-white text-[11px]" role="group" aria-label="Axis range">
        {[
          { label: "Habitat view", on: !wide, set: false },
          { label: "Full range", on: wide, set: true },
        ].map((b) => (
          <button key={b.label} type="button" aria-pressed={b.on} onClick={() => setFull(b.set)} className={`px-2 py-0.5 ${b.on ? "bg-ink text-white" : "text-muted hover:bg-wash"}`}>
            {b.label}
          </button>
        ))}
      </div>
      <Plot
        data={data}
        layout={layout}
        config={{ displaylogo: false, responsive: true, modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"] }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
        onClick={(e: Plotly.PlotMouseEvent) => {
          const id = (e.points[0].customdata as unknown as string) ?? null;
          if (id && investigations.some((i) => i.id === id)) onOpen(id);
        }}
      />
    </div>
  );
}
