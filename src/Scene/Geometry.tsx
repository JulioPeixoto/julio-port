import * as THREE from 'three'

import { BRICK, createShape } from '../../utils'

const BEVEL = 0.025

let cached: THREE.ExtrudeGeometry | null = null

/**
 * One brick, shared between the instanced wall and the loose brick that falls
 * out of it, so the two can never drift apart.
 */
export function brickGeometry() {
  if (!cached) {
    cached = new THREE.ExtrudeGeometry(
      createShape(BRICK.width, BRICK.height, 0.04),
      {
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: BEVEL,
        bevelThickness: BEVEL,
        curveSegments: 2,
        depth: BRICK.depth - BEVEL * 2
      }
    )

    cached.center()
  }

  return cached
}

export default function Geometry() {
  return <primitive attach="geometry" object={brickGeometry()} />
}
