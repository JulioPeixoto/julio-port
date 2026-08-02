import { useTexture } from '@react-three/drei'

import { BRICK } from '../../utils'

export interface Social {
  icon: string
  key: string
  label: string
  url: string
}

const svg = (path: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24"><path fill="#ffffff" d="${path}"/></svg>`
  )}`

const GITHUB =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const LINKEDIN =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'

const MAIL =
  'M1.5 5.25A2.25 2.25 0 0 1 3.75 3h16.5a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 20.25 21H3.75a2.25 2.25 0 0 1-2.25-2.25V5.25Zm2.7-.75L12 11.05 19.8 4.5H4.2ZM21 6.6l-8.4 7.05a.9.9 0 0 1-1.2 0L3 6.6v12.15c0 .41.34.75.75.75h16.5c.41 0 .75-.34.75-.75V6.6Z'

export const SOCIALS: Social[] = [
  {
    icon: svg(GITHUB),
    key: 'github',
    label: 'GitHub',
    url: 'https://github.com/JulioPeixoto'
  },
  {
    icon: svg(LINKEDIN),
    key: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/julio-rafael-souza/'
  },
  {
    icon: svg(MAIL),
    key: 'mail',
    label: 'Email',
    url: 'mailto:juliorafaelnft@hotmail.com'
  }
]

/** Icon plate sits just proud of the brick face so it never z-fights. */
const LIFT = BRICK.depth / 2 + 0.02

export interface IconSlot {
  key: string
  position: [number, number, number]
  visible: boolean
}

export default function Socials({ scale, slots }: SocialsProps) {
  const maps = useTexture(SOCIALS.map(s => s.icon))

  return (
    <>
      {slots.map(slot => {
        const i = SOCIALS.findIndex(s => s.key === slot.key)

        if (i < 0) return null

        return (
          <mesh
            key={slot.key}
            position={[
              slot.position[0],
              slot.position[1],
              slot.position[2] + LIFT * scale
            ]}
            raycast={() => null}
            scale={scale}
            visible={slot.visible}>
            <planeGeometry args={[BRICK.height * 0.72, BRICK.height * 0.72]} />
            <meshBasicMaterial
              alphaTest={0.35}
              map={maps[i]}
              toneMapped={false}
              transparent
            />
          </mesh>
        )
      })}
    </>
  )
}

interface SocialsProps {
  scale: number
  slots: IconSlot[]
}
