import type { AnswerSentence, CorpusChunk, Habitat, Investigation, Source } from "../types";
import type { AskResponse, PassageInfo } from "./types";
import { estimateSpread } from "../model";

export interface Doc {
  id: string;
  text: string;
}

const STOP = new Set(
  "a an the of in on to and or is are was were be been it its for with as at by from that this these those what which who how why when where does do did can could would should than then there their into about over under between during not no vs".split(
    " ",
  ),
);

export function tokenize(s: string): string[] {
  const out: string[] = [];
  for (const raw of s.toLowerCase().split(/[^a-z0-9.%]+/)) {
    const t = raw.replace(/^\.+|\.+$/g, "");
    if (!t || STOP.has(t)) continue;
    out.push(stem(t));
  }
  return out;
}

function stem(t: string): string {
  if (t.length > 5 && t.endsWith("ing")) return t.slice(0, -3);
  if (t.length > 4 && t.endsWith("es")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

export class BM25 {
  private tf: Map<string, number>[] = [];
  private len: number[] = [];
  private df = new Map<string, number>();
  private avg = 0;

  private docs: Doc[];
  private k1 = 1.5;
  private b = 0.75;

  constructor(docs: Doc[]) {
    this.docs = docs;
    let total = 0;
    for (const d of docs) {
      const toks = tokenize(d.text);
      const m = new Map<string, number>();
      for (const t of toks) m.set(t, (m.get(t) ?? 0) + 1);
      for (const t of m.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.tf.push(m);
      this.len.push(toks.length);
      total += toks.length;
    }
    this.avg = total / Math.max(1, docs.length);
  }

  score(query: string): { id: string; score: number; index: number }[] {
    const q = Array.from(new Set(tokenize(query)));
    const n = this.docs.length;
    const res: { id: string; score: number; index: number }[] = [];
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (const t of q) {
        const f = this.tf[i].get(t);
        if (!f) continue;
        const df = this.df.get(t) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        s += (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * this.len[i]) / this.avg));
      }
      res.push({ id: this.docs[i].id, score: s, index: i });
    }
    return res.sort((a, b) => b.score - a.score);
  }
}

export const FRAMEWORK =
  "In-Context Retrieval-Augmented Language Modeling (Ram et al., 2023, TACL, arXiv:2302.00083) with ALCE-style citation generation and evaluation (Gao et al., 2023, EMNLP, arXiv:2305.14627)";

export const TOP_K = 8;
const TOTAL_BUDGET_MS = 40000;

interface Store {
  chunks: CorpusChunk[];
  sources: Map<string, Source>;
  habitats: Map<string, Habitat>;
  investigations: Investigation[];
  bm25: BM25;
  cached: CachedEntry[];
}

export interface CachedEntry {
  question: string;
  habitatId: string;
  answer: AskResponse;
}

export interface AnalystData {
  corpus: CorpusChunk[];
  sources: Source[];
  habitats: Habitat[];
  investigations: Investigation[];
  cached: CachedEntry[];
}

let store: Store | null = null;

export function setData(d: AnalystData): void {
  for (const [name, v] of Object.entries(d)) {
    if (!Array.isArray(v)) throw new Error(`analyst data "${name}" is missing or not an array`);
  }
  if (d.corpus.length === 0) throw new Error("analyst corpus is empty");
  store = {
    chunks: d.corpus,
    sources: new Map(d.sources.map((x) => [x.id, x])),
    habitats: new Map(d.habitats.map((h) => [h.id, h])),
    investigations: d.investigations,
    bm25: new BM25(d.corpus.map((c) => ({ id: c.id, text: `${c.title} ${c.text}` }))),
    cached: d.cached,
  };
}

function loadStore(): Store {
  if (!store) throw new Error("analyst data not initialised");
  return store;
}

export interface Retrieval {
  passages: CorpusChunk[];
  scores: Map<string, number>;
}

const MODEL_FINDING_ID = "chunk-f-spread-multiplier";

function fmtMult(x: number): string {
  return (Math.round(x * 100) / 100).toFixed(2);
}

function containsPoint(inv: Investigation, h: Habitat) {
  const c = inv.conditions;
  return {
    o2: !!c.o2Pct && h.o2Pct >= c.o2Pct[0] - 1e-9 && h.o2Pct <= c.o2Pct[1] + 1e-9,
    p: !!c.pressurePsia && h.pressurePsia >= c.pressurePsia[0] - 1e-9 && h.pressurePsia <= c.pressurePsia[1] + 1e-9,
  };
}

function coverageText(h: Habitat, investigations: Investigation[]): string {
  const fuels = ["solid", "liquid", "gas"] as const;
  const both: string[] = [];
  const partial: string[] = [];
  for (const f of fuels) {
    const inFuel = investigations.filter((i) => i.fuelType === f);
    const b = inFuel.filter((i) => {
      const r = containsPoint(i, h);
      return r.o2 && r.p;
    });
    const o = inFuel.filter((i) => {
      const r = containsPoint(i, h);
      return (r.o2 || r.p) && !(r.o2 && r.p);
    });
    if (b.length) both.push(`${f} fuels: ${b.map((i) => i.id).join(", ")}`);
    if (o.length) partial.push(`${f} fuels: ${o.map((i) => i.id).join(", ")}`);
  }
  const first = both.length
    ? `PSI investigations whose tested O2 and pressure ranges both contain this atmosphere (${both.join("; ")}); these are separate O2 and pressure ranges, not confirmed tests at this exact pair.`
    : `No PSI investigation with reported O2 and pressure ranges contains both ${h.o2Pct}% O2 and ${h.pressurePsia} psia.`;
  const second = partial.length ? ` Investigations whose range contains only one of the two (${partial.join("; ")}).` : "";
  return first + second;
}

function habitatChunk(h: Habitat, investigations: Investigation[]): CorpusChunk {
  const est = estimateSpread(h.o2Pct, h.pressurePsia);
  const band =
    est.kind === "reference"
      ? "Spread-rate multiplier versus ISS air: the multiplier is 1, reference air."
      : est.kind === "out-of-range"
        ? "This atmosphere is outside the correlation's valid range (21 to 40% O2, 0.5 to 1 atm), so no spread estimate is given."
        : `Estimated spread-rate multiplier versus ISS air (21% O2, 14.7 psia), from the opposed-flow correlation Vf proportional to X_O2^n times P^0.05 with n between 0.9 and 1.25: about ${fmtMult(est.low)} to ${fmtMult(est.high)} times. This is a model estimate, not a measurement, valid for thin fabrics at 21 to 40% O2 and 0.5 to 1 atm; its source is passage ${MODEL_FINDING_ID}.`;
  return {
    id: `habitat:${h.id}`,
    investigationId: null,
    sourceId: h.sourceIds[0] ?? "",
    title: `Selected habitat: ${h.name}`,
    text: `${h.name}: ${h.o2Pct}% oxygen, ${h.pressurePsia} psia total pressure, ${h.gravityG} g gravity. ${h.note} ${band} ${coverageText(h, investigations)}`,
  };
}

const COMPARE_RE = /compar|flammab|dangerous|safer|safe\b|riskier|worse|versus|\bvs\b|more fire|fire risk/i;
const COMPARE_IDS = ["chunk-f-o2-fraction", "chunk-f-test1-not-conservative", "chunk-f-spread-multiplier", "chunk-f-exploration-atmosphere"];

function inRange(v: number, r: [number, number] | null): boolean {
  return !!r && v >= r[0] - 1e-9 && v <= r[1] + 1e-9;
}

const SYNONYMS: [RegExp, string][] = [
  [/suppress|extinguish|put out|quench/i, "limiting oxygen index FLEX CO2 helium inert diluent"],
  [/moon|lunar/i, "lunar gravity partial gravity 0.16 g Ferkul SIBAL FM2 exploration atmosphere"],
];

function expandQuery(question: string): string {
  const extra = SYNONYMS.filter(([re]) => re.test(question)).map(([, t]) => t);
  return [question, ...extra].join(" ");
}

export async function retrieve(question: string, habitatId: string, k = TOP_K): Promise<Retrieval> {
  const store = loadStore();
  const habitat = store.habitats.get(habitatId);
  const matching = new Set<string>();
  if (habitat) {
    for (const inv of store.investigations) {
      const c = inv.conditions;
      if (inRange(habitat.o2Pct, c.o2Pct) || inRange(habitat.pressurePsia, c.pressurePsia)) matching.add(inv.id);
    }
  }
  const ranked = store.bm25.score(expandQuery(question)).filter((r) => r.score > 0);
  const boosted = ranked
    .map((r) => {
      const c = store.chunks[r.index];
      const boost = c.investigationId && matching.has(c.investigationId) ? 1.15 : 1;
      return { c, score: r.score * boost };
    })
    .sort((a, b) => b.score - a.score);
  const take = habitat ? k - 1 : k;
  const forced: { c: CorpusChunk; score: number }[] = [];
  if (COMPARE_RE.test(question)) {
    for (const id of COMPARE_IDS) {
      if (id === "chunk-f-exploration-atmosphere" && habitatId !== "exploration" && habitatId !== "lunar-base") continue;
      const c = store.chunks.find((x) => x.id === id);
      if (c) forced.push({ c, score: boosted.find((x) => x.c.id === id)?.score ?? 0 });
    }
  }
  const forcedIds = new Set(forced.map((f) => f.c.id));
  const chosen = [...forced, ...boosted.filter((x) => !forcedIds.has(x.c.id))].slice(0, take);
  const passages = chosen.map((x) => x.c);
  const scores = new Map(chosen.map((x) => [x.c.id, x.score]));
  if (habitat) {
    const hc = habitatChunk(habitat, store.investigations);
    passages.push(hc);
    scores.set(hc.id, 0);
  }
  if (passages.length === 0) {
    for (const c of store.chunks.slice(0, k)) {
      passages.push(c);
      scores.set(c.id, 0);
    }
  }
  return { passages, scores };
}

const SYSTEM_PROMPT = [
  "You are a fire-safety research analyst for spacecraft and lunar habitat designers.",
  "Answer the question using only the NASA sources collected here, given as numbered passages. Do not use outside knowledge.",
  "Write 2 to 6 short sentences in plain language. Include units and numbers exactly as the passages give them.",
  "Every sentence must end with at least one citation, listing the ids of the passages that support it.",
  "If the NASA sources collected here do not contain the answer or only part of it, say so plainly in a sentence and cite the closest passage.",
  "Do not speculate beyond the sources. Distinguish measured results from estimates when the passages do.",
].join(" ");

function buildPrompt(question: string, passages: CorpusChunk[]): string {
  const body = passages.map((p) => `[${p.id}] ${p.title}\n${p.text}`).join("\n\n");
  return `Passages:\n\n${body}\n\nQuestion: ${question}`;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    sentences: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          citations: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["text", "citations"],
      },
    },
  },
  required: ["sentences"],
};

interface RawSentence {
  text: string;
  citations: string[];
}

function parseSentences(raw: string): RawSentence[] {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const obj = JSON.parse(cleaned);
  const arr = Array.isArray(obj) ? obj : obj.sentences;
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("no sentences");
  return arr
    .filter((s: unknown) => s && typeof (s as RawSentence).text === "string")
    .map((s: RawSentence) => ({
      text: s.text.trim(),
      citations: Array.isArray(s.citations) ? s.citations.map((c) => String(c).replace(/^\[|\]$/g, "").trim()) : [],
    }));
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 20000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function callGemini(model: string, question: string, passages: CorpusChunk[], timeoutMs: number): Promise<RawSentence[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("missing GEMINI_API_KEY");
  const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: buildPrompt(question, passages) }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: "minimal" },
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  }, timeoutMs);
  if (!res.ok) throw new Error(`gemini ${model} ${res.status}`);
  const data = await res.json();
  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  return parseSentences(text);
}

async function callHuggingFace(question: string, passages: CorpusChunk[], timeoutMs: number): Promise<{ model: string; sentences: RawSentence[] }> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("missing HF_TOKEN");
  const model = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
  const res = await fetchWithTimeout("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT} Respond with JSON only, shaped as {"sentences":[{"text":"...","citations":["passage id"]}]}.`,
        },
        { role: "user", content: buildPrompt(question, passages) },
      ],
    }),
  }, timeoutMs);
  if (!res.ok) throw new Error(`hf ${res.status}`);
  const data = await res.json();
  return { model, sentences: parseSentences(data?.choices?.[0]?.message?.content ?? "") };
}

function passageInfo(store: Store, passages: CorpusChunk[]): Record<string, PassageInfo> {
  const out: Record<string, PassageInfo> = {};
  for (const p of passages) {
    const s = store.sources.get(p.sourceId);
    out[p.id] = {
      sourceId: p.sourceId,
      investigationId: p.investigationId,
      title: s?.title ?? p.title,
      url: s?.url ?? null,
      doi: s?.doi ?? null,
    };
  }
  return out;
}

const ID_TOKEN_RE = /\s*\[[^\]\s]+(?:\s*[,;]\s*[^\]\s]+)*\]/g;

export function stripIds(text: string): string {
  return text.replace(ID_TOKEN_RE, "").replace(/\s+([.,;:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

function verify(raw: RawSentence[], allowed: Set<string>) {
  let total = 0;
  let ok = 0;
  const sentences: AnswerSentence[] = raw
    .filter((s) => stripIds(s.text).length > 0)
    .map((s) => {
      const uniq = Array.from(new Set(s.citations));
      total += uniq.length;
      const kept = uniq.filter((c) => allowed.has(c));
      ok += kept.length;
      return { text: stripIds(s.text), citations: kept, supported: kept.length > 0 };
    });
  return { sentences, total, ok };
}

export function normaliseQuestion(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

function extractive(question: string, passages: CorpusChunk[]): AnswerSentence[] {
  const q = new Set(tokenize(question));
  const out: AnswerSentence[] = [];
  for (const p of passages.filter((x) => !x.id.startsWith("habitat:")).slice(0, 3)) {
    let best = "";
    let bestScore = -1;
    for (const s of splitSentences(p.text)) {
      const sc = tokenize(s).filter((t) => q.has(t)).length;
      if (sc > bestScore) {
        bestScore = sc;
        best = s;
      }
    }
    if (best) out.push({ text: best, citations: [p.id], supported: true });
  }
  if (out.length === 0) {
    out.push({ text: "No supported passage was found for this question in the NASA sources collected here.", citations: [], supported: false });
  }
  return out;
}

export interface AskOptions {
  skipLlm?: boolean;
  skipCache?: boolean;
}

export async function ask(question: string, habitatId: string, opts: AskOptions = {}): Promise<AskResponse> {
  const t0 = Date.now();
  const store = loadStore();
  const { passages, scores } = await retrieve(question, habitatId);
  const allowed = new Set(passages.map((p) => p.id));
  const retrieved = passages.map((p) => ({ id: p.id, title: p.title, score: Math.round((scores.get(p.id) ?? 0) * 1000) / 1000 }));
  const info = passageInfo(store, passages);
  const base = { question, retrieved, passages: info };
  const errors: string[] = [];

  const finish = (mode: AskResponse["mode"], model: string | null, raw: RawSentence[], note: string | null): AskResponse => {
    const v = verify(raw, allowed);
    return {
      ...base,
      sentences: v.sentences,
      mode,
      model,
      verifiedCitations: v.ok,
      totalCitations: v.total,
      latencyMs: Date.now() - t0,
      note,
      generatedBy: model,
    };
  };

  if (!opts.skipCache) {
    const nq = normaliseQuestion(question);
    const hits = store.cached.filter((c) => normaliseQuestion(c.question) === nq);
    const hit = hits.find((c) => c.habitatId === habitatId);
    if (hit) {
      return {
        ...hit.answer,
        mode: "cached",
        generatedBy: hit.answer.generatedBy ?? hit.answer.model,
        latencyMs: Date.now() - t0,
        note: null,
      };
    }
  }

  if (!opts.skipLlm) {
    const primary = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
    const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";
    const left = (cap: number) => Math.min(cap, TOTAL_BUDGET_MS - (Date.now() - t0));
    for (const [model, cap] of [[primary, 20000], [fallback, 10000]] as [string, number][]) {
      const timeoutMs = left(cap);
      if (timeoutMs < 2000) break;
      try {
        const sentences = await callGemini(model, question, passages, timeoutMs);
        return finish("llm", model, sentences, errors.length ? `Primary model unavailable, answered by ${model}.` : null);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    if (process.env.HF_TOKEN && left(8000) >= 2000) {
      try {
        const r = await callHuggingFace(question, passages, left(8000));
        return finish("llm", r.model, r.sentences, "Gemini unavailable, answered by a Hugging Face model.");
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  }

  const ex = extractive(question, passages);
  return finish("extractive", null, ex, "Language model unavailable, showing the most relevant source sentences directly.");
}
