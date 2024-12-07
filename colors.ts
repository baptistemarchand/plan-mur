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
  "vert-2",
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
    case "vert-2":
      return "bg-vert-2";
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
  return ["blanc", "jaune", "orange", "beige", "vert-2"].includes(color);
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
