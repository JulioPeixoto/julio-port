import type { InstanceProps } from '@react-three/drei'
import { Instance } from '@react-three/drei'
import gsap from 'gsap'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n))

/**
 * Low-discrepancy sequences so each property of a brick varies independently
 * instead of drifting together.
 */
const jitter = (id: number) => [
  (id * 0.6180339887498949) % 1,
  (id * 0.7548776662466927) % 1,
  (id * 0.5698402909980532) % 1
]

const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)]

export default function Particle({
  color,
  hidden = false,
  id = 0,
  position,
  spacing,
  ...props
}: ParticleProps) {
  const ref = useRef<(THREE.Object3D & { color?: THREE.Color }) | null>(null)
  const init = useRef(false)

  const tint = useMemo(() => {
    const [s1, s2, s3] = jitter(id + 1)
    const c = new THREE.Color(color)
    const hsl = { h: 0, l: 0, s: 0 }

    c.getHSL(hsl)

    return c.setHSL(
      (hsl.h + (s1 - 0.5) * 0.035 + 1) % 1,
      clamp(hsl.s * (1 + (s2 - 0.5) * 0.45), 0, 1),
      clamp(hsl.l * (1 + (s3 - 0.5) * 0.5), 0.02, 0.95)
    )
  }, [color, id])

  /** No two bricks are laid perfectly true; this is what kills the CG look. */
  const flaw = useMemo(() => {
    const [s1, s2, s3] = jitter(id * 3 + 11)

    return {
      depth: (s3 - 0.5) * 0.07,
      rotY: (s2 - 0.5) * 0.05,
      rotZ: (s1 - 0.5) * 0.035
    }
  }, [id])

  const pos = useMemo<[number, number, number]>(
    () => [position[0], position[1], position[2] + flaw.depth * spacing],
    [flaw.depth, position, spacing]
  )

  useEffect(() => {
    ref.current?.color?.copy(tint)
    ref.current?.updateMatrix()
  }, [tint])

  useEffect(() => {
    ref.current?.updateMatrix()
  }, [pos])

  /**
   * The original site's tiles spun a quarter-turn in place, which reads clean
   * because they are symmetric cubes. A brick is not, and it sits buried in
   * mortar, so the equivalent here is: ease out of the wall, half-turn,
   * settle back flush. The spin is applied in the brick's local frame, on top
   * of its flawed rest pose — only then is the half-turn exactly congruent
   * with that pose, so neither the rotation reset nor the reroll is visible.
   * (Tweening the Euler component instead would spin about the world axis and
   * land with the flaw tilts mirrored.)
   *
   * Timing is true random, rerolled every cycle — the low-discrepancy seeds
   * are linear in `id`, and id is linear in the grid, so seeding the flips
   * with them marches diagonal waves across the wall.
   */
  useEffect(() => {
    const c = ref.current

    if (!c) return

    c.rotation.set(0, flaw.rotY, flaw.rotZ)
    c.updateMatrix()

    const lift = spacing * 1.5

    const qRest = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, flaw.rotY, flaw.rotZ)
    )
    const qSpin = new THREE.Quaternion()

    let tl: gsap.core.Timeline | null = null
    let next: gsap.core.Tween | null = null

    const flip = () => {
      const duration = gsap.utils.random(1.4, 3.2)
      const axis = AXES[Math.random() < 0.5 ? 0 : 1]
      const dir = Math.random() < 0.5 ? 1 : -1
      const ease = gsap.utils.random([
        'power1.inOut',
        'power2.inOut',
        'power3.inOut',
        'power4.inOut'
      ])
      const spin = { angle: 0 }

      tl = gsap.timeline({
        defaults: { onUpdate: () => c.updateMatrix() },
        onComplete: () => {
          c.rotation.set(0, flaw.rotY, flaw.rotZ)
          c.updateMatrix()
          next = gsap.delayedCall(gsap.utils.random(20, 70), flip)
        }
      })

      tl.to(c.position, {
        duration: 0.5,
        ease: 'power2.out',
        z: pos[2] + lift
      })
        .to(
          spin,
          {
            angle: Math.PI * dir,
            duration,
            ease,
            onUpdate: () => {
              qSpin.setFromAxisAngle(axis, spin.angle)
              c.quaternion.copy(qRest).multiply(qSpin)
              c.updateMatrix()
            }
          },
          0.2
        )
        .to(
          c.position,
          { duration: 0.6, ease: 'power2.inOut', z: pos[2] },
          0.2 + duration - 0.45
        )
    }

    next = gsap.delayedCall(Math.random() * 60, flip)

    return () => {
      tl?.kill()
      next?.kill()
      c.rotation.set(0, flaw.rotY, flaw.rotZ)
      c.position.z = pos[2]
      c.updateMatrix()
    }
  }, [flaw, pos, spacing])

  useEffect(() => {
    const c = ref.current

    if (!c) return

    const target = hidden ? 0.001 : spacing

    if (!init.current) {
      init.current = true
      c.scale.setScalar(target)
      c.updateMatrix()
      return
    }

    if (hidden) {
      c.scale.setScalar(target)
      c.updateMatrix()
      return
    }

    gsap.to(c.scale, {
      duration: 0.28,
      ease: 'power2.out',
      onUpdate: () => c.updateMatrix(),
      overwrite: 'auto',
      x: target,
      y: target,
      z: target
    })
  }, [hidden, spacing])

  return (
    <Instance color={color} position={pos} ref={ref} {...props} />
  )
}

interface ParticleProps extends Omit<InstanceProps, 'position'> {
  color: string
  hidden?: boolean
  id?: number
  position: [number, number, number]
  spacing: number
}
