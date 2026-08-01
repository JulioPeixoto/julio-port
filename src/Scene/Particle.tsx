import type { InstanceProps } from '@react-three/drei'
import { Instance } from '@react-three/drei'
import gsap from 'gsap'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n))

/**
 * Three low-discrepancy sequences so hue, saturation and lightness of a
 * brick vary independently instead of drifting together.
 */
const jitter = (id: number) => [
  (id * 0.6180339887498949) % 1,
  (id * 0.7548776662466927) % 1,
  (id * 0.5698402909980532) % 1
]

export default function Particle({
  color,
  hidden = false,
  id = 0,
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

  useEffect(() => {
    ref.current?.color?.copy(tint)
    ref.current?.updateMatrix()
  }, [tint])

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

  return <Instance color={color} ref={ref} {...props} />
}

interface ParticleProps extends InstanceProps {
  color: string
  hidden?: boolean
  id?: number
  spacing: number
}
