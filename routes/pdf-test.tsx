import { RouteContext } from "$fresh/server.ts";

import {
  PageSizes,
  PDFDocument,
  rgb,
  StandardFonts,
} from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";
import { colors, getPrintBgColor, getPrintTextColor } from "../colors.ts";

async function createPdf() {
  const pdfDoc = await PDFDocument.create();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const WIDTH = 130;
  const HEIGHT = 130;

  const page = pdfDoc.addPage(PageSizes.A4);

  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 3; i++) {
      const x = 20 * (i + 1) + i * WIDTH;
      const y = 20 * (j + 1) + j * HEIGHT;
      const color = colors[i * 5 + j];
      if (!color) {
        continue;
      }

      page.drawRectangle({
        x,
        y: y + HEIGHT / 2,
        width: WIDTH,
        height: HEIGHT,
        color: getPrintBgColor(color),
        borderWidth: 1,
        borderColor: rgb(0, 0, 0),
        borderOpacity: 0,
      });

      const fontSize = 70;
      const textWidth = helveticaBold.widthOfTextAtSize("A", fontSize);
      page.drawText("A", {
        x: x + WIDTH / 2 - textWidth / 2,
        y: y + HEIGHT / 2 + 35,
        size: fontSize,
        pdfDoc,
        font: helveticaBold,
        color: getPrintTextColor(color),
      });
    }
  }

  return pdfDoc.save();
}

export default async function Mur(req: Request, ctx: RouteContext) {
  const pdfDoc = await createPdf();

  return new Response(pdfDoc);
}
