# Emberline

**Fire-safety insights from NASA microgravity combustion data.**
NASA Space Apps Challenge 2026 · *Flame in Freefall* · Girard, OH local event · Rohan Bankapur, Independence High School

Emberline turns NASA's Physical Sciences Informatics (PSI) combustion investigations into one question a habitat designer can actually ask: **how dangerous is fire in this atmosphere, and which experiments tell me?**

## Why it matters

Lunar habitats, landers and pressurized rovers are planned at **8.2 psia with 34% oxygen** (control band up to 37%), so crews can avoid long pre-breathe before spacewalks. People respond to oxygen *partial pressure*, but fire responds to oxygen *fraction*. A published opposed-flow correlation puts flame spread in that atmosphere at roughly **1.5 to 1.8 times** ISS air, and microgravity flammability limits can sit **up to about 4% O2 below** the 1 g NASA-STD-6001 Test 1 limits. Every number on the site links to its source.

## What it does

| View | What you get |
|---|---|
| **Envelope** | Pick a habitat (ISS, lunar base, exploration atmosphere, spacesuit, Earth). Every PSI investigation with reported conditions is drawn on an O2 vs pressure map, with 154 individual CFI-G test points. The page states which investigations' ranges span your atmosphere, split by fuel type, and where no solid-material burn test exists. |
| **Ranking** | Investigations ranked for your habitat and focus (prevention, detection, suppression) with a transparent per-row score breakdown: condition proximity, fuel relevance, pillar match, flight vs ground. |
| **Spread estimate** | Flame-spread multiplier versus ISS air from a published correlation, shown as a band with its validity range and caveats. |
| **Experiments** | All 24 combustion investigations: fuels, samples, O2, pressure, flow, diluents, sensors, findings, DOIs, and which ground studies reuse which flight data. Compare up to three side by side. |
| **Analyst** | Ask a question in plain English. Answers come only from retrieved NASA passages, every sentence carries a citation, and the server rejects citations to passages it did not retrieve. |
| **Method** | Provenance, confidence levels, model caveats, evaluation results, Earth applications and references. |

## How the analyst works

Retrieval-augmented answering with a frozen model, no fine-tuning:

- **In-Context RALM** (Ram et al., 2023, *TACL*, arXiv:2302.00083): BM25 retrieves the top passages from a 142-passage corpus built from PSI investigation pages and cited findings, and they are placed in the prompt of an unmodified model.
- **ALCE-style citations** (Gao et al., 2023, *EMNLP*, arXiv:2305.14627): the model returns JSON sentences, each with passage ids; the server keeps only ids that were actually retrieved and flags unsupported sentences.
- **Fallbacks** so the demo never goes dark: cached answers for suggested questions first, then the primary Gemini model, the backup Gemini model, Hugging Face (if HF_TOKEN is set), then a no-model extractive answer that quotes the retrieved passages with citations.
- **Models**: evaluated with gemini-3.5-flash; the live site uses gemini-flash-lite-latest as primary for free-tier quota.

**Evaluation** on 20 questions with expected sources: source hit rate 0.95, citation precision 0.84, citation recall 0.68, unsupported-sentence rate 0.00. "Supported" means the cited passage was in the retrieved set (citation validity), not a full entailment check.

## Data

- 24 PSI combustion investigations; 13 investigation pages and their ISA metadata were downloaded from psi.nasa.gov and parsed (PSI-20, 25, 26, 39, 47, 68, 69, 98, 99, 100, 101, 102, 159), the rest are summarised from cited NASA and journal sources at lower confidence.
- CFI-G (PSI-159) experimental table: 154 tests with oxygen fraction, pressure and ignition outcome (`raw/`).
- 63 sources, 30 cited quantitative findings, each tagged verified or unverified.
- The pipeline that builds `data/` from these inputs is in `pipeline/`.

Unknown values stay empty and display as "not reported". No number is invented.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local` (free tier works). Without a key the analyst still answers from cached and extractive modes.

Rebuild the data: run `pipeline/build_sources.py`, `build_data.py`, `build_investigations.py`, `build_corpus.py`, then `validate.py`.
Run the evaluation: `node --experimental-strip-types scripts/eval.ts`.

## Use of AI

AI coding assistants were used to help write the code, organise the extracted data and draft text. The Gemini API powers the in-app analyst. All facts shown trace to the NASA and peer-reviewed sources listed on the Method page.

## License and credits

NASA PSI data is released under CC0-1.0. Built with Next.js, Tailwind CSS, Plotly.js and IBM Plex. NASA does not endorse this project.
