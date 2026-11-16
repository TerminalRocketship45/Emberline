export const SITE_NAME = "Emberline";
export const SITE_PURPOSE =
  "Where NASA's microgravity fire data ends, and your habitat begins";
export const FOCUS_OPTIONS = ["all", "prevention", "detection", "suppression"] as const;
export type Focus = (typeof FOCUS_OPTIONS)[number];

export const DOWNLOADED_PSI_IDS = [
  "PSI-20",
  "PSI-25",
  "PSI-26",
  "PSI-39",
  "PSI-47",
  "PSI-68",
  "PSI-69",
  "PSI-98",
  "PSI-99",
  "PSI-100",
  "PSI-101",
  "PSI-102",
  "PSI-159",
];

export const EXPLICIT_TEST_ATMOSPHERES = [
  { investigationId: "PSI-20", o2Pct: 21, pressurePsia: 14.7 },
  { investigationId: "PSI-20", o2Pct: 26.5, pressurePsia: 10.2 },
  { investigationId: "PSI-20", o2Pct: 34, pressurePsia: 8.2 },
];

export const COVER_TOL_O2 = 1;
export const COVER_TOL_PSIA = 0.25;
export const O2_AXIS: [number, number] = [10, 100];
export const P_AXIS: [number, number] = [0, 50];

export const O2_HABITAT: [number, number] = [10, 45];
export const P_HABITAT: [number, number] = [0, 20];
