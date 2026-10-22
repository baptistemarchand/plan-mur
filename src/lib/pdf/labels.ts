import {PageSizes, PDFDocument, rgb, StandardFonts, type RGB} from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import {isDark, PRINT_RGB} from '$lib/domain/colors'
import type {RouteWithLineIndex} from '$lib/domain/routes'
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

const NOTE_WIDTH = WIDTH - 52
const NOTE_MAX_LINES = 2

type Measure = (text: string, size: number) => number

const wrap = (text: string, size: number, measure: Measure): string[] =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((lines, word) => {
      const last = lines.at(-1)
      if (last !== undefined && measure(`${last} ${word}`, size) <= NOTE_WIDTH) {
        lines[lines.length - 1] = `${last} ${word}`
      } else {
        lines.push(word)
      }
      return lines
    }, [])

/** Plus grande taille, de 13 à 7, où la note tient en deux lignes ; au-delà, elle rétrécit encore. */
export const fitNote = (note: string, measure: Measure): {lines: string[]; size: number} => {
  for (let size = 13; size >= 7; size--) {
    const lines = wrap(note, size, measure)
    if (lines.length <= NOTE_MAX_LINES && lines.every(line => measure(line, size) <= NOTE_WIDTH)) {
      return {lines, size}
    }
  }
  // Deux lignes à 7 ne suffisent pas : on coupe en deux moitiés de mots et on rétrécit.
  const words = note.split(/\s+/).filter(Boolean)
  const half = Math.ceil(words.length / 2)
  const lines = [words.slice(0, half).join(' '), words.slice(half).join(' ')].filter(Boolean)
  const widest = Math.max(...lines.map(line => measure(line, 7)))
  return {lines, size: Math.min(7, (7 * NOTE_WIDTH) / widest)}
}

export const createLabelsPdf = async (routes: RouteWithLineIndex[], fontBytes: ArrayBuffer): Promise<ArrayBuffer> => {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)

  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica)
  const garamond = await pdf.embedFont(fontBytes)
  const black = rgb(0, 0, 0)
  const gray = rgb(0.45, 0.45, 0.45)

  for (let offset = 0; offset < routes.length; offset += PER_PAGE) {
    const chunk = routes.slice(offset, offset + PER_PAGE)
    const page = pdf.addPage(PageSizes.A4)

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
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

        if (route.note) {
          const {lines, size} = fitNote(route.note, (text, size) => garamond.widthOfTextAtSize(text, size))
          lines.forEach((text, i) =>
            page.drawText(text, {
              x: centered(text, garamond, size),
              y: middle - 78 - i * (size + 2),
              size,
              font: garamond,
              color: black,
            }),
          )
        }

        const line = `L${route.lineIndex + 1}`
        page.drawText(line, {
          x: x + WIDTH - helvetica.widthOfTextAtSize(line, 10) - 8,
          y: y + 8,
          size: 10,
          font: helvetica,
          color: gray,
        })
      }
    }
  }

  const bytes = await pdf.save()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}
