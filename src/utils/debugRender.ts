import type { Points, RequiredOptions } from '../trianglify'

export const debugRender = (opts: RequiredOptions, points: Points): SVGElement => {
  const doc = window.document
  const svg = window.document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', String(opts.width + 400))
  svg.setAttribute('height', String(opts.height + 400))

  points.forEach(p => {
    const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', String(p[0]))
    circle.setAttribute('cy', String(p[1]))
    circle.setAttribute('r', '2')
    svg.appendChild(circle)
  })

  const bounds = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bounds.setAttribute('x', '0')
  bounds.setAttribute('y', '0')
  bounds.setAttribute('width', String(opts.width))
  bounds.setAttribute('height', String(opts.height))
  bounds.setAttribute('stroke-width', '1')
  bounds.setAttribute('stroke', 'blue')
  bounds.setAttribute('fill', 'none')
  svg.appendChild(bounds)

  svg.setAttribute('viewBox', `-100 -100 ${opts.width + 200} ${opts.height + 200}`)
  return svg
}
