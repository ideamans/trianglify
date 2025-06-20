/*
 * Trianglify.js
 * by @qrohlf
 *
 * Licensed under the GPLv3
 */

import Delaunator from 'delaunator'
// TODO - evaluate smaller alternatives
// (chroma bloats bundle by 40k, minified)
import chroma, { type Color, type Scale } from 'chroma-js'

import colorbrewer from './utils/colorbrewer'
import Pattern from './pattern'
import mulberry32 from './utils/mulberry32'
import * as geom from './utils/geom'
import * as colorFunctions from './utils/colorFunctions'

export interface ColorFunctionInput {
  centroid: { x: number, y: number }
  xPercent: number
  yPercent: number
  vertexIndices: number[]
  vertices: Array<[number, number]>
  xScale: Scale
  yScale: Scale
  points: Points
  opts: Options
  random: () => number
}

export type ColorFunction = (args: ColorFunctionInput) => Color
export type Points = Array<[number, number]>
export type Palette = Record<string, string[]> | string[][]

export interface Options {
  width?: number
  height?: number
  cellSize?: number
  variance?: number
  seed?: string | null | undefined
  xColors?: string | string[]
  yColors?: string | string[]
  palette?: Palette
  colorSpace?: 'rgb' | 'hsl' | 'hsv' | 'hsi' | 'lab' | 'oklab' | 'lch' | 'oklch' | 'hcl' | 'lrgb'
  colorFunction?: ColorFunction
  fill?: boolean
  strokeWidth?: number
  points?: Points | null
}

export type RequiredOptions = Required<Options>

export interface Poly {
  vertexIndices: number[]
  centroid: { x: number, y: number }
  color: Color
}

export type Polys = Poly[]

const defaultOptions: RequiredOptions = {
  width: 600,
  height: 400,
  cellSize: 75,
  variance: 0.75,
  seed: null,
  xColors: 'random',
  yColors: 'match',
  palette: colorbrewer,
  colorSpace: 'lab',
  colorFunction: colorFunctions.interpolateLinear(0.5),
  fill: true,
  strokeWidth: 0,
  points: null
}

// This function does the "core" render-independent work:
//
// 1. Parse and munge options
// 2. Setup cell geometry
// 3. Generate random points within cell geometry
// 4. Use the Delaunator library to run the triangulation
// 5. Do color interpolation to establish the fundamental coloring of the shapes
export default function trianglify (_opts: Options = {}): Pattern {
  Object.keys(_opts).forEach(k => {
    if ((defaultOptions as any)[k] === undefined) {
      throw TypeError(`Unrecognized option: ${k}`)
    }
  })
  const opts: RequiredOptions = { ...defaultOptions, ..._opts }

  if (!(opts.height > 0)) {
    throw TypeError(`invalid height: ${opts.height}`)
  }
  if (!(opts.width > 0)) {
    throw TypeError(`invalid width: ${opts.width}`)
  }

  // standard randomizer, used for point gen and layout
  const rand = mulberry32(opts.seed ?? undefined)

  const randomFromPalette = (): string[] => {
    if (Array.isArray(opts.palette)) {
      return opts.palette[Math.floor(rand() * opts.palette.length)]
    }
    const keys = Object.keys(opts.palette)
    return opts.palette[keys[Math.floor(rand() * keys.length)]]
  }

  // The first step here is to set up our color scales for the X and Y axis.
  // First, munge the shortcut options like 'random' or 'match' into real color
  // arrays. Then, set up a Chroma scale in the appropriate color space.
  const processColorOpts = (colorOpt: string | string[]): string[] => {
    switch (true) {
      case Array.isArray(colorOpt):
        return colorOpt
      case typeof colorOpt === 'string' && opts.palette !== undefined && !Array.isArray(opts.palette) && opts.palette[colorOpt] !== undefined:
        return opts.palette[colorOpt]
      case colorOpt === 'random':
        return randomFromPalette()
      default:
        throw TypeError(`Unrecognized color option: ${colorOpt}`)
    }
  }

  const xColors = processColorOpts(opts.xColors)
  const yColors = opts.yColors === 'match'
    ? xColors
    : processColorOpts(opts.yColors)

  const xScale = chroma.scale(xColors).mode(opts.colorSpace)
  const yScale = chroma.scale(yColors).mode(opts.colorSpace)

  // Our next step is to generate a pseudo-random grid of {x, y} points,
  // (or to simply utilize the points that were passed to us)
  const points = opts.points ?? getPoints(opts, rand)

  // Once we have the points array, run the triangulation
  const geomIndices = Delaunator.from(points).triangles
  // ...and then generate geometry and color data:

  // use a different (salted) randomizer for the color function so that
  // swapping out color functions doesn't change the pattern geometry itself
  const salt = 42
  const cRand = mulberry32(opts.seed != null ? `${opts.seed}${salt}` : undefined)
  const polys: Polys = []

  for (let i = 0; i < geomIndices.length; i += 3) {
    // convert shallow array-packed vertex indices into 3-tuples
    const vertexIndices = [
      geomIndices[i],
      geomIndices[i + 1],
      geomIndices[i + 2]
    ]

    // grab a copy of the actual vertices to use for calculations
    const vertices = vertexIndices.map(i => points[i])

    const { width, height } = opts
    const norm = (num: number): number => Math.max(0, Math.min(1, num))
    const centroid = geom.getCentroid(vertices as [[number, number], [number, number], [number, number]])
    const xPercent = norm(centroid.x / width)
    const yPercent = norm(centroid.y / height)

    const color = opts.colorFunction({
      centroid, // centroid of polygon, non-normalized
      xPercent, // x-coordinate of centroid, normalized to [0, 1]
      yPercent, // y-coordinate of centroid, normalized to [0, 1]
      vertexIndices, // vertex indices of the polygon
      vertices, // [x, y] vertices of the polygon
      xScale, // x-colors scale for the pattern
      yScale, // y-colors scale for the pattern
      points, // array of generated points for the pattern
      opts, // options used to initialize the pattern
      random: cRand // seeded randomization function for use by color functions
    })

    polys.push({
      vertexIndices,
      centroid,
      color // chroma color object
    })
  }

  return new Pattern(points, polys, opts)
}

const getPoints = (opts: RequiredOptions, random: () => number): Points => {
  const { width, height, cellSize, variance } = opts

  // pad by 2 cells outside the visible area on each side to ensure we fully
  // cover the 'artboard'
  const colCount = Math.floor(width / cellSize) + 4
  const rowCount = Math.floor(height / cellSize) + 4

  // determine bleed values to ensure that the grid is centered within the
  // artboard
  const bleedX = ((colCount * cellSize) - width) / 2
  const bleedY = ((rowCount * cellSize) - height) / 2

  // apply variance to cellSize to get cellJitter in pixels
  const cellJitter = cellSize * variance
  const getJitter = (): number => (random() - 0.5) * cellJitter

  const pointCount = colCount * rowCount

  const halfCell = cellSize / 2

  const points: Points = Array(pointCount).fill(null).map((_, i) => {
    const col = i % colCount
    const row = Math.floor(i / colCount)

    // [x, y]
    return [
      -bleedX + col * cellSize + halfCell + getJitter(),
      -bleedY + row * cellSize + halfCell + getJitter()
    ]
  })

  return points
}

// tweak some of the exports here
trianglify.utils = {
  mix: chroma.mix,
  colorbrewer
}

trianglify.colorFunctions = colorFunctions
trianglify.Pattern = Pattern
trianglify.defaultOptions = defaultOptions
