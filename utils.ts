import { customAlphabet } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";
import { Route } from "./types.ts";

export const getAuthors = (route: Route): string[] => {
  if (!route.author) {
    return [];
  }
  if (route.author.includes("&")) {
    return route.author.split("&");
  }
  if (route.author.includes("+")) {
    return route.author.split("+");
  }
  return [route.author];
};

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const nanoid = customAlphabet(alphabet, 7);
