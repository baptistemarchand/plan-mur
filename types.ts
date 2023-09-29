import { Color } from "./colors.ts";

export type Route = {
  color: Color;
  grade: string;
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
