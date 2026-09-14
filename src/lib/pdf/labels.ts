import {PageSizes, PDFDocument, rgb, StandardFonts, type RGB} from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import {isDark, PRINT_RGB} from '$lib/domain/colors'
import type {Route} from '$lib/domain/types'

// Étiquettes A4, 9 par page, à découper et coller au mur.
const WIDTH = 156
const HEIGHT = 241
const MARGIN = 30
const PER_PAGE = 9

const printColor = (route: Route): RGB => {
  const [r, g, b] = PRINT_RGB[route.color]
  return rgb(r / 255, g / 255, b / 255)
}

const printTextColor = (route: Route): RGB => (isDark(route.color) ? rgb(1, 1, 1) : rgb(0, 0, 0))

export const createLabelsPdf = async (routes: Route[], fontBytes: ArrayBuffer): Promise<ArrayBuffer> => {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)

  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const garamond = await pdf.embedFont(fontBytes)
  const black = rgb(0, 0, 0)

  for (let offset = 0; offset < routes.length; offset += PER_PAGE) {
    const chunk = routes.slice(offset, offset + PER_PAGE)
    const page = pdf.addPage(PageSizes.A4)

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Remplissage par colonne, comme dans la version Fresh : l'ordre
        // des étiquettes sur la feuille doit rester le même.
        const route = chunk[col * 3 + row]
        if (!route) {
          continue
        }

        const x = MARGIN * (col + 1) + col * WIDTH
        const y = MARGIN * (row + 1) + row * HEIGHT
        const middle = y + HEIGHT / 2

        page.drawRectangle({
          x: x - 1,
          y: y - 1,
          width: WIDTH + 2,
          height: HEIGHT + 2,
          opacity: 0,
          borderColor: black,
          borderWidth: 1,
        })
        page.drawRectangle({
          x,
          y: middle,
          width: WIDTH,
          height: HEIGHT / 2,
          color: printColor(route),
          borderWidth: 1,
          borderColor: black,
          borderOpacity: 0,
        })

        const centered = (text: string, font: typeof garamond, size: number) =>
          x + WIDTH / 2 - font.widthOfTextAtSize(text, size) / 2

        page.drawText(route.grade, {
          x: centered(route.grade, helveticaBold, 70),
          y: middle + 35,
          size: 70,
          font: helveticaBold,
          color: printTextColor(route),
        })

        page.drawLine({
          start: {x, y: middle},
          end: {x: x + WIDTH, y: middle},
          color: black,
        })

        if (route.setAt) {
          page.drawText(route.setAt, {
            x: centered(route.setAt, garamond, 25),
            y: middle - 25,
            size: 25,
            font: garamond,
            color: black,
          })
        }
        if (route.author) {
          page.drawText(route.author, {
            x: centered(route.author, garamond, 20),
            y: middle - 50,
            size: 20,
            font: garamond,
            color: black,
          })
        }
      }
    }
  }

  const bytes = await pdf.save()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}
