import {readFileSync} from 'node:fs'
import fontkit from '@pdf-lib/fontkit'
import {PDFDocument} from 'pdf-lib'
import {describe, expect, it} from 'vitest'
import type {RouteWithLineIndex} from '$lib/domain/routes'
import {createLabelsPdf, fitNote} from './labels'

const font = readFileSync('static/garamond.ttf')
const fontBytes = font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength)

const routes = (count: number): RouteWithLineIndex[] =>
  Array.from({length: count}, (_, i) => ({
    id: String(i),
    color: 'bleu',
    grade: '6a',
    setAt: '2025 oct',
    author: 'seb',
    note: null,
    toRemove: false,
    toOpen: false,
    deletedAt: null,
    lineIndex: i,
  }))

const pageCount = async (count: number) => {
  const bytes = await createLabelsPdf(routes(count), fontBytes as ArrayBuffer)
  return (await PDFDocument.load(bytes)).getPageCount()
}

describe('fitNote', () => {
  const measureWith = async () => {
    const pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit)
    const garamond = await pdf.embedFont(fontBytes as ArrayBuffer)
    return (text: string, size: number) => garamond.widthOfTextAtSize(text, size)
  }

  it('garde une note courte sur une ligne, en grand', async () => {
    expect(fitNote('départ assis', await measureWith())).toEqual({lines: ['départ assis'], size: 13})
  })

  it('passe une note longue sur deux lignes', async () => {
    const {lines, size} = fitNote('départ assis, pieds sur les prises de la voie jaune uniquement', await measureWith())
    expect(lines).toHaveLength(2)
    expect(size).toBeLessThan(13)
  })
})

describe('createLabelsPdf', () => {
  it('met neuf étiquettes par page', async () => {
    expect(await pageCount(9)).toBe(1)
    expect(await pageCount(10)).toBe(2)
    expect(await pageCount(18)).toBe(2)
    expect(await pageCount(19)).toBe(3)
  })

  it('imprime une note, même trop longue pour la largeur', async () => {
    const [route] = routes(1)
    const bytes = await createLabelsPdf(
      [{...route, note: 'départ assis, pieds sur les prises de la voie jaune uniquement'}],
      fontBytes as ArrayBuffer,
    )
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1)
  })

  it('accepte une voie sans session ni ouvreur', async () => {
    const bytes = await createLabelsPdf(
      [
        {
          id: 'a',
          color: 'noir',
          grade: '7a',
          setAt: null,
          author: null,
          note: null,
          toRemove: false,
          toOpen: false,
          deletedAt: null,
          lineIndex: 0,
        },
      ],
      fontBytes as ArrayBuffer,
    )
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1)
  })
})
