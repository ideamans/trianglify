// Type definitions for geometric operations
type Point = [number, number]
type Triangle = [Point, Point, Point]
interface Centroid { x: number, y: number }

// Given an array of coordinates representing a triangle, find the centroid
// of the triangle and return it as an {x, y} object
// Accepts a single [[x, y], [x, y], [x, y]] argument
export const getCentroid = (d: Triangle): Centroid => {
  return {
    x: (d[0][0] + d[1][0] + d[2][0]) / 3,
    y: (d[0][1] + d[1][1] + d[2][1]) / 3
  }
}

export const getTopmostVertexIndex = (
  vertexIndices: number[],
  points: Point[]
): number => (
  vertexIndices.reduce(
    (topmost, i) => (points[i][1] < points[topmost][1] ? i : topmost),
    vertexIndices[0]
  )
)
