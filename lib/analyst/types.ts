import type { AnalystAnswer } from "../types";

export interface PassageInfo {
  sourceId: string;
  investigationId: string | null;
  title: string;
  url: string | null;
  doi: string | null;
}

export interface AskResponse extends AnalystAnswer {
  passages: Record<string, PassageInfo>;
  note: string | null;
  generatedBy: string | null;
}
