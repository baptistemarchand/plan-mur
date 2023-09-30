import { rgb } from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";

export const colors = [
  "blanc",
  "gris",
  "noir",
  "rose",
  "violet",
  "bleu",
  "jaune",
  "orange",
  "rouge",
  "vert",
  "beige",
] as const;

export type Color = (typeof colors)[number];

export const getBg = (color: Color) => {
  switch (color) {
    case "rouge":
      return "bg-rouge";
    case "beige":
      return "bg-beige";
    case "bleu":
      return "bg-bleu";
    case "violet":
      return "bg-violet";
    case "rose":
      return "bg-rose";
    case "vert":
      return "bg-vert";
    case "jaune":
      return "bg-jaune";
    case "noir":
      return "bg-noir";
    case "orange":
      return "bg-orange";
    case "gris":
      return "bg-gris";
    case "blanc":
      return "bg-white";
  }
  return "";
};

export const isLight = (color: Color) => {
  return ["blanc", "jaune", "orange", "beige"].includes(color);
};

export const isDark = (color: Color) => {
  return ["noir", "bleu", "violet", "rouge", "vert"].includes(color);
};

export const getTextColor = (color: Color) => {
  if (isDark(color)) {
    return "text-white";
  }
  return "text-black";
};

export const getBorderColor = (color: Color) => {
  if (isLight(color)) {
    return "border-black";
  }
  return "border-white";
};

export const getStripesColor = (color: Color) => {
  if (color === "noir") {
    return "rgba(255, 255, 255, 0.4)";
  }
  return `rgba(0, 0, 0, ${isDark(color) ? "0.5" : "0.2"})`;
};

export const getPrintBgColor = (color: Color) => {
  switch (color) {
    case "rouge":
      return rgb(238 / 255, 22 / 255, 22 / 255);
    case "beige":
      return rgb(227 / 255, 192 / 255, 131 / 255);
    case "bleu":
      return rgb(25 / 255, 75 / 255, 254 / 255);
    case "violet":
      return rgb(156 / 255, 58 / 255, 209 / 255);
    case "rose":
      return rgb(255 / 255, 67 / 255, 236 / 255);
    case "vert":
      return rgb(40 / 255, 153 / 255, 2 / 255);
    case "jaune":
      return rgb(249 / 255, 241 / 255, 4 / 255);
    case "noir":
      return rgb(0 / 255, 0 / 255, 0 / 255);
    case "orange":
      return rgb(255 / 255, 149 / 255, 0 / 255);
    case "gris":
      return rgb(149 / 255, 149 / 255, 149 / 255);
    case "blanc":
      return rgb(1, 1, 1);
  }
  return undefined;
};

export const getPrintTextColor = (color: Color) => {
  if (isDark(color)) {
    return rgb(1, 1, 1);
  }
  return rgb(0, 0, 0);
};
