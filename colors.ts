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

export const getTextColor = (color: Color) => {
  if (color === "noir" || color === "bleu" || color === "violet") {
    return "text-white";
  }
  return "text-black";
};

export const getBorderColor = (color: Color) => {
  if (
    color === "blanc" || color === "jaune" ||
    color === "orange" || color === "beige"
  ) {
    return "border-black";
  }
  return "border-white";
};
