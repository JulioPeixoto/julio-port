import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'

export default function Env() {
  const { viewport } = useThree()

  const { ambient, key } = useControls('Luz', {
    ambient: { label: 'Ambiente', max: 2, min: 0, step: 0.01, value: 0.95 },
    key: { label: 'Principal', max: 4, min: 0, step: 0.01, value: 2.9 }
  })

  const r = Math.max(viewport.width, viewport.height)

  return (
    <>
      <color args={['#0d0b0a']} attach="background" />

      <hemisphereLight args={['#d3dae4', '#3b2a1f']} intensity={ambient} />

      <directionalLight
        castShadow
        intensity={key}
        position={[-r * 0.6, r * 0.75, r * 1.2]}
        shadow-bias={-0.0006}
        shadow-camera-bottom={-r}
        shadow-camera-far={r * 5}
        shadow-camera-left={-r}
        shadow-camera-right={r}
        shadow-camera-top={r}
        shadow-mapSize={[1024, 1024]}
      />
    </>
  )
}
