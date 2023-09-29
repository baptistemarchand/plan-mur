import { Options } from "$fresh/plugins/twind.ts";

export default {
  selfURL: import.meta.url,
  theme: {
    extend: {
      colors: {
        bleu: "#194bfe",
        rouge: "#ee1616",
        beige: "#e3c083",
        violet: "#9c3ad1",
        rose: "#ff43ec",
        vert: "#289902",
        jaune: "#f9f104",
        noir: "#000",
        orange: "#ff9500",
        gris: "#959595",
      },
    },
  },
} as Options;
