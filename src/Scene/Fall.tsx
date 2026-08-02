import { useStore } from '@nanostores/react'
import gsap from 'gsap'
import { atom } from 'nanostores'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import type { Pt } from '../../utils'
import { brickGeometry } from './Geometry'

export interface FallEvent {
  color: string
  impact: Pt
  key: number
  pos: [number, number, number]
  scale: number
}

export const $falls = atom<FallEvent[]>([])

let nextKey = 0

export const fall = (ev: Omit<FallEvent, 'key'>) => {
  $falls.set([...$falls.get(), { ...ev, key: ++nextKey }])
}

const kill = (key: number) => {
  $falls.set($falls.get().filter(f => f.key !== key))
}

/** Seconds before the loose brick is gone. */
const FLIGHT = 1.5

/** Fraction of the flight after which the brick starts fading. */
const FADE_FROM = 0.6

/** Gravity in course-heights per second squared. */
const G = -11

const DUST = 18

/** Fraction of the flight the dust cloud lives for. */
const PUFF = 0.3

export default function Fall() {
  const falls = useStore($falls)

  return (
    <>
      {falls.map(f => (
        <FallOne ev={f} key={f.key} />
      ))}
    </>
  )
}

function FallOne({ ev }: { ev: FallEvent }) {
  const groupRef = useRef<THREE.Group>(null)
  const brickRef = useRef<THREE.Mesh>(null)
  const dustRefs = useRef<(THREE.Mesh | null)[]>([])

  /**
   * Torque from a push along +Z at the click point: r x F, so hitting a
   * corner tips the brick over and hitting the middle barely spins it.
   */
  const motion = useMemo(() => {
    const [ix, iy] = ev.impact
    const r = Math.hypot(ix, iy)

    return {
      axis:
        r > 0.0001
          ? new THREE.Vector3(iy, -ix, 0).normalize()
          : new THREE.Vector3(1, 0.4, 0).normalize(),
      omega: 1.8 + r * 5.5,
      velocity: new THREE.Vector3(
        ix * 0.9,
        0.3 + Math.random() * 0.3,
        // Orthographic camera: +Z reads as nothing, so take only enough to
        // clear the wall face and spend the rest on the visible arc.
        0.8 + Math.random() * 0.4
      )
    }
  }, [ev.impact])

  const dust = useMemo(
    () =>
      Array.from({ length: DUST }, () => ({
        dir: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() * 0.7 + 0.3
        ).normalize(),
        reach: 0.5 + Math.random() * 1.2,
        size: 0.04 + Math.random() * 0.09
      })),
    []
  )

  useEffect(() => {
    const root = groupRef.current

    if (!root) return

    root.position.set(...ev.pos)
    root.scale.setScalar(ev.scale)

    const state = { t: 0 }

    const apply = () => {
      const time = state.t * FLIGHT
      const brick = brickRef.current

      if (brick) {
        brick.position.set(
          motion.velocity.x * time,
          motion.velocity.y * time + 0.5 * G * time * time,
          motion.velocity.z * time
        )

        brick.setRotationFromAxisAngle(motion.axis, motion.omega * time)
        ;(brick.material as THREE.Material).opacity =
          state.t < FADE_FROM
            ? 1
            : Math.max(0, 1 - (state.t - FADE_FROM) / (1 - FADE_FROM))
      }

      const dt = Math.min(1, state.t / PUFF)

      dustRefs.current.forEach((mesh, i) => {
        const d = dust[i]

        if (!mesh || !d) return

        mesh.position.set(
          ev.impact[0] + d.dir.x * d.reach * dt,
          ev.impact[1] + d.dir.y * d.reach * dt,
          d.dir.z * d.reach * dt
        )

        mesh.scale.setScalar(d.size * (0.4 + dt * 1.8))
        ;(mesh.material as THREE.Material).opacity = (1 - dt) * 0.7
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
  }, [dust, ev, motion])

  return (
    <group ref={groupRef}>
      <mesh castShadow geometry={brickGeometry()} ref={brickRef}>
        <meshStandardMaterial color={ev.color} roughness={0.9} transparent />
      </mesh>

      {dust.map((_d, i) => (
        <mesh
          key={`dust-${i}`}
          ref={el => {
            dustRefs.current[i] = el
          }}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#e8dccb" depthWrite={false} transparent />
        </mesh>
      ))}
    </group>
  )
}
