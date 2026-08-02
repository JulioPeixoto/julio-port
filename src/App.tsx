import { Canvas } from '@react-three/fiber'
import { Leva, button, useControls } from 'leva'
import { Suspense, lazy, useState } from 'react'

import Cursor from './Cursor'
import FX from './Scene/effects'

const Scene = lazy(() => import('./Scene'))
const Env = lazy(() => import('./Env'))

export default function App() {
  const [stage, setStage] = useState<HTMLDivElement | null>(null)

  useControls('Julio Peixoto', {
    'Email Me': button(() =>
      window.open('mailto:juliorafaelnft@hotmail.com', '_blank')
    ),
    GitHub: button(() =>
      window.open('//github.com/JulioPeixoto', '_blank', 'noopener,noreferrer')
    ),
    LinkedIn: button(() =>
      window.open(
        '//linkedin.com/in/julio-rafael-souza',
        '_blank',
        'noopener,noreferrer'
      )
    ),
    Resume: button(() =>
      window.open('/resume.pdf', '_blank', 'noopener,noreferrer')
    )
  })

  return (
    <>
      <div className="fixed inset-0" ref={setStage}>
        <Canvas
          camera={{ zoom: 600 }}
          dpr={[1, 2]}
          eventPrefix="client"
          eventSource={stage ?? undefined}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          orthographic
          shadows>
          <Suspense>
            <Scene />
            <Env />
            <FX />
          </Suspense>
        </Canvas>

        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 38%, rgba(0,0,0,.28) 72%, rgba(0,0,0,.62) 100%)'
          }}
        />

        <Cursor />
      </div>

      <Leva
        collapsed
        theme={{ colors: { accent2: '#ec4899' } }}
        titleBar={{ filter: false }}
      />
    </>
  )
}
