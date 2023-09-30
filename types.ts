import { Color } from "./colors.ts";

export type Route = {
  color: Color;
  grade: string;
  setAt?: string;
  author?: string;
  toRemove?: boolean;
};
