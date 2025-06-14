interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  webkitBackingStorePixelRatio?: number
  mozBackingStorePixelRatio?: number
  msBackingStorePixelRatio?: number
  oBackingStorePixelRatio?: number
  backingStorePixelRatio?: number
}

export default function getScalingRatio (ctx: ExtendedCanvasRenderingContext2D): number {
  // adapted from https://gist.github.com/callumlocke/cc258a193839691f60dd
  const backingStoreRatio = (
    ctx.webkitBackingStorePixelRatio ??
    ctx.mozBackingStorePixelRatio ??
    ctx.msBackingStorePixelRatio ??
    ctx.oBackingStorePixelRatio ??
    ctx.backingStorePixelRatio ?? 1
  )

  const devicePixelRatio = (typeof window !== 'undefined' ? window.devicePixelRatio : undefined) ?? 1
  const drawRatio = devicePixelRatio / backingStoreRatio
  return drawRatio
}
