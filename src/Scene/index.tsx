import { Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { lazy, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import type { Pt } from '../../utils'
import { BRICK } from '../../utils'
import Fall, { fall } from './Fall'
import type { IconSlot } from './Socials'
import Socials, { SOCIALS } from './Socials'

const Geometry = lazy(() => import('./Geometry'))
const Material = lazy(() => import('./Material'))
const Particle = lazy(() => import('./Particle'))

const ROT: [number, number, number] = [Math.PI / 36, -Math.PI / 9, 0]

/** Brick heals well before its rubble finishes falling. */
const HIDE_MS = 3000

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

  const groupRef = useRef<THREE.Group>(null)

  const [hidden, setHidden] = useState<Set<number>>(() => new Set())
  const [placement, setPlacement] = useState<Record<string, number>>({})

  /**
   * The wall overhangs the viewport on every side, so icons are only ever
   * dropped on the middle band that is actually on screen.
   */
  const pickId = (exclude: Set<number>) => {
    const cLo = Math.floor(cols * 0.36)
    const cHi = Math.max(cLo + 1, Math.ceil(cols * 0.62))
    const rLo = Math.floor(courses * 0.26)
    const rHi = Math.max(rLo + 1, Math.ceil(courses * 0.74))

    const at = (r: number, c: number) => r * cols + c

    for (let n = 0; n < 80; n += 1) {
      const id = at(
        rLo + Math.floor(Math.random() * (rHi - rLo)),
        cLo + Math.floor(Math.random() * (cHi - cLo))
      )

      if (id < count && !exclude.has(id)) return id
    }

    for (let r = rLo; r < rHi; r += 1) {
      for (let c = cLo; c < cHi; c += 1) {
        const id = at(r, c)

        if (id < count && !exclude.has(id)) return id
      }
    }

    return -1
  }

  useEffect(() => {
    const used = new Set<number>()

    setPlacement(
      SOCIALS.reduce<Record<string, number>>((acc, s) => {
        const id = pickId(used)

        used.add(id)
        acc[s.key] = id

        return acc
      }, {})
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, courses, count])

  const onClickCell = (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined) return

    e.stopPropagation()

    const id = e.instanceId

    if (hidden.has(id)) return

    const [bx, by] = cellPos(id)
    const local = groupRef.current
      ? groupRef.current.worldToLocal(e.point.clone())
      : e.point.clone()

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

    const social = SOCIALS.find(s => placement[s.key] === id)

    if (social) {
      if (social.url.startsWith('mailto:')) {
        window.location.href = social.url
      } else {
        window.open(social.url, '_blank', 'noopener,noreferrer')
      }

      setPlacement(p => ({
        ...p,
        [social.key]: pickId(new Set([...Object.values(p), ...hidden, id]))
      }))
    }

    setHidden(s => new Set(s).add(id))

    fall({ color, impact, pos: cellPos(id), scale: spacingY })

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

  /**
   * Held apart from `bricks` so breaking one brick does not hand every other
   * one a fresh position array, which would restart their idle animations.
   */
  const positions = useMemo(
    () => Array.from({ length: count }, (_, i) => cellPos(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cols, count, courses, spacingX, spacingY]
  )

  const bricks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (
        <Particle
          color={color}
          hidden={hidden.has(i)}
          id={i}
          key={`${cols}-${courses}-${i}`}
          position={positions[i]}
          spacing={spacingY}
        />
      )),
    [color, cols, count, courses, hidden, positions, spacingY]
  )

  const slots = useMemo<IconSlot[]>(
    () =>
      SOCIALS.map(s => {
        const id = placement[s.key]
        const placed = id !== undefined && id >= 0 && id < count

        return {
          key: s.key,
          position: placed ? cellPos(id) : [0, 0, 0],
          visible: placed && !hidden.has(id)
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cols, count, courses, hidden, placement, spacingX, spacingY]
  )

  const mortarZ = (BRICK.depth / 2 - 0.14) * spacingY

  return (
    <group ref={groupRef} rotation={ROT}>
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

      <Socials scale={spacingY} slots={slots} />

      <Fall />
    </group>
  )
}
