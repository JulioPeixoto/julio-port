import { Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { lazy, useMemo, useState } from 'react'
import * as THREE from 'three'

import type { Pt } from '../../utils'
import { BRICK } from '../../utils'
import Shatter, { shatter } from './Shatter'

const Geometry = lazy(() => import('./Geometry'))
const Material = lazy(() => import('./Material'))
const Particle = lazy(() => import('./Particle'))

const ROT: [number, number, number] = [Math.PI / 36, -Math.PI / 9, 0]

const gridInvQ = new THREE.Quaternion()
  .setFromEuler(new THREE.Euler(...ROT))
  .invert()

/** Brick heals well before its rubble finishes falling. */
const HIDE_MS = 1000

export default function Scene() {
  const { viewport } = useThree()

  const { color, courses, mortar } = useControls('Muro', {
    color: { label: 'Tijolo', value: '#a8532f' },
    courses: { label: 'Fiadas', max: 30, min: 4, step: 1, value: 18 },
    mortar: { label: 'Argamassa', value: '#b9b2a4' }
  })

  const spacingY = useMemo(
    () => (viewport.height * 1.45) / courses,
    [courses, viewport.height]
  )

  const spacingX = spacingY * BRICK.courseW

  const cols = useMemo(
    () => Math.ceil((viewport.width * 1.75) / spacingX) + 2,
    [spacingX, viewport.width]
  )

  const count = cols * courses

  const cellPos = (i: number): [number, number, number] => {
    const row = Math.floor(i / cols)

    return [
      ((i % cols) - (cols - 1) / 2) * spacingX +
        (row % 2 ? spacingX / 2 : 0),
      (row - (courses - 1) / 2) * spacingY,
      0
    ]
  }

  const [hidden, setHidden] = useState<Set<number>>(() => new Set())

  const onClickCell = (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined) return

    e.stopPropagation()

    const id = e.instanceId

    if (hidden.has(id)) return

    const [bx, by] = cellPos(id)
    const local = e.point.clone().applyQuaternion(gridInvQ)

    const impact: Pt = [
      Math.max(
        -BRICK.width / 2,
        Math.min(BRICK.width / 2, (local.x - bx) / spacingY)
      ),
      Math.max(
        -BRICK.height / 2,
        Math.min(BRICK.height / 2, (local.y - by) / spacingY)
      )
    ]

    setHidden(s => new Set(s).add(id))

    shatter({ color, impact, pos: cellPos(id), scale: spacingY })

    window.setTimeout(
      () =>
        setHidden(s => {
          if (!s.has(id)) return s

          const ns = new Set(s)
          ns.delete(id)
          return ns
        }),
      HIDE_MS
    )
  }

  const bricks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (
        <Particle
          color={color}
          hidden={hidden.has(i)}
          id={i}
          key={`${cols}-${courses}-${i}`}
          position={cellPos(i)}
          spacing={spacingY}
        />
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, cols, count, courses, hidden, spacingX, spacingY]
  )

  const mortarZ = (BRICK.depth / 2 - 0.14) * spacingY

  return (
    <group rotation={ROT}>
      <mesh position={[0, 0, mortarZ]} receiveShadow>
        <planeGeometry args={[viewport.width * 3, viewport.height * 3]} />
        <meshStandardMaterial color={mortar} roughness={1} />
      </mesh>

      <Instances
        castShadow
        key={`${cols}-${courses}`}
        onClick={onClickCell}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        range={count}
        receiveShadow>
        <Geometry />
        <Material spacing={spacingY} />

        {bricks}
      </Instances>

      <Shatter />
    </group>
  )
}
