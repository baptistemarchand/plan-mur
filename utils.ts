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
