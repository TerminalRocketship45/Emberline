import { ask, setData, type AnalystData } from "../../../lib/analyst/pipeline";
import corpus from "../../../data/corpus.json";
import sources from "../../../data/sources.json";
import habitats from "../../../data/habitats.json";
import investigations from "../../../data/investigations.json";
import cached from "../../../data/cached_answers.json";

let ready = false;

function init() {
  if (ready) return;
  setData({ corpus, sources, habitats, investigations, cached } as unknown as AnalystData);
  ready = true;
}

export const runtime = "nodejs";
export const maxDuration = 60;

const WINDOW_MS = 60_000;
const LIMIT = 20;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) {
    return Response.json({ error: "Too many questions. Please wait a minute." }, { status: 429 });
  }
  let body: { question?: unknown; habitatId?: unknown };
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad body");
    body = parsed;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const habitatId = typeof body.habitatId === "string" ? body.habitatId : "";
  if (question.length < 3 || question.length > 500) {
    return Response.json({ error: "Question must be 3 to 500 characters." }, { status: 400 });
  }
  try {
    init();
    const answer = await ask(question, habitatId);
    return Response.json(answer);
  } catch {
    return Response.json({ error: "The analyst could not answer right now." }, { status: 500 });
  }
}
