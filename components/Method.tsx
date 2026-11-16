import type { EvalResults, Investigation, Source, TestPoint } from "@/lib/types";
import { doiUrl } from "@/lib/format";
import { COVER_TOL_O2, COVER_TOL_PSIA, DOWNLOADED_PSI_IDS } from "@/lib/site";
import { FUEL_SCORE, O2_SCALE, P_SCALE, WEIGHTS } from "@/lib/ranking";
import { N_HIGH, N_LOW, P_EXP, VALID_O2 } from "@/lib/model";

const EARTH: { title: string; claim: (inv: Investigation[]) => string; sourceIds: string[] }[] = [
  {
    title: "Fine water mist",
    claim: () => "Fine water mist fire suppression was studied in microgravity (MIST experiment).",
    sourceIds: ["nasa-mist"],
  },
  {
    title: "Smoke detection",
    claim: (inv) =>
      inv.flatMap((i) => i.findings).find((f) => f.id === "f-same-sizes")?.text ?? "Smoke particle sizes were measured in SAME.",
    sourceIds: ["urban-2009-same", "same2-ntrs"],
  },
  {
    title: "Firefighter gear and fire detectors",
    claim: () => "NASA Spinoff records describe firefighter attire and a fire detector derived from NASA work.",
    sourceIds: ["spinoff-firefighter-attire", "spinoff-fire-detector"],
  },
];

function srcLink(s: Source) {
  const href = s.doi ? doiUrl(s.doi) : s.url;
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="text-steel underline underline-offset-2">
      {s.title}
    </a>
  ) : (
    s.title
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border border-line bg-white p-2">
      <div className="num text-xl font-medium">{value}</div>
      <div className="text-[12px] font-medium">{label}</div>
      <div className="text-[11px] text-muted">{note}</div>
    </div>
  );
}

const pctf = (n: number) => `${(n * 100).toFixed(0)}%`;

export default function Method({
  investigations,
  sources,
  tests,
  evalResults,
}: {
  investigations: Investigation[];
  sources: Source[];
  tests: TestPoint[];
  evalResults: EvalResults | null;
}) {
  const downloaded = investigations.filter((i) => DOWNLOADED_PSI_IDS.includes(i.id)).length;
  const srcMap = new Map(sources.map((x) => [x.id, x]));
  const totalTests = investigations.reduce((a, i) => a + (i.testCount ?? 0), 0);
  const ref = sources.filter((s) => s.kind !== "psi");
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="panel" aria-labelledby="prov-h">
        <div className="panel-head"><h2 id="prov-h">Data provenance</h2></div>
        <div className="space-y-2 px-3 pb-3 text-[13px] leading-snug">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Investigations" value={String(investigations.length)} note="NASA PSI database records" />
            <Stat label="PSI pages downloaded" value={String(downloaded)} note="PSI investigation pages and metadata downloaded by the team" />
            <Stat label="Test records" value={String(tests.length || totalTests)} note={tests.length ? "CFI-G test matrix points" : "sum of reported counts"} />
          </div>
          <p>
            Each investigation was transcribed from its NASA Physical Sciences Informatics (PSI) page and the papers it cites. A value that a source does not state is stored as null and shown as &quot;not reported&quot;; no number is estimated to fill a gap. {downloaded} of {investigations.length} records come from PSI investigation pages and metadata downloaded by the team; the others use the PSI listing and cited papers.
          </p>
          <h3 className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted">Confidence levels</h3>
          <dl className="grid grid-cols-[70px_1fr] gap-y-1 text-[12.5px]">
            <dt className="font-medium">high</dt><dd>Conditions and findings read directly from a PSI page or peer-reviewed paper.</dd>
            <dt className="font-medium">medium</dt><dd>Some fields from secondary summaries or partly reported.</dd>
            <dt className="font-medium">low</dt><dd>Sparse record; many fields not reported.</dd>
          </dl>
        </div>
      </section>

      <section className="panel" aria-labelledby="cav-h">
        <div className="panel-head"><h2 id="cav-h">Model caveats</h2></div>
        <ol className="list-decimal space-y-1 px-8 pb-3 text-[12.5px] leading-snug">
          <li>Spread estimate = (X/0.21)^n x (P/14.7)^{P_EXP} with n = {N_LOW} to {N_HIGH}, after the opposed-flow correlation in Olson et al. 2008 (NASA/TM-2008-215260).</li>
          <li>Anchored on one thin fabric; valid {VALID_O2[0]} to {VALID_O2[1]}% O2 and 0.5 to 1 atm. Not shown outside that range, and not shown below 21% O2 (ISS and Earth air display as the reference).</li>
          <li>Over-predicts near flammability limits; ignores confinement, thick fuels and ignition source.</li>
          <li>Microgravity and partial gravity can lower the burning limit by up to about 4% O2 versus the 1g NASA-STD-6001 Test 1.</li>
          <li>The ranking score is a transparent weighted sum for triage, not a safety determination.</li>
        </ol>
        <div className="border-t border-line px-3 py-2 text-[12.5px]">
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">Ranking formula</h3>
          <p>Score = 100 x ({WEIGHTS.proximity} conditions + {WEIGHTS.fuel} fuel + {WEIGHTS.pillar} pillar + {WEIGHTS.flight} flight). Conditions = 1/(1 + 4d), d = distance from the habitat to the reported O2 and pressure box, with O2 scaled by {O2_SCALE} % and pressure by {P_SCALE} psia. Both axes not reported = 0.5; one axis not reported = that score averaged with 0.5, and flagged. Fuel: solid {FUEL_SCORE.solid}, gas {FUEL_SCORE.gas}, liquid {FUEL_SCORE.liquid}. Flight 1.0, ground 0.7.</p>
          <h3 className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted">Coverage rule</h3>
          <p>A habitat atmosphere counts as spanned when it lies within a reported range extended by {COVER_TOL_O2} % O2 and {COVER_TOL_PSIA} psia, so ISS (21%) and Earth (20.9%) are treated alike. Ranges are bounding boxes, not test points, and coverage ignores gravity: all PSI data are microgravity.</p>
        </div>
      </section>

      <section className="panel" aria-labelledby="eval-h">
        <div className="panel-head">
          <h2 id="eval-h">Analyst evaluation</h2>
          {evalResults && <span className="num text-[11px] text-muted">{evalResults.questions} questions, {evalResults.model}</span>}
        </div>
        <div className="px-3 pb-3">
          {evalResults ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Source hit rate" value={pctf(evalResults.sourceHitRate)} note="higher is better" />
              <Stat label="Citation precision" value={pctf(evalResults.citationPrecision)} note="higher is better" />
              <Stat label="Citation recall" value={pctf(evalResults.citationRecall)} note="higher is better" />
              <Stat label="Unsupported rate" value={pctf(evalResults.unsupportedRate)} note="lower is better" />
            </div>
          ) : (
            <p className="text-[13px] text-muted">Evaluation pending.</p>
          )}
          <p className="mt-2 text-[12.5px] leading-snug">Evaluated with gemini-3.5-flash; the live site uses gemini-flash-lite-latest as primary for free-tier quota.</p>
          <p className="mt-2 text-[12.5px] leading-snug">
            {evalResults?.framework ?? "Retrieval-augmented generation: passages are retrieved from the curated corpus, the model answers with citation ids, and each citation is checked against the retrieved set before display."}
          </p>
        </div>
      </section>

      <section className="panel" aria-labelledby="earth-h">
        <div className="panel-head"><h2 id="earth-h">Earth applications</h2></div>
        <ul className="divide-y divide-line px-3 pb-2 text-[12.5px] leading-snug">
          {EARTH.map((e) => (
            <li key={e.title} className="py-1.5">
              <div className="font-medium">{e.title}</div>
              <div className="text-muted">{e.claim(investigations)}</div>
              <div className="text-[11.5px]">
                Source:{" "}
                {e.sourceIds.map((id, k) => {
                  const src = srcMap.get(id);
                  return (
                    <span key={id}>
                      {k > 0 && "; "}
                      {src ? srcLink(src) : id}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="ai-h">
        <div className="panel-head"><h2 id="ai-h">Use of AI</h2></div>
        <p className="px-3 pb-3 text-[12.5px] leading-snug">
          AI tools were used to help write code and organise data for this project. The in-app analyst uses a language model to phrase answers from retrieved passages. All numbers trace to cited NASA sources, and answer citations are verified against the retrieved set before they are shown.
        </p>
      </section>

      <section className="panel lg:col-span-2" aria-labelledby="ref-h">
        <div className="panel-head"><h2 id="ref-h">References ({ref.length})</h2></div>
        <ol className="columns-1 gap-6 px-3 pb-3 text-[12px] leading-snug lg:columns-2">
          {ref.map((s) => (
            <li key={s.id} className="mb-1.5 break-inside-avoid">
              <span className="num mr-1 text-muted">[{s.id}]</span>
              {s.authors ? `${s.authors}. ` : ""}{s.year ? `${s.year}. ` : ""}{srcLink(s)}{s.venue ? `. ${s.venue}` : ""}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
