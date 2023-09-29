import { Color } from "./colors.ts";

export type Route = {
  color: Color;
  grade: string;
  setAtYear: string;
  setAtMonth: string;
  author?: string;
};
