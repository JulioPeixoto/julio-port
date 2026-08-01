import { Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { lazy, useMemo, useState } from 'react'
import * as THREE from 'three'

import { poof } from './Poof'

const Geometry = lazy(() => import('./Geometry'))
const Material = lazy(() => import('./Material'))
const Output = lazy(() => import('./Output'))
const Particle = lazy(() => import('./Particle'))
const Poof = lazy(() => import('./Poof'))

const ROT: [number, number, number] = [Math.PI / 36, -Math.PI / 9, 0]

const gridInvQ = new THREE.Quaternion()
  .setFromEuler(new THREE.Euler(...ROT))
  .invert()

const HIDE_MS = 1600

export default function Scene() {
  const { viewport } = useThree()

  const { color, gridSize } = useControls({
    color: { label: 'Color', value: '#f51155' },
    gridSize: { label: 'Grid Size', max: 20, min: 1, value: 16 }
  })

  const span = useMemo(
    () => Math.max(4, Math.max(viewport.width, viewport.height) * 1.25),
    [viewport.height, viewport.width]
  )

  const steps = Math.max(gridSize - 1, 1)
  const spacing = useMemo(() => span / steps, [span, steps])
  const count = gridSize ** 2

  const cellPos = (i: number): [number, number, number] => {
    const row = Math.floor(i / gridSize)

    return [
      ((i % gridSize) - steps / 2) * spacing + (row % 2 ? spacing / 2 : 0),
      (row - steps / 2) * spacing,
      0
    ]
  }

  const highlight = useMemo(() => {
    const target = new THREE.Vector3(
      (viewport.width / 2) * 0.4,
      (viewport.height / 2) * 0.4,
      0
    ).applyQuaternion(gridInvQ)

    let best = -1
    let bestDist = Infinity

    for (let i = 0; i < count; i += 1) {
      const [x, y] = cellPos(i)
      const dist = (x - target.x) ** 2 + (y - target.y) ** 2

      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    }

    return best
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, gridSize, spacing, steps, viewport.height, viewport.width])

  const [hidden, setHidden] = useState<Set<number>>(() => new Set())

  const onClickCell = (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined) return

    e.stopPropagation()

    const id = e.instanceId

    if (hidden.has(id)) return

    setHidden(s => new Set(s).add(id))

    poof(cellPos(id), spacing)

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

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (
        <Particle
          color={color}
          hidden={hidden.has(i)}
          highlight={i === highlight}
          id={i}
          key={`${gridSize}-${i}`}
          position={cellPos(i)}
          spacing={spacing}
        />
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, count, gridSize, hidden, highlight, spacing, steps]
  )

  return (
    <>
      <group rotation={ROT}>
        <Instances
          key={gridSize}
          onClick={onClickCell}
          onPointerOut={() => {
            document.body.style.cursor = ''
          }}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer'
          }}
          range={count}>
          <Geometry />
          <Material />

          {particles}
        </Instances>

        <Poof />
      </group>

      <Output />
    </>
  )
}
