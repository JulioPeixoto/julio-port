# julio-port

Portfólio pessoal — cena WebGL interativa.

## Stack

- **React 18 + TypeScript**, build com **Vite 5** (`@vitejs/plugin-react-swc`)
- **three.js** + **@react-three/fiber** / **drei** / **postprocessing**
- Shaders GLSL importados direto via `vite-plugin-glsl`, com helpers do **lygia**
- **leva** para os controles (também usada como menu de navegação)
- **nanostores** para estado
- **Tailwind CSS 3** + PostCSS
- **bun** como package manager

## Rodando

```sh
bun install
bun run dev       # servidor de desenvolvimento
bun run build     # build de produção em dist/
bun run preview   # serve o build
bun run check     # typecheck (tsc --noEmit)
bun run fmt       # prettier
bun run fix       # eslint --fix
```

O `@radix-ui/react-portal` está pinado em `1.0.2` no campo `overrides` do
`package.json`: o leva declara `^1.0.2` e quebra com as versões 1.1.x.

## Estrutura

```
src/
  App.tsx            # Canvas, Suspense e o painel Leva (menu de links)
  Code.tsx           # overlay que mostra o shader rodando, em tempo real
  Cursor.tsx         # cursor customizado
  Env/               # iluminação / environment
  Scene/
    index.tsx        # grid de partículas instanciadas + interação de clique
    Geometry.tsx     # geometria da célula
    Material.tsx     # shader material (onBeforeCompile, uniforms de mouse/tempo)
    Particle.tsx     # célula individual
    Poof.tsx         # efeito ao clicar numa célula
    Output.tsx       # publica o source do shader no store do nanostores
    effects/
      index.tsx      # composer: bloom + grain
      grain.ts       # GrainPass customizado
utils/
public/              # texturas (tex0/1/2.png), favicon
```