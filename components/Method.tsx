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
    <div className="border border-line bg-white px-4 py-3">
      <div className="num text-[32px] font-medium leading-none">{value}</div>
      <div className="mt-2 text-[12px] font-medium">{label}</div>
      <div className="text-[12px] text-muted">{note}</div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h2 id={id} className="mb-3 text-[15px] font-semibold">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed">{children}</div>
    </section>
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
  const olson = srcMap.get("olson-2008-tm");
  const ferkul = srcMap.get("ferkul-2026-lpsc");
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8">
      <Section id="data-h" title="Data">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Investigations" value={String(investigations.length)} note="NASA PSI database records" />
          <Stat label="PSI pages downloaded" value={String(downloaded)} note="pages and metadata" />
          <Stat label="Test records" value={String(tests.length || totalTests)} note={tests.length ? "CFI-G test matrix points" : "sum of reported counts"} />
        </div>
        <p>
          Each investigation was transcribed from its NASA Physical Sciences Informatics (PSI) page and the papers it cites. A value that a source does not state is stored as null and shown as not reported; no number is estimated to fill a gap. {downloaded} of {investigations.length} records come from PSI investigation pages and metadata downloaded by the team; the others use the PSI listing and cited papers.
        </p>
        <dl className="grid grid-cols-[80px_1fr] gap-y-1.5 text-[13px]">
          <dt className="font-medium">high</dt><dd>Conditions and findings read directly from a PSI page or peer-reviewed paper.</dd>
          <dt className="font-medium">medium</dt><dd>Some fields from secondary summaries or partly reported.</dd>
          <dt className="font-medium">low</dt><dd>Sparse record; many fields not reported.</dd>
        </dl>
        <p className="text-[13px] text-muted">
          Ranges on the Envelope chart are bounding boxes, not test points, and ignore gravity: all PSI flight data are microgravity. Chart ranges counted as covering an atmosphere are extended by {COVER_TOL_O2}% O2 and {COVER_TOL_PSIA} psia, so ISS (21%) and Earth (20.9%) are treated alike.
        </p>
      </Section>

      <Section id="rank-h" title="How ranking works">
        <p>
          Score = 100 x ({WEIGHTS.proximity} conditions + {WEIGHTS.fuel} fuel + {WEIGHTS.pillar} pillar + {WEIGHTS.flight} flight). Conditions = 1/(1 + 4d), where d is the distance from the habitat to the reported O2 and pressure box, with O2 scaled by {O2_SCALE}% and pressure by {P_SCALE} psia. Both axes not reported scores 0.5; one axis not reported is averaged with 0.5 and flagged.
        </p>
        <p>
          Fuel: solid {FUEL_SCORE.solid}, gas {FUEL_SCORE.gas}, liquid {FUEL_SCORE.liquid}. Flight 1.0, ground 0.7. Pillar is 1 when the investigation is tagged with the chosen focus. The score is a transparent weighted sum for triage, not a safety determination.
        </p>
      </Section>

      <Section id="spread-h" title="Spread estimate">
        <p>
          Estimated flame spread vs ISS air = (X/0.21)^n x (P/14.7)^{P_EXP}, with n = {N_LOW} to {N_HIGH}, after the opposed-flow correlation in{" "}
          {olson ? srcLink({ ...olson, title: "Olson et al. 2008, NASA/TM-2008-215260" }) : "Olson et al. 2008"}.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-[13px]">
          <li>Valid for {VALID_O2[0]} to {VALID_O2[1]}% O2 and 0.5 to 1 atm; otherwise the tile reads outside model range. ISS and Earth air display as the reference.</li>
          <li>Anchored on one thin fabric, opposed flow. Over-predicts near flammability limits; ignores confinement, thick fuels and ignition source.</li>
          <li>Microgravity can lower the burning limit by up to about 4% O2 versus the 1 g NASA-STD-6001 Test 1; lunar gravity may be as bad or worse ({ferkul ? srcLink({ ...ferkul, title: "Ferkul et al., LPSC 2026" }) : "Ferkul et al., LPSC 2026"}).</li>
          <li>Crews breathe O2 partial pressure; fire responds to O2 fraction.</li>
        </ul>
      </Section>

      <Section id="eval-h" title="Evaluation">
        {evalResults ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Source hit rate" value={pctf(evalResults.sourceHitRate)} note="higher is better" />
            <Stat label="Citation precision" value={pctf(evalResults.citationPrecision)} note="higher is better" />
            <Stat label="Citation recall" value={pctf(evalResults.citationRecall)} note="higher is better" />
            <Stat label="Unsupported rate" value={pctf(evalResults.unsupportedRate)} note="lower is better" />
          </div>
        ) : (
          <p className="text-muted">Evaluation pending.</p>
        )}
        {evalResults && <p className="num text-[12px] text-muted">{evalResults.questions} questions</p>}
        <p className="text-[13px]">Evaluated with gemini-3.5-flash; the live site uses gemini-flash-lite-latest as primary for free-tier quota.</p>
        <p className="text-[13px]">
          {evalResults?.framework ?? "Retrieval-augmented generation: passages are retrieved from the curated corpus, the model answers with citation ids, and each citation is checked against the retrieved set before display."}
        </p>
      </Section>

      <Section id="earth-h" title="Earth applications">
        <ul className="divide-y divide-line">
          {EARTH.map((e) => (
            <li key={e.title} className="py-3 first:pt-0">
              <div className="font-medium">{e.title}</div>
              <div className="text-[13px] text-muted">{e.claim(investigations)}</div>
              <div className="text-[12px]">
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
      </Section>

      <Section id="ai-h" title="Use of AI">
        <p>
          AI tools were used to help write code and organise data for this project. The in-app analyst uses a language model to phrase answers from retrieved passages. All numbers trace to cited NASA sources, and answer citations are verified against the retrieved set before they are shown.
        </p>
      </Section>

      <section aria-labelledby="ref-h" className="border-t border-line pt-6">
        <details>
          <summary id="ref-h" className="cursor-pointer text-[15px] font-semibold">References ({ref.length})</summary>
          <ol className="mt-3 space-y-2 text-[12px] leading-snug">
            {ref.map((s) => (
              <li key={s.id}>
                <span className="num mr-1 text-muted">[{s.id}]</span>
                {s.authors ? `${s.authors}. ` : ""}{s.year ? `${s.year}. ` : ""}{srcLink(s)}{s.venue ? `. ${s.venue}` : ""}
              </li>
            ))}
          </ol>
        </details>
      </section>
    </div>
  );
}
