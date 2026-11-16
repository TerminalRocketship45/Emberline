import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { EvalItem, EvalResults } from "../lib/types";

const root = process.cwd();

function loadEnv() {
  try {
    for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const CHIPS = [
  "Is a 34% oxygen lunar habitat more flammable than the ISS?",
  "What did Saffire learn about large fires in microgravity?",
  "Does CO2 or helium suppress droplet flames better in microgravity?",
  "How small are smoke particles in microgravity and why does it matter for detectors?",
  "What fire data exist for lunar gravity, and what is still missing?",
  "How fast do flames spread over thin fabrics in space?",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnv();
  const pipelineUrl = new URL("../lib/analyst/pipeline.ts", import.meta.url).href;
  const mod = await import(pipelineUrl);
  const rd = (n: string) => JSON.parse(readFileSync(path.join(root, "data", n), "utf8"));
  mod.setData({
    corpus: rd("corpus.json"),
    sources: rd("sources.json"),
    habitats: rd("habitats.json"),
    investigations: rd("investigations.json"),
    cached: rd("cached_answers.json"),
  });
  const questions: { question: string; expectedIds: string[]; habitatId?: string }[] = JSON.parse(
    readFileSync(path.join(root, "data/eval_questions.json"), "utf8"),
  );
  const chips = process.argv.includes("--cache");
  const items: EvalItem[] = [];
  const models = new Map<string, number>();
  let precSum = 0;
  let recSum = 0;
  let unsup = 0;
  let sentTotal = 0;
  let hits = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    let res = await mod.ask(q.question, q.habitatId ?? "iss", { skipCache: true });
    if (res.mode === "extractive" && process.env.GEMINI_API_KEY) {
      await sleep(8000);
      res = await mod.ask(q.question, q.habitatId ?? "iss", { skipCache: true });
    }
    models.set(res.model ?? res.mode, (models.get(res.model ?? res.mode) ?? 0) + 1);
    const cited: string[] = Array.from(new Set(res.sentences.flatMap((s: { citations: string[] }) => s.citations)));
    const expanded = (id: string): string[] => {
      const p = res.passages[id];
      return p ? [id, p.sourceId, p.investigationId ?? ""].filter(Boolean) : [id];
    };
    const expected = new Set(q.expectedIds);
    const matched = cited.filter((c) => expanded(c).some((e) => expected.has(e)));
    const covered = q.expectedIds.filter((e) => cited.some((c) => expanded(c).includes(e)));
    const hit = covered.length > 0;
    const supported = res.sentences.filter((s: { supported: boolean }) => s.supported).length;
    precSum += cited.length ? matched.length / cited.length : 0;
    recSum += q.expectedIds.length ? covered.length / q.expectedIds.length : 0;
    unsup += res.sentences.length - supported;
    sentTotal += res.sentences.length;
    if (hit) hits++;
    items.push({
      question: q.question,
      expectedIds: q.expectedIds,
      citedIds: cited.map((c) => res.passages[c]?.investigationId ?? res.passages[c]?.sourceId ?? c),
      hit,
      supportedSentences: supported,
      totalSentences: res.sentences.length,
    });
    console.log(`${i + 1}/${questions.length} ${res.mode} ${res.model ?? "-"} hit=${hit} cited=${cited.length}`);
    if (i < questions.length - 1) await sleep(4000);
  }

  const n = questions.length;
  const topModel = Array.from(models.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
  const out: EvalResults = {
    runAt: new Date().toISOString(),
    model: topModel,
    framework: mod.FRAMEWORK,
    questions: n,
    sourceHitRate: Math.round((hits / n) * 1000) / 1000,
    citationPrecision: Math.round((precSum / n) * 1000) / 1000,
    citationRecall: Math.round((recSum / n) * 1000) / 1000,
    unsupportedRate: sentTotal ? Math.round((unsup / sentTotal) * 1000) / 1000 : 0,
    items,
  };
  writeFileSync(path.join(root, "data/eval_results.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ ...out, items: undefined, models: Object.fromEntries(models) }));

  if (chips) {
    const chipQs = CHIPS;
    const cached = [];
    for (const cq of chipQs) {
      const r = await mod.ask(cq, "iss", { skipCache: true });
      if (r.mode === "llm" && r.sentences.length > 0) cached.push({ question: cq, habitatId: "iss", answer: r });
      await sleep(4000);
    }
    writeFileSync(path.join(root, "data/cached_answers.json"), JSON.stringify(cached, null, 2));
    console.log(`cached ${cached.length}`);
  }
}

main();
