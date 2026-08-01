import * as THREE from 'three'

export const eps = 0.00001

/**
 * Metric brick, in units of one course (brick + one mortar joint = 75mm).
 * Actual brick is 215 x 102.5 x 65mm, laid on a 225 x 112.5 x 75mm module,
 * so the joint falls out of the difference rather than being drawn.
 */
export const BRICK = {
  courseH: 1,
  courseW: 3,
  depth: 102.5 / 75,
  height: 65 / 75,
  width: 215 / 75
}

export function createShape(w: number, h: number, rad: number) {
  const s = new THREE.Shape()
  const r = (rad - eps) * 1.5

  return s
    .moveTo(r, 0)
    .lineTo(w - r, 0)
    .quadraticCurveTo(w, 0, w, r)
    .lineTo(w, h - r)
    .quadraticCurveTo(w, h, w - r, h)
    .lineTo(r, h)
    .quadraticCurveTo(0, h, 0, h - r)
    .lineTo(0, r)
    .quadraticCurveTo(0, 0, r, 0)
}

export type Pt = [number, number]

/**
 * Sutherland-Hodgman clip against the half-plane of points closer to `a`
 * than to `b` — the perpendicular bisector of the two seeds.
 */
export function clipToBisector(poly: Pt[], a: Pt, b: Pt): Pt[] {
  const nx = b[0] - a[0]
  const ny = b[1] - a[1]
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2

  const side = (p: Pt) => (p[0] - mx) * nx + (p[1] - my) * ny

  const out: Pt[] = []

  for (let i = 0; i < poly.length; i += 1) {
    const cur = poly[i]
    const nxt = poly[(i + 1) % poly.length]
    const dc = side(cur)
    const dn = side(nxt)

    if (dc <= 0) out.push(cur)

    if (dc <= 0 !== dn <= 0) {
      const t = dc / (dc - dn)

      out.push([
        cur[0] + (nxt[0] - cur[0]) * t,
        cur[1] + (nxt[1] - cur[1]) * t
      ])
    }
  }

  return out
}

/**
 * Seeds clustered on the impact point: radius scales as u^bias with u
 * uniform, so shards come out small at the strike and coarse at the edges,
 * the way brittle material actually fails.
 */
export function fractureSeeds(
  w: number,
  h: number,
  impact: Pt,
  count: number,
  bias = 1.9
): Pt[] {
  const reach = Math.hypot(w, h) * 0.75
  const hw = w / 2
  const hh = h / 2

  return Array.from({ length: count }, () => {
    const r = reach * Math.random() ** bias
    const a = Math.random() * Math.PI * 2

    return [
      Math.max(-hw, Math.min(hw, impact[0] + Math.cos(a) * r)),
      Math.max(-hh, Math.min(hh, impact[1] + Math.sin(a) * r))
    ] as Pt
  })
}

export function voronoiCells(w: number, h: number, seeds: Pt[]): Pt[][] {
  const hw = w / 2
  const hh = h / 2

  const rect: Pt[] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh]
  ]

  return seeds
    .map((seed, i) => {
      let poly = rect

      for (let j = 0; j < seeds.length && poly.length; j += 1) {
        if (j !== i) poly = clipToBisector(poly, seed, seeds[j])
      }

      return poly
    })
    .filter(poly => poly.length > 2)
}

export function polygonCentroid(poly: Pt[]): Pt {
  let area = 0
  let cx = 0
  let cy = 0

  for (let i = 0; i < poly.length; i += 1) {
    const [x0, y0] = poly[i]
    const [x1, y1] = poly[(i + 1) % poly.length]
    const cross = x0 * y1 - x1 * y0

    area += cross
    cx += (x0 + x1) * cross
    cy += (y0 + y1) * cross
  }

  if (Math.abs(area) < eps) return poly[0]

  return [cx / (3 * area), cy / (3 * area)]
}
