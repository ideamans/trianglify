import type { Points, Polys, RequiredOptions } from './trianglify'

const isBrowser = (typeof window !== 'undefined' && typeof document !== 'undefined')
const doc = isBrowser ? document : null

interface SVGAttributes {
  [key: string]: string | number | undefined
}

interface SVGNode {
  tagName: string
  attrs: SVGAttributes
  children?: SVGNode[]
  toString: () => string
}

export interface SVGOptions {
  includeNamespace?: boolean
  coordinateDecimals?: number
}

// utility for building up SVG node trees with the DOM API
const sDOM = (
  tagName: string,
  attrs: SVGAttributes = {},
  children?: Array<SVGElement | SVGNode>,
  existingRoot?: SVGElement
): SVGElement => {
  const elem = existingRoot ?? doc?.createElementNS('http://www.w3.org/2000/svg', tagName)
  if (elem == null) throw new Error('Unable to create SVG element')
  Object.keys(attrs).forEach(
    k => attrs[k] !== undefined && elem.setAttribute(k, String(attrs[k]))
  )
  if (children != null) {
    children.forEach(c => {
      if (c instanceof SVGElement) {
        elem.appendChild(c)
      }
    })
  }
  return elem
}

// serialize attrs object to XML attributes. Assumes everything is already
// escaped (safe input).
const serializeAttrs = (attrs: SVGAttributes): string => (
  Object.entries(attrs)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}='${String(v)}'`)
    .join(' ')
)

// minimal XML-tree builder for use in Node
const sNode = (
  tagName: string,
  attrs: SVGAttributes = {},
  children?: SVGNode[]
): SVGNode => ({
  tagName,
  attrs,
  children,
  toString: () => `<${tagName} ${serializeAttrs(attrs)}>${(children != null) ? children.map(c => c.toString()).join('') : ''}</${tagName}>`
})

export default class Pattern {
  points: Points
  polys: Polys
  opts: RequiredOptions

  constructor (points: Points, polys: Polys, opts: RequiredOptions) {
    this.points = points
    this.polys = polys
    this.opts = opts
  }

  private readonly _toSVG = (
    serializer: typeof sDOM | typeof sNode,
    destSVG: SVGElement | null,
    _svgOpts: SVGOptions = {}
  ): SVGElement | SVGNode => {
    const s = serializer
    const defaultSVGOptions: Required<SVGOptions> = { includeNamespace: true, coordinateDecimals: 1 }
    const svgOpts: Required<SVGOptions> = { ...defaultSVGOptions, ..._svgOpts }
    const { points, opts, polys } = this
    const { width, height } = opts

    // only round points if the coordinateDecimals option is non-negative
    // set coordinateDecimals to -1 to disable point rounding
    const roundedPoints = (svgOpts.coordinateDecimals < 0)
      ? points
      : points.map(
        p => p.map(x => +x.toFixed(svgOpts.coordinateDecimals)) as [number, number]
      )

    const paths = polys.map((poly) => {
      const xys = poly.vertexIndices.map(i => `${roundedPoints[i][0]},${roundedPoints[i][1]}`)
      const d = 'M' + xys.join('L') + 'Z'
      const hasStroke = opts.strokeWidth > 0
      // shape-rendering crispEdges resolves the antialiasing issues, at the
      // potential cost of some visual degradation. For the best performance
      // *and* best visual rendering, use Canvas.
      return s('path', {
        d,
        fill: opts.fill ? poly.color.css() : undefined,
        stroke: hasStroke ? poly.color.css() : undefined,
        'stroke-width': hasStroke ? opts.strokeWidth : undefined,
        'stroke-linejoin': hasStroke ? 'round' : undefined,
        'shape-rendering': opts.fill ? 'crispEdges' : undefined
      })
    })

    const svg = s === sDOM && (destSVG != null)
      ? s('svg', {
        xmlns: svgOpts.includeNamespace ? 'http://www.w3.org/2000/svg' : undefined,
        width,
        height
      }, paths, destSVG)
      : s('svg', {
        xmlns: svgOpts.includeNamespace ? 'http://www.w3.org/2000/svg' : undefined,
        width,
        height
      }, paths as SVGNode[])

    return svg
  }

  toSVGTree = (svgOpts?: SVGOptions): SVGNode => this._toSVG(sNode, null, svgOpts) as SVGNode

  toSVG = isBrowser
    ? (destSVG?: SVGElement, svgOpts?: SVGOptions): SVGElement => this._toSVG(sDOM, destSVG ?? null, svgOpts) as SVGElement
    : (destSVG?: SVGElement, svgOpts?: SVGOptions): SVGNode => this.toSVGTree(svgOpts)
}
