import { RouteContext } from "$fresh/server.ts";
import { demo } from "../../demo.ts";
import { Route } from "../../types.ts";

import {
  PageSizes,
  PDFDocument,
  rgb,
  StandardFonts,
} from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";
import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit@^1.0.0?dts";
import { Color, isDark } from "../../colors.ts";

export const getPrintBgColor = (color: Color) => {
  switch (color) {
    case "rouge":
      return rgb(187 / 255, 30 / 255, 16 / 255);
    case "beige":
      return rgb(220 / 255, 150 / 255, 130 / 255);
    case "bleu":
      return rgb(0 / 255, 124 / 255, 176 / 255);
    case "violet":
      return rgb(130 / 255, 76 / 255, 172 / 255);
    case "rose":
      return rgb(255 / 255, 100 / 255, 170 / 255);
    case "vert":
      return rgb(0 / 255, 139 / 255, 41 / 255);
    case "vert-2":
      return rgb(64 / 255, 255 / 255, 0 / 255);
    case "jaune":
      return rgb(247 / 255, 220 / 255, 0 / 255);
    case "noir":
      return rgb(0 / 255, 0 / 255, 0 / 255);
    case "orange":
      return rgb(255 / 255, 160 / 255, 0 / 255);
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

const WIDTH = 156;
const HEIGHT = 241;

// Create a new PDF document with one page and some text
async function createPdf(lines: Route[][]) {
  const routes = lines.flatMap((routes) => routes).filter((r) =>
    // r.setAt === "2024 fev"
    true
  );

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontBytes = await Deno.readFile("./static/garamond.ttf");
  const garamond = await pdfDoc.embedFont(fontBytes);

  for (let i = 0; i < routes.length; i += 9) {
    const chunk = routes.slice(i, i + 9);
    const page = pdfDoc.addPage(PageSizes.A4);

    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        const x = 30 * (i + 1) + i * WIDTH;
        const y = 30 * (j + 1) + j * HEIGHT;
        const route = chunk[i * 3 + j];
        if (!route) {
          continue;
        }

        page.drawRectangle({
          x: x - 1,
          y: y - 1,
          width: WIDTH + 2,
          height: HEIGHT + 2,
          opacity: 0,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        page.drawRectangle({
          x,
          y: y + HEIGHT / 2,
          width: WIDTH,
          height: HEIGHT / 2,
          color: getPrintBgColor(route.color),
          borderWidth: 1,
          borderColor: rgb(0, 0, 0),
          borderOpacity: 0,
        });

        let fontSize = 70;
        let textWidth = helveticaBold.widthOfTextAtSize(route.grade, fontSize);
        page.drawText(route.grade, {
          x: x + WIDTH / 2 - textWidth / 2,
          y: y + HEIGHT / 2 + 35,
          size: fontSize,
          font: helveticaBold,
          color: getPrintTextColor(route.color),
        });

        const textColor = rgb(0, 0, 0);
        page.drawLine({
          start: { x, y: y + HEIGHT / 2 },
          end: { x: x + WIDTH, y: y + HEIGHT / 2 },
          color: rgb(0, 0, 0),
        });
        if (route.setAt) {
          fontSize = 25;
          textWidth = garamond.widthOfTextAtSize(route.setAt, fontSize);
          page.drawText(route.setAt, {
            x: x + WIDTH / 2 - textWidth / 2,
            y: y + HEIGHT / 2 - 25,
            size: fontSize,
            font: garamond,
            color: textColor,
          });
        }
        if (route.author) {
          fontSize = 20;
          textWidth = garamond.widthOfTextAtSize(route.author, fontSize);
          page.drawText(route.author, {
            x: x + WIDTH / 2 - textWidth / 2,
            y: y + HEIGHT / 2 - 50,
            size: fontSize,
            font: garamond,
            color: textColor,
          });
        }
      }
    }
  }

  return pdfDoc.save();
}

export default async function Mur(req: Request, ctx: RouteContext) {
  const kv = await Deno.openKv();
  const result = await kv.get<Route[][]>(["lines", ctx.params.club], {
    consistency: "eventual",
  });
  const lines = result.value ?? demo;

  const pdfDoc = await createPdf(
    lines.map((line) =>
      line.filter((a) => a.setAt?.toLowerCase() === "2024 oct")
    ),
  );

  return new Response(pdfDoc);
}
