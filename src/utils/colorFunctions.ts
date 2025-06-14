import chroma from 'chroma-js'
import type { ColorFunction } from '../trianglify'

// Built in color functions provided for your convenience.
//
// Usage example:
//
// const pattern = trianglify({
//  width: 300,
//  height: 200,
//  colorFunction: trianglify.colorFunctions.sparkle(0.2)
// })
//
// the snippet above gives you a trianglify pattern with a 20% random
// jitter applied to the x and y gradient scales

// Linear interpolation of two gradients, one for the x and one for the y
// axis. This is the default Trianglify color function.
// The bias parameter controls how prevalent the y axis is versus the x axis
export const interpolateLinear = (bias: number = 0.5): ColorFunction =>
  ({ xPercent, yPercent, xScale, yScale, opts }) =>
    chroma.mix(xScale(xPercent), yScale(yPercent), bias, opts.colorSpace)

// Give the pattern a 'sparkle' effect by introducing random noise into the
// x and y gradients, making for higher contrast between cells.
export const sparkle = (jitterFactor: number = 0.15): ColorFunction =>
  ({ xPercent, yPercent, xScale, yScale, opts, random }) => {
    const jitter = (): number => (random() - 0.5) * jitterFactor
    const a = xScale(xPercent + jitter())
    const b = yScale(yPercent + jitter())
    return chroma.mix(a, b, 0.5, opts.colorSpace)
  }

// This is similar to the sparkle effect, but instead of swapping colors around
// it darkens cells by a random amount. The shadowIntensity parameter controls
// how dark the darkest shadows are.
export const shadows = (shadowIntensity: number = 0.8): ColorFunction => {
  return ({ xPercent, yPercent, xScale, yScale, opts, random }) => {
    const a = xScale(xPercent)
    const b = yScale(yPercent)
    const color = chroma.mix(a, b, 0.5, opts.colorSpace)
    return color.darken(shadowIntensity * random())
  }
}
