import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

import { BRICK, createShape } from '../../utils'

const BEVEL = 0.025

export default function Geometry() {
  const geometry = useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(
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

    geometry.center()

    return geometry
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  return <primitive attach="geometry" object={geometry} />
}
