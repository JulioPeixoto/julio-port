import type { MeshStandardMaterialProps } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useCallback, useMemo } from 'react'
import type { WebGLProgramParametersWithUniforms } from 'three'
import * as THREE from 'three'

/** Instance origin, so the cursor halo snaps brick by brick. */
const vertex = /* glsl */ `
#ifdef USE_INSTANCING
  vBrick = (modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.)).xyz;
#else
  vBrick = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;
#endif
`

const color = /* glsl */ `
float hd = distance(vBrick.xy, uMouse.xy);
float hg = 1. - smoothstep(0., uRadius, hd);
float pulse = .5 + .5 * sin(uTime * 2.4 - hd * 1.6);

diffuseColor.rgb = mix(diffuseColor.rgb, 1. - diffuseColor.rgb, hg * uInvert);
diffuseColor.rgb *= 1. + hg * (.04 + .07 * pulse);
`

export default function Material({ spacing, ...props }: MaterialProps) {
  const pointer = useMemo(() => new THREE.Vector3(), [])

  const { halo, invert, roughness } = useControls('Muro', {
    halo: { label: 'Halo (fiadas)', max: 10, min: 0.5, step: 0.1, value: 2.5 },
    invert: { label: 'Invertido', max: 1, min: 0, step: 0.01, value: 0.4 },
    roughness: { label: 'Rugosidade', max: 1, min: 0.2, step: 0.01, value: 0.9 }
  })

  const uniforms = useMemo(
    () => ({
      uInvert: { value: invert },
      uMouse: { value: new THREE.Vector3() },
      uRadius: { value: 1 },
      uTime: { value: 0 }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  uniforms.uInvert.value = invert
  uniforms.uRadius.value = halo * spacing

  const onBeforeCompile = useCallback(
    (v: WebGLProgramParametersWithUniforms) => {
      v.uniforms = { ...v.uniforms, ...uniforms }

      v.vertexShader = v.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vBrick;`
        )
        .replace('#include <begin_vertex>', `#include <begin_vertex>${vertex}`)

      v.fragmentShader = v.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vBrick;

          uniform float uInvert;
          uniform float uRadius;
          uniform float uTime;
          uniform vec3 uMouse;`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>${color}`
        )
    },
    [uniforms]
  )

  useFrame(({ camera, clock, pointer: mouse }) => {
    pointer.set(mouse.x, mouse.y, 0.5).unproject(camera)
    pointer.z = 0

    uniforms.uMouse.value.copy(pointer)
    uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <meshStandardMaterial
      key="brick"
      metalness={0}
      onBeforeCompile={onBeforeCompile}
      roughness={roughness}
      {...props}
    />
  )
}

interface MaterialProps extends MeshStandardMaterialProps {
  spacing: number
}
