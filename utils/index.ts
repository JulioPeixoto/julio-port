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

export type Pt = [number, number]

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
