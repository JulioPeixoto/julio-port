# julio-port

Portfólio pessoal — cena WebGL interativa.

Base adaptada de [OutThisLife/brooklyn.sh](https://github.com/OutThisLife/brooklyn.sh).

## Stack

- **React 18 + TypeScript**, build com **Vite 5** (`@vitejs/plugin-react-swc`)
- **three.js** + **@react-three/fiber** / **drei** / **postprocessing**
- Shaders GLSL importados direto via `vite-plugin-glsl`, com helpers do **lygia**
- **leva** para os controles (também usada como menu de navegação)
- **nanostores** para estado
- **Tailwind CSS 3** + PostCSS
- **pnpm**

## Rodando

```sh
pnpm install
pnpm dev       # servidor de desenvolvimento
pnpm build     # build de produção em dist/
pnpm preview   # serve o build
pnpm check     # typecheck (tsc --noEmit)
pnpm fmt       # prettier
pnpm fix       # eslint --fix
```

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

## Personalizar

- **Links do menu**: `src/App.tsx` — o LinkedIn ainda está com placeholder (`SEU-USUARIO`).
- **Currículo**: coloque um `resume.pdf` em `public/` (o botão "Resume" já aponta pra lá).
- **Favicon**: `public/favicon.ico` ainda é o original, troque.
- **Cor e grid**: valores padrão em `src/Scene/index.tsx` (`color`, `gridSize`).
- **Texturas**: `public/tex0.png` e `tex1.png` são carregadas em `Material.tsx`.
- **Título e meta tags**: `index.html`.
