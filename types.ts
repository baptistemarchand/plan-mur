import { Color } from "./colors.ts";

export type Grade = `${"4" | "5" | "6" | "7"}${"a" | "b" | "c"}${"+" | ""}`;

export type Route = {
  color: Color;
  grade: Grade;
  setAtYear: string;
  setAtMonth: string;
  author?: string;
};

export const authors = [
  "Baptiste",
  "Ivanne",
  "Christophe",
  "Max",
  "JB",
  "Seb",
  "Charline",
  "Thomas",
  "Benoit",
  "Bruno",
] as const;
