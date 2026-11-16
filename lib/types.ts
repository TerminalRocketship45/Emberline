export type FuelType = "solid" | "liquid" | "gas";
export type Pillar = "prevention" | "detection" | "suppression";
export type Confidence = "high" | "medium" | "low";
export type InvestigationKind = "flight" | "ground";

export type Range = [number, number];

export interface Conditions {
  o2Pct: Range | null;
  pressurePsia: Range | null;
  flowCmS: Range | null;
  diluents: string[];
  gravity: string;
  sourceIds: string[];
}

export interface Finding {
  id: string;
  text: string;
  value: string | null;
  sourceIds: string[];
  verified: boolean;
}

export interface Investigation {
  id: string;
  short: string;
  name: string;
  kind: InvestigationKind;
  psiDoi: string | null;
  psiUrl: string;
  platform: string;
  hardware: string;
  years: string | null;
  fuelType: FuelType;
  fuels: string[];
  sample: string | null;
  objective: string;
  approach: string | null;
  conditions: Conditions;
  varied: string | null;
  fixed: string | null;
  measurements: string[];
  findings: Finding[];
  pillars: Pillar[];
  habitatRelevance: string | null;
  relatedIds: string[];
  reusesDataFrom: string[];
  sourceIds: string[];
  testCount: number | null;
  confidence: Confidence;
}

export interface Source {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  venue: string | null;
  url: string | null;
  doi: string | null;
  kind: "psi" | "paper" | "report" | "challenge" | "web";
}

export interface Habitat {
  id: string;
  name: string;
  shortName: string;
  o2Pct: number;
  pressurePsia: number;
  gravityG: number;
  note: string;
  sourceIds: string[];
}

export interface TestPoint {
  investigationId: string;
  testId: string;
  fuel: string;
  o2Pct: number;
  pressurePsia: number;
  ignited: boolean | null;
  outcome: string | null;
  flameType: string | null;
}

export interface Citation {
  sourceId: string;
  investigationId: string | null;
}

export interface AnswerSentence {
  text: string;
  citations: string[];
  supported: boolean;
}

export interface AnalystAnswer {
  question: string;
  sentences: AnswerSentence[];
  retrieved: { id: string; title: string; score: number }[];
  mode: "llm" | "cached" | "extractive";
  model: string | null;
  verifiedCitations: number;
  totalCitations: number;
  latencyMs: number;
}

export interface CorpusChunk {
  id: string;
  investigationId: string | null;
  sourceId: string;
  title: string;
  text: string;
}

export interface EvalItem {
  question: string;
  expectedIds: string[];
  citedIds: string[];
  hit: boolean;
  supportedSentences: number;
  totalSentences: number;
}

export interface EvalResults {
  runAt: string;
  model: string;
  framework: string;
  questions: number;
  sourceHitRate: number;
  citationPrecision: number;
  citationRecall: number;
  unsupportedRate: number;
  items: EvalItem[];
}
