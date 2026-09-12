import {
  getBg,
  getBorderColor,
  getStripesColor,
  getTextColor,
  isDark,
} from "../colors.ts";
import { Construction } from "./icons/Construction.tsx";
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
      <div class={`${gradeSize} font-semibold flex items-center gap-2`}>
        {route.grade}
        {route.toOpen && (
          <Construction
            color={isDark(route.color) ? "#fff" : "#000"}
            size={big ? "28px" : "18px"}
          />
        )}
      </div>
      <div class={`${textSize}`}>
        {route.setAt}
      </div>
      {authors.map((author, i) => (
        <div key={i} class={`${textSize}`}>{author}</div>
      ))}
    </div>
  );
};
