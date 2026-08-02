export interface Social {
  key: string
  label: string
  url: string
}

/**
 * A handful of bricks quietly carry a link. Nothing marks them — finding one
 * is the whole point, so this list holds no icon, only the destination.
 */
export const SOCIALS: Social[] = [
  {
    key: 'github',
    label: 'GitHub',
    url: 'https://github.com/JulioPeixoto'
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/julio-rafael-souza/'
  },
  {
    key: 'mail',
    label: 'Email',
    url: 'mailto:juliorafaelnft@hotmail.com'
  }
]
