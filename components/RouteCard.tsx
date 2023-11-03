import {
  getBg,
  getBorderColor,
  getStripesColor,
  getTextColor,
} from "../colors.ts";
import { Route } from "../types.ts";
import { getAuthors } from "../utils.ts";

export const RouteCard = (
  { route, selected, variant }: {
    route: Route;
    selected?: boolean;
    variant: "big" | "small";
  },
) => {
  const stripesColor = getStripesColor(route.color);
  const big = variant === "big";
  const gradeSize = big ? "text-5xl" : "text-2xl";
  const textSize = big ? "text-xl font-semibold" : "";

  const authors = getAuthors(route);

  return (
    <div
      class={`p-2 h-full ${getBg(route.color)} ${getTextColor(route.color)} ${
        selected ? `border-dashed ${getBorderColor(route.color)} border-4` : ""
      }`}
      style={route.toRemove
        ? `background-image: repeating-linear-gradient(
          45deg,
          ${stripesColor},
          ${stripesColor} 10px,
          rgba(0,0,0,0) 10px,
          rgba(0,0,0,0) 25px
        );`
        : ""}
    >
      <div class={`${gradeSize} font-semibold`}>
        {route.grade}
      </div>
      <div class={`${textSize}`}>
        {route.setAt}
      </div>
      {authors.map((author) => <div class={`${textSize}`}>{author}</div>)}
    </div>
  );
};
