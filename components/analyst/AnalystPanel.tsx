"use client";

import { useState } from "react";
import type { AskResponse } from "../../lib/analyst/types";

const CHIPS = [
  "Is a 34% oxygen lunar habitat more flammable than the ISS?",
  "What did Saffire learn about large fires in microgravity?",
  "Does CO2 or helium suppress droplet flames better in microgravity?",
  "How small are smoke particles in microgravity and why does it matter for detectors?",
  "What fire data exist for lunar gravity, and what is still missing?",
  "How fast do flames spread over thin fabrics in space?",
];

const MODE_LABEL: Record<AskResponse["mode"], string> = {
  llm: "Live model",
  cached: "Stored answer",
  extractive: "Source excerpts",
};

function doiHref(doi: string): string {
  return doi.startsWith("http") ? doi : `https://doi.org/${doi}`;
}

export default function AnalystPanel({ habitatId }: { habitatId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function submit(q: string) {
    const text = q.trim();
    if (text.length < 3 || loading) return;
    setLoading(true);
    setError(null);
    setOpen(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text, habitatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      setAnswer(data as AskResponse);
    } catch (e) {
      setAnswer(null);
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const numbering = new Map<string, number>();
  if (answer) {
    for (const s of answer.sentences) {
      for (const c of s.citations) if (!numbering.has(c)) numbering.set(c, numbering.size + 1);
    }
  }

  return (
    <section className="border border-neutral-300 bg-white" style={{ borderRadius: 2 }}>
      <header className="border-b border-neutral-300 px-4 py-3">
        <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-neutral-900">Ask the analyst</h2>
        <p className="mt-1 font-sans text-xs text-neutral-600">
          Answers use only retrieved NASA passages. Every sentence carries a citation that the server checks.
        </p>
      </header>

      <div className="px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(question);
          }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            placeholder="Ask about fire in this habitat"
            aria-label="Question for the analyst"
            className="min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2 font-sans text-sm text-neutral-900 outline-none focus:border-amber-600"
            style={{ borderRadius: 2 }}
          />
          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            className="border border-amber-700 bg-amber-600 px-4 py-2 font-sans text-sm font-medium text-white disabled:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500"
            style={{ borderRadius: 2 }}
          >
            {loading ? "Working" : "Ask"}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuestion(c);
                submit(c);
              }}
              className="border border-neutral-300 bg-white px-2 py-1 text-left font-sans text-xs text-neutral-700 hover:border-sky-800 hover:text-sky-900 disabled:opacity-50"
              style={{ borderRadius: 2 }}
            >
              {c}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-4 border border-neutral-300 px-3 py-2 font-sans text-sm text-neutral-800" style={{ borderRadius: 2 }}>
            {error}
          </p>
        )}

        {answer && (
          <div className="mt-4" aria-live="polite">
            <p className="font-sans text-sm font-medium text-neutral-900">{answer.question}</p>
            <div className="mt-2 font-sans text-sm leading-relaxed text-neutral-800">
              {answer.sentences.map((s, i) => (
                <span key={i} className={s.supported ? "" : "text-neutral-500"}>
                  {s.text}
                  {s.citations.map((c) => (
                    <sup key={c} className="ml-0.5">
                      <button
                        type="button"
                        onClick={() => setOpen(open === c ? null : c)}
                        aria-expanded={open === c}
                        aria-label={`Citation ${numbering.get(c)}`}
                        className="font-mono text-[11px] text-sky-800 underline decoration-dotted underline-offset-2 hover:text-sky-950"
                      >
                        [{numbering.get(c)}]
                      </button>
                    </sup>
                  ))}
                  {!s.supported && <span className="ml-1 font-mono text-[11px] text-amber-700">[unsupported]</span>}{" "}
                </span>
              ))}
            </div>

            {open && answer.passages[open] && (
              <div className="mt-3 border border-neutral-300 bg-neutral-50 px-3 py-2 font-sans text-xs text-neutral-800" style={{ borderRadius: 2 }}>
                <div className="font-mono text-[11px] text-neutral-500">
                  [{numbering.get(open)}] {answer.passages[open].investigationId ?? answer.passages[open].sourceId}
                </div>
                <div className="mt-1 font-medium">{answer.passages[open].title}</div>
                <div className="mt-1 flex gap-3 font-mono text-[11px]">
                  {answer.passages[open].doi && (
                    <a className="text-sky-800 underline" href={doiHref(answer.passages[open].doi!)} target="_blank" rel="noreferrer">
                      DOI {answer.passages[open].doi}
                    </a>
                  )}
                  {answer.passages[open].url && (
                    <a className="text-sky-800 underline" href={answer.passages[open].url!} target="_blank" rel="noreferrer">
                      Source page
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-neutral-300 pt-2 font-mono text-[11px] tabular-nums text-neutral-600">
              <span>Retrieved {answer.retrieved.length} passages</span>
              <span aria-hidden>{"->"}</span>
              <span>{answer.mode === "cached" ? `cached \u00b7 generated by ${answer.generatedBy ?? answer.model ?? "unknown"}` : (answer.model ?? "no model")}</span>
              <span aria-hidden>{"->"}</span>
              <span>
                {answer.verifiedCitations}/{answer.totalCitations} citations verified
              </span>
              <span aria-hidden>{"->"}</span>
              <span>{(answer.latencyMs / 1000).toFixed(1)} s</span>
              <span
                className={`border px-1.5 py-0.5 ${answer.mode === "llm" ? "border-sky-800 text-sky-900" : "border-amber-700 text-amber-800"}`}
                style={{ borderRadius: 2 }}
              >
                {MODE_LABEL[answer.mode]}
              </span>
            </div>
            {answer.note && <p className="mt-1 font-sans text-[11px] text-neutral-500">{answer.note}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
