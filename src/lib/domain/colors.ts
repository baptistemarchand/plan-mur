export const colors = [
  'blanc',
  'gris',
  'noir',
  'rose',
  'violet',
  'bleu',
  'jaune',
  'orange',
  'rouge',
  'vert',
  'vert-2',
  'beige',
] as const

export type Color = (typeof colors)[number]

const LIGHT: readonly Color[] = ['blanc', 'jaune', 'orange', 'beige', 'vert-2']
const DARK: readonly Color[] = ['noir', 'bleu', 'violet', 'rouge', 'vert']

const isLight = (color: Color) => LIGHT.includes(color)
export const isDark = (color: Color) => DARK.includes(color)

const BG: Record<Color, string> = {
  blanc: 'bg-white',
  gris: 'bg-gris',
  noir: 'bg-noir',
  rose: 'bg-rose',
  violet: 'bg-violet',
  bleu: 'bg-bleu',
  jaune: 'bg-jaune',
  orange: 'bg-orange',
  rouge: 'bg-rouge',
  vert: 'bg-vert',
  'vert-2': 'bg-vert-2',
  beige: 'bg-beige',
}

const getBg = (color: Color) => BG[color]

const getTextColor = (color: Color) => (isDark(color) ? 'text-white' : 'text-black')

export const getColorClasses = (color: Color) => `${getBg(color)} ${getTextColor(color)}`

export const getInkHex = (color: Color) => (isDark(color) ? '#fff' : '#000')

export const getBorderColor = (color: Color) => (isLight(color) ? 'border-black' : 'border-white')

export const getStripesColor = (color: Color) => {
  if (color === 'noir') {
    return 'rgba(255, 255, 255, 0.4)'
  }
  return `rgba(0, 0, 0, ${isDark(color) ? '0.5' : '0.2'})`
}

// Teintes d'impression des étiquettes. Elles diffèrent volontairement des couleurs écran
export const PRINT_RGB: Record<Color, [number, number, number]> = {
  blanc: [255, 255, 255],
  gris: [149, 149, 149],
  noir: [0, 0, 0],
  rose: [255, 100, 170],
  violet: [130, 76, 172],
  bleu: [0, 124, 176],
  jaune: [247, 220, 0],
  orange: [255, 160, 0],
  rouge: [187, 30, 16],
  vert: [0, 139, 41],
  'vert-2': [64, 255, 0],
  beige: [220, 150, 130],
}
