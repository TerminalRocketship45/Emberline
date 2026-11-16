import type { EvalResults, Finding, Habitat, Investigation, Source, TestPoint } from "./types";
import investigations from "../data/investigations.json";
import sources from "../data/sources.json";
import habitats from "../data/habitats.json";
import findings from "../data/findings.json";
import tests from "../data/tests.json";
import evalResults from "../data/eval_results.json";

export interface AppData {
  investigations: Investigation[];
  sources: Source[];
  habitats: Habitat[];
  findings: Finding[];
  tests: TestPoint[];
  evalResults: EvalResults | null;
}

export function loadData(): AppData {
  return {
    investigations: investigations as unknown as Investigation[],
    sources: sources as unknown as Source[],
    habitats: habitats as unknown as Habitat[],
    findings: findings as unknown as Finding[],
    tests: tests as unknown as TestPoint[],
    evalResults: evalResults as unknown as EvalResults,
  };
}
