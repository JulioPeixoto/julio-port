import { useStore } from '@nanostores/react'
import gsap from 'gsap'
import { atom } from 'nanostores'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import type { Pt } from '../../utils'
import { BRICK, fractureSeeds, polygonCentroid, voronoiCells } from '../../utils'

export interface ShatterEvent {
  color: string
  impact: Pt
  key: number
  pos: [number, number, number]
  scale: number
}

export const $shatters = atom<ShatterEvent[]>([])

let nextKey = 0

export const shatter = (ev: Omit<ShatterEvent, 'key'>) => {
  $shatters.set([...$shatters.get(), { ...ev, key: ++nextKey }])
}

const kill = (key: number) => {
  $shatters.set($shatters.get().filter(s => s.key !== key))
}

const SHARDS = 16

/** Seconds of flight before the rubble is gone. */
const FLIGHT = 1.6

/** Fraction of the flight after which shards start fading. */
const FADE_FROM = 0.55

/** Gravity in course-heights per second squared. */
const G = -11

export default function Shatter() {
  const shatters = useStore($shatters)

  return (
    <>
      {shatters.map(s => (
        <ShatterOne ev={s} key={s.key} />
      ))}
    </>
  )
}

function ShatterOne({ ev }: { ev: ShatterEvent }) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  const shards = useMemo(() => {
    const seeds = fractureSeeds(BRICK.width, BRICK.height, ev.impact, SHARDS)
    const reach = Math.hypot(BRICK.width, BRICK.height) * 0.5

    return voronoiCells(BRICK.width, BRICK.height, seeds).map(poly => {
      const [cx, cy] = polygonCentroid(poly)

      const shape = new THREE.Shape()

      shape.moveTo(poly[0][0], poly[0][1])
      poly.slice(1).forEach(([x, y]) => shape.lineTo(x, y))
      shape.closePath()

      const geometry = new THREE.ExtrudeGeometry(shape, {
        bevelEnabled: false,
        depth: BRICK.depth
      })

      geometry.translate(-cx, -cy, -BRICK.depth / 2)

      const dx = cx - ev.impact[0]
      const dy = cy - ev.impact[1]
      const dist = Math.hypot(dx, dy) || 0.0001

      // Shards closest to the strike carry the most energy.
      const speed = 3.4 / (1 + dist / reach)

      return {
        axis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        geometry,
        omega: speed * (1.8 + Math.random() * 2.6),
        origin: new THREE.Vector3(cx, cy, 0),
        velocity: new THREE.Vector3(
          (dx / dist) * speed,
          (dy / dist) * speed + speed * 0.7,
          speed * (0.6 + Math.random() * 0.6)
        )
      }
    })
  }, [ev.impact])

  useEffect(() => {
    const root = groupRef.current

    if (!root) return

    root.position.set(...ev.pos)
    root.scale.setScalar(ev.scale)

    const state = { t: 0 }

    const apply = () => {
      const time = state.t * FLIGHT

      const fade =
        state.t < FADE_FROM
          ? 1
          : Math.max(0, 1 - (state.t - FADE_FROM) / (1 - FADE_FROM))

      meshRefs.current.forEach((mesh, i) => {
        const s = shards[i]

        if (!mesh || !s) return

        mesh.position.set(
          s.origin.x + s.velocity.x * time,
          s.origin.y + s.velocity.y * time + 0.5 * G * time * time,
          s.origin.z + s.velocity.z * time
        )

        mesh.setRotationFromAxisAngle(s.axis, s.omega * time)
        ;(mesh.material as THREE.Material[]).forEach(m => {
          m.opacity = fade
        })
      })
    }

    apply()

    const tween = gsap.to(state, {
      duration: FLIGHT,
      ease: 'none',
      onComplete: () => kill(ev.key),
      onUpdate: apply,
      t: 1
    })

    return () => {
      tween.kill()
    }
  }, [ev, shards])

  useEffect(() => () => shards.forEach(s => s.geometry.dispose()), [shards])

  return (
    <group ref={groupRef}>
      {shards.map((s, i) => (
        <mesh
          castShadow
          geometry={s.geometry}
          key={i}
          ref={el => {
            meshRefs.current[i] = el
          }}>
          <meshStandardMaterial
            attach="material-0"
            color={ev.color}
            roughness={0.9}
            transparent
          />
          <meshStandardMaterial
            attach="material-1"
            color="#cbbba8"
            roughness={1}
            transparent
          />
        </mesh>
      ))}
    </group>
  )
}
