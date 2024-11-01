import { Color } from "./colors.ts";

export type Route = {
  id: string;
  color: Color;
  grade: string;
  setAt?: string;
  author?: string;
  toRemove?: boolean;
  deleted?: boolean;
};
