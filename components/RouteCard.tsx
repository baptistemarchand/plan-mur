import {
  getBg,
  getBorderColor,
  getStripesColor,
  getTextColor,
} from "../colors.ts";
import { Route } from "../types.ts";

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

  return (
    <div
      class={`p-3 h-full ${getBg(route.color)} ${getTextColor(route.color)} ${
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
      <div class={`${gradeSize} font-semibold mb-3`}>
        {route.grade}
      </div>
      <div class={`${textSize}`}>
        {route.setAt}
      </div>
      <div class={`${textSize}`}>{route.author}</div>
    </div>
  );
};
