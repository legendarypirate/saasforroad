export type DrawMode = "none" | "circle" | "polygon" | "line" | "marker"

export type ShapeType = "circle" | "polygon" | "line" | "marker"

export interface Shape {
  id: string
  type: ShapeType
  color: string
  name: string
  /** vertices for polygon / line, or single point for marker */
  positions: [number, number][]
  /** circle only */
  center?: [number, number]
  /** circle radius in meters */
  radius?: number
}

export const DRAW_COLORS = [
  "#f5a623", // amber
  "#3ddc84", // green
  "#f0553f", // red
  "#3b82f6", // blue
  "#e8c34a", // yellow
  "#ec4899", // pink
]

/** Great-circle distance between two [lat,lng] points in meters. */
export function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Rough area of a polygon (planar approximation) in km². */
export function polygonAreaKm2(positions: [number, number][]): number {
  if (positions.length < 3) return 0
  const R = 6371
  let total = 0
  for (let i = 0; i < positions.length; i++) {
    const [lat1, lng1] = positions[i]
    const [lat2, lng2] = positions[(i + 1) % positions.length]
    total +=
      ((lng2 - lng1) * Math.PI) / 180 *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180))
  }
  return Math.abs((total * R * R) / 2)
}

export function formatMeters(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
}

/** Total length of a polyline in meters. */
export function lineLength(positions: [number, number][]): number {
  let total = 0
  for (let i = 1; i < positions.length; i++) total += haversine(positions[i - 1], positions[i])
  return total
}
