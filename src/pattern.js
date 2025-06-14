const isBrowser = (typeof window !== 'undefined' && typeof document !== 'undefined')
const doc = isBrowser && document

// utility for building up SVG node trees with the DOM API
const sDOM = (tagName, attrs = {}, children, existingRoot) => {
  const elem = existingRoot || doc.createElementNS('http://www.w3.org/2000/svg', tagName)
  Object.keys(attrs).forEach(
    k => attrs[k] !== undefined && elem.setAttribute(k, attrs[k])
  )
  children && children.forEach(c => elem.appendChild(c))
  return elem
}

// serialize attrs object to XML attributes. Assumes everything is already
// escaped (safe input).
const serializeAttrs = attrs => (
  Object.entries(attrs)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}='${v}'`)
    .join(' ')
)

// minimal XML-tree builder for use in Node
const sNode = (tagName, attrs = {}, children) => ({
  tagName,
  attrs,
  children,
  toString: () => `<${tagName} ${serializeAttrs(attrs)}>${children ? children.join('') : ''}</${tagName}>`
})

export default class Pattern {
  constructor (points, polys, opts) {
    this.points = points
    this.polys = polys
    this.opts = opts
  }

  _toSVG = (serializer, destSVG, _svgOpts = {}) => {
    const s = serializer
    const defaultSVGOptions = { includeNamespace: true, coordinateDecimals: 1 }
    const svgOpts = { ...defaultSVGOptions, ..._svgOpts }
    const { points, opts, polys } = this
    const { width, height } = opts

    // only round points if the coordinateDecimals option is non-negative
    // set coordinateDecimals to -1 to disable point rounding
    const roundedPoints = (svgOpts.coordinateDecimals < 0) ? points : points.map(
      p => p.map(x => +x.toFixed(svgOpts.coordinateDecimals))
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

    const svg = s(
      'svg',
      {
        xmlns: svgOpts.includeNamespace ? 'http://www.w3.org/2000/svg' : undefined,
        width,
        height
      },
      paths,
      destSVG
    )

    return svg
  }

  toSVGTree = (svgOpts) => this._toSVG(sNode, null, svgOpts)

  toSVG = isBrowser
    ? (destSVG, svgOpts) => this._toSVG(sDOM, destSVG, svgOpts)
    : (destSVG, svgOpts) => this.toSVGTree(svgOpts)
}
