# SPEC-MOTION-CSP — Remover eval(), versionar deps de animação, CSP e tier de reduced-motion

> Status: planejado · Fase original: 6 · Track: B · Depende de: — · Destrava: —

## 1. Objetivo

Eliminar o vetor de supply-chain e a violação de CSP causados pelo `eval(import('https://cdn.jsdelivr.net/...'))` da animação de tubos (Three.js) nas intros, trazendo `three`/`threejs-components` para dependências npm versionadas e carregadas por import dinâmico normal. No mesmo passo, endurecer a postura de segurança do front (CSP **sem** `'unsafe-eval'` em `next.config.ts`, limpeza de `remotePatterns`), eliminar a duplicação do SVG da catedral e tornar `prefers-reduced-motion` um tier de 1ª classe (animações infinitas/parallax/tilt degradam para fade ou estado estático). Spec independente, não toca DB nem rules.

## 2. Contexto atual (verificado em código)

- `components/CathedralIntro.tsx:46` — `const threeModule = await eval(`import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')`)`. Uso de `eval()` + import de CDN externa (jsdelivr) em runtime.
- `components/IntroAnimation.tsx:36` — idêntico ao acima (mesmo `eval(import(...))` para `tubes1.min.js`).
- `package.json:11-29` — `three` e `threejs-components` **não** constam em `dependencies` nem `devDependencies`. Dependência transitiva escondida via CDN (risco supply-chain: versão não fixada por lockfile, sem auditoria, sem SRI).
- `next.config.ts:1-30` — **não** há `headers()` nem qualquer Content-Security-Policy. `images.remotePatterns` cobre `picsum.photos` (`next.config.ts:10`), `lh3.googleusercontent.com` (`next.config.ts:16`) e `images.unsplash.com` (`next.config.ts:22`); **não** cobre `cdn.jsdelivr.net` — ou seja, o `eval(import(...))` hoje só funciona porque não há CSP `script-src` que o restrinja.
- `app/rsvp/[code]/page.tsx:106` — `style={{ backgroundImage: 'url("https://picsum.photos/seed/cathedral/1920/1080")' }}` — uso de **runtime** do placeholder picsum via CSS `background-image` (NÃO via `next/image`). Logo, remover picsum de `remotePatterns` não quebra `next/image`, mas uma CSP `img-src` que não inclua picsum **bloquearia** este background. Precisa ser tratado (ver RT-7 / Riscos).
- SVG da catedral DUPLICADO (~177 linhas idênticas, incluindo `<defs>` `finalGlow`/`goldGlow`/`innerLight`, geração das 16 colunas, beams, crucifixo e core):
  - `components/CathedralIntro.tsx:209-385`
  - `components/IntroAnimation.tsx:182-358`
- ZERO tratamento de `prefers-reduced-motion` nesses arquivos. Animações infinitas presentes:
  - `components/CathedralIntro.tsx:295-313` e `314-332` — `motion.path` dos beams com `repeat: Infinity`.
  - `components/CathedralIntro.tsx:408-412` — "Toque para iniciar" com `animate={{ opacity: [...] }}` + `repeat: Infinity`.
  - `components/IntroAnimation.tsx:268-286` e `287-305` — beams com `repeat: Infinity`.
- `components/FloatingBackground.tsx:14` — 20 partículas; `:36-60` e `:64-90` cada partícula com `repeat: Infinity`; `:27-28` parallax (`useTransform` de `scrollYProgress`). Sem reduced-motion.
- `components/TiltCard.tsx:36-101` — tilt 3D por `onPointerMove` (rotateX/rotateY/scale3d), sem checagem de reduced-motion.
- DESIGN.md como fonte da diretriz:
  - `DESIGN.md:411-413` — "Reduced-motion (tier de 1ª classe — obrigatório)": quando `prefers-reduced-motion: reduce`, animações infinitas/parallax/tilt **param** ou viram fade `dur-fast`; conteúdo nunca depende de animação para aparecer.
  - `DESIGN.md:372` — "Tilt/grain **devem degradar** sob `prefers-reduced-motion` e em mobile."
  - `DESIGN.md:478` — backlog item 7: "sem reduced-motion → tier obrigatório → `FloatingBackground`, `AnimatedText`, intros".
  - `DESIGN.md:405-407` — tokens de duração (`dur-fast` 200ms, `dur-base` 500ms, `dur-slow` 1200ms).
- `docs/engineering-backlog-plan.md:110` — já prevê: adicionar CSP em `next.config.ts` e remover `picsum.photos` dos `remotePatterns`.
- Renderização das intros: `components/CathedralIntro.tsx` é usado em `app/page.tsx:91`; `components/IntroAnimation.tsx` é usado por `components/LoadingScreen.tsx:79`.

## 3. Escopo

**Inclui:**
- Adicionar `three` e `threejs-components` como dependências npm versionadas (pinadas) em `package.json` (atualizar lockfile).
- Substituir os dois `eval(import('https://cdn.jsdelivr.net/...'))` por `import()` dinâmico **estático-de-string** do pacote npm local (`import('threejs-components/build/cursors/tubes1.min.js')` ou caminho equivalente exportado pelo pacote), sem `eval`.
- Consolidar o SVG duplicado num componente compartilhado `components/CathedralSVG.tsx`, e fazer `CathedralIntro` e `IntroAnimation` consumirem-no (2 wrappers).
- Adicionar CSP em `next.config.ts` via `async headers()`, **sem** `'unsafe-eval'`.
- Remover `picsum.photos` dos `remotePatterns` em `next.config.ts` (após eliminar o uso runtime — ver RT-7).
- Implementar tier `prefers-reduced-motion: reduce` (hook `useReducedMotion` da `motion/react`) desligando: partículas infinitas e parallax do `FloatingBackground`, tilt do `TiltCard`, e os beams/loops infinitos das intros (`motion.path`/`motion.ellipse`/"Toque para iniciar").

**Não inclui:**
- Reescrever a coreografia/estética das intros (mantém o mesmo visual quando reduced-motion=off).
- Migrar de `motion`/`framer-motion` para outra lib.
- App Check, Anonymous Auth, rules, pagamentos, RSVP — pertencem a outras specs (Track A).
- Otimização de bundle/lazy-load das intros além do necessário para o import dinâmico funcionar.
- Tratar shimmer/grain remoto do dock (`grainy-gradients`) — citado no DESIGN.md como dívida, mas fora deste recorte salvo se cair sob a mesma CSP (ver Riscos).

## 4. Requisitos técnicos

- **RT-1 (versionar deps).** Adicionar a `package.json:dependencies` `three` e `threejs-components` em versões pinadas e compatíveis (ex.: a versão que casa com `threejs-components@0.0.19` hoje carregada do CDN — confirmar peerDependency de `three` exigida pelo pacote). Rodar o gerenciador para atualizar o lockfile. Critério: `npm ls three threejs-components` resolve sem erro.
- **RT-2 (matar `eval`).** Em `components/CathedralIntro.tsx:46` e `components/IntroAnimation.tsx:36`, remover `await eval(`import('https://cdn.jsdelivr.net/...')`)` e substituir por `const threeModule = await import('threejs-components/build/cursors/tubes1.min.js')` (ou o subpath/entry correto exportado pelo pacote npm). Manter `threeModule.default` como `TubesCursor`. Nenhum literal de URL `cdn.jsdelivr.net` deve restar no código.
- **RT-3 (componente SVG compartilhado).** Criar `components/CathedralSVG.tsx` (`'use client'`) que renderiza o SVG da catedral (defs + 16 colunas + beams + crucifixo + core). Deve aceitar props mínimas para permitir o tier reduced-motion (ex.: `prop `animated?: boolean` ou `reduced?: boolean`), e expor classes/`viewBox` idênticos aos atuais. Os `id` de `<filter>`/`<radialGradient>` (`finalGlow`, `goldGlow`, `innerLight`) hoje são duplicados em dois SVGs simultâneos — ao consolidar, garantir IDs únicos por instância (prefixar com `useId()`) para evitar colisão quando ambas intros coexistirem no DOM.
- **RT-4 (wrappers).** Refatorar `components/CathedralIntro.tsx:209-385` e `components/IntroAnimation.tsx:182-358` para renderizar `<CathedralSVG .../>` no lugar do markup inline. Comportamento visual idêntico com reduced-motion=off.
- **RT-5 (CSP sem `unsafe-eval`).** Em `next.config.ts`, adicionar `async headers()` retornando `Content-Security-Policy` aplicada a todas as rotas (`source: '/(.*)'`). A diretiva `script-src` **não** pode conter `'unsafe-eval'`. Diretivas mínimas: `default-src 'self'`; `script-src 'self'` (+ `'unsafe-inline'` só se Next/inline scripts exigirem — preferir nonce/sha se viável, mas sem `unsafe-eval`); `style-src 'self' 'unsafe-inline'` (Tailwind/inline styles); `img-src 'self' data: blob:` + hosts de `next/image` legítimos (`lh3.googleusercontent.com`, `images.unsplash.com`); `connect-src 'self'` + endpoints Firebase/Firestore usados (`*.googleapis.com`, `*.firebaseio.com`, etc. — confirmar a partir de `lib/firebase.ts`); `font-src 'self' data:`; `frame-ancestors 'none'`; `base-uri 'self'`; `object-src 'none'`. NÃO incluir `cdn.jsdelivr.net` em `script-src`.
- **RT-6 (limpar remotePatterns).** Remover o bloco `picsum.photos` de `next.config.ts:8-13`. Manter `lh3.googleusercontent.com` e `images.unsplash.com` apenas se ainda houver uso real (auditar; ver Tarefas humanas).
- **RT-7 (eliminar picsum runtime).** Substituir `app/rsvp/[code]/page.tsx:106` (`backgroundImage: url(picsum...)`) por um asset local (ex.: `/catedral-brasilia.png`, já usado em `CathedralIntro.tsx:399`) ou cor/gradiente, para que a remoção do picsum em `remotePatterns` e a CSP `img-src` não deixem um background quebrado. Sem esta troca, a CSP bloquearia a imagem.
- **RT-8 (tier reduced-motion — intros).** Em `CathedralSVG` (RT-3) e no "Toque para iniciar" (`CathedralIntro.tsx:408-412`), quando `useReducedMotion()` for `true`: os `motion.path` de beams (`CathedralIntro.tsx:295-332`, `IntroAnimation.tsx:268-305`) renderizam em estado final estático (sem `repeat: Infinity`); a pulsação do "Toque para iniciar" vira opacidade fixa. Conteúdo (logo, catedral, CTA) permanece visível.
- **RT-9 (tier reduced-motion — FloatingBackground).** Em `components/FloatingBackground.tsx`: quando reduced-motion, não animar partículas (sem `repeat: Infinity` em `:36-60`/`:64-90`) e neutralizar o parallax (`y1`/`y2` em `:27-28` fixos em 0) — ou retornar apenas o overlay radial estático (`:93`). Partículas podem aparecer estáticas com opacidade base.
- **RT-10 (tier reduced-motion — TiltCard).** Em `components/TiltCard.tsx`: quando reduced-motion, desabilitar o handler de tilt (`handlePointerMove` não aplica rotateX/rotateY/scale; mantém transform neutro) e o spotlight, conforme `DESIGN.md:372`.
- **RT-11 (uso de API canônica).** Usar `useReducedMotion` de `motion/react` (já é a lib em uso, ex.: `CathedralIntro.tsx:4`) como única fonte de verdade do tier, evitando duplicar `matchMedia` em cada componente; se necessário, encapsular num hook `lib/hooks/useReducedMotionPref` reutilizável.

## 5. Modelo de dados / contratos

N/A para schema de DB/Firestore. Contratos relevantes desta spec:

- **Import dinâmico (RT-2):** `await import('threejs-components/build/cursors/tubes1.min.js')` → `{ default: TubesCursor }`. O entry exato (subpath) deve ser confirmado contra os `exports`/arquivos publicados do pacote `threejs-components@0.0.19`; se o subpath publicado diferir do path do CDN, ajustar o specifier.
- **Props de `CathedralSVG` (RT-3):** `{ reduced?: boolean; idPrefix?: string; className?: string }` (ou equivalente). IDs de filtros/gradientes derivados de `useId()`.
- **Header CSP (RT-5):** string única em `next.config.ts`, ex. (placeholder — ajustar hosts Firebase reais):
  ```
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.unsplash.com;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com;
  font-src 'self' data:;
  frame-ancestors 'none'; base-uri 'self'; object-src 'none';
  ```
  Sem `'unsafe-eval'`. Sem `cdn.jsdelivr.net`.

## 6. Arquivos afetados

- **Editar** `package.json` — adicionar `three` + `threejs-components` (RT-1).
- **Editar** `package-lock.json` (ou lockfile equivalente) — gerado por RT-1.
- **Editar** `components/CathedralIntro.tsx` — remover `eval`/CDN (RT-2), consumir `CathedralSVG` (RT-4), reduced-motion (RT-8).
- **Editar** `components/IntroAnimation.tsx` — remover `eval`/CDN (RT-2), consumir `CathedralSVG` (RT-4), reduced-motion (RT-8).
- **Criar** `components/CathedralSVG.tsx` — SVG compartilhado (RT-3).
- **Editar** `next.config.ts` — CSP (RT-5), remover picsum de `remotePatterns` (RT-6).
- **Editar** `app/rsvp/[code]/page.tsx` — trocar background picsum por asset local (RT-7).
- **Editar** `components/FloatingBackground.tsx` — reduced-motion (RT-9).
- **Editar** `components/TiltCard.tsx` — reduced-motion (RT-10).
- **Criar (opcional)** `lib/hooks/useReducedMotionPref.ts` — hook reutilizável (RT-11), se optado por encapsular.

## 7. Critérios de aceite

- [ ] `grep -rn "eval(" components/` retorna zero ocorrências; nenhum literal `cdn.jsdelivr.net` no código-fonte.
- [ ] `three` e `threejs-components` aparecem em `package.json` com versão pinada e no lockfile; `npm ls three threejs-components` sem erros.
- [ ] A intro de tubos continua funcionando (canvas Three.js renderiza) carregando do pacote npm, sem requisição a jsdelivr (Network limpo de jsdelivr).
- [ ] `next.config.ts` emite header `Content-Security-Policy` em todas as rotas; a string **não** contém `'unsafe-eval'`; DevTools não reporta violação de CSP no fluxo normal (home + intro + RSVP + presentes).
- [ ] `picsum.photos` removido de `remotePatterns`; nenhum uso runtime de picsum resta (`grep -rn "picsum" app components` vazio); o background do RSVP carrega asset local.
- [ ] O SVG da catedral existe em **um** arquivo (`components/CathedralSVG.tsx`); `CathedralIntro` e `IntroAnimation` não contêm mais o markup SVG inline duplicado; IDs de filtros são únicos por instância (sem colisão no DOM).
- [ ] Com `prefers-reduced-motion: reduce` ativo: partículas infinitas do `FloatingBackground` param, parallax neutralizado, tilt do `TiltCard` desabilitado, beams/loops `repeat:Infinity` das intros não rodam (estado estático) e "Toque para iniciar" sem pulsar — e todo o conteúdo permanece visível.
- [ ] Com reduced-motion=off, o visual das intros é idêntico ao atual (sem regressão estética).
- [ ] `npm run build` passa.

## 8. Validação e2e (e2e-validation-gate)

Esta spec toca runtime user-visível e config de segurança (CSP), então passa pelo gate.

- **Baseline:** `git stash`/branch limpo; `npm run build` e `npm run dev`; abrir home (intro de tubos roda via jsdelivr), RSVP (`/rsvp/<code>` com background picsum), capturar Network (requisição a `cdn.jsdelivr.net` presente) e ausência de header CSP.
- **Mudança idempotente:** aplicar RT-1..RT-11. Reaplicar `npm install` deve ser idempotente (lockfile estável). Reabrir os mesmos fluxos.
- **Validar propagação por camada:**
  1. **Build/deps:** `npm run build` ok; `npm ls three threejs-components` resolve.
  2. **Rede/segurança:** Network sem `cdn.jsdelivr.net`; response headers contêm CSP sem `unsafe-eval`; Console sem violações de CSP no fluxo (home, intro, RSVP, presentes, eventos).
  3. **UI funcional:** intro de tubos renderiza (canvas com conteúdo); SVG da catedral aparece nas duas intros; background do RSVP carrega do asset local.
  4. **Acessibilidade/motion:** com DevTools "Emulate prefers-reduced-motion: reduce", confirmar que partículas/parallax/tilt/beams param e o conteúdo segue visível; alternar de volta restaura as animações.
- **Reverter:** `git checkout`/descartar; `npm install` restaura deps; confirmar baseline de novo.
- **Revalidar:** rodar o build no estado revertido e no estado final para garantir reprodutibilidade.

## 9. Tarefas humanas / dependências externas

- Confirmar a versão de `three` que o `threejs-components@0.0.19` exige (peer/depend.) e o **subpath de import publicado** no npm para `tubes1.min.js` (pode diferir do path do CDN). Caso o pacote não exporte esse build via npm, o usuário decide entre: (a) outra versão/entry, ou (b) vendorizar o arquivo localmente em `public/`/`lib/` (ainda assim sem `eval` e sem CDN).
- Auditar se `lh3.googleusercontent.com` (avatares Google) e `images.unsplash.com` ainda têm uso real; se não, removê-los também de `remotePatterns` e da CSP `img-src`.
- Confirmar, a partir de `lib/firebase.ts`, os domínios exatos que a CSP `connect-src` precisa liberar (Firestore/Auth/Storage) para não quebrar o app em produção.
- Validar a CSP em ambiente de produção/preview (Vercel ou similar): inline scripts do Next podem exigir nonce; decidir entre nonce/sha vs. `'unsafe-inline'` em `script-src` (nunca `'unsafe-eval'`).
- Fornecer/confirmar o asset local de fundo do RSVP (reusar `/catedral-brasilia.png` ou outro).

## 10. Riscos e mitigação

- **CSP quebrar o app em produção (inline scripts/Firebase).** Next injeta scripts inline; Firebase abre conexões a vários domínios Google. Mitigar: começar com CSP em modo `Content-Security-Policy-Report-Only` para coletar violações reais, ajustar `connect-src`/`script-src`, e só então promover para enforcing. Testar em preview antes de produção.
- **Subpath de import do `threejs-components` não publicado / API diferente do CDN.** O build do CDN pode não existir como subpath npm. Mitigar: validar `npm pack`/listar arquivos do pacote; se ausente, vendorizar o arquivo localmente (sem CDN, sem eval) — ainda atende ao objetivo de zero `eval` e zero jsdelivr.
- **`'unsafe-eval'` reintroduzido por terceiros.** Three.js/loaders às vezes usam `eval`/`Function`. Mitigar: validar no Console com CSP enforcing que a intro roda sem violação; se algum lib exigir eval, isolar/substituir em vez de afrouxar a CSP.
- **Colisão de IDs de SVG ao consolidar.** Dois SVGs com mesmos `id` de filtro causam filtro aplicado errado. Mitigar: `useId()` prefixando todos os `id` em `CathedralSVG` (RT-3).
- **Remover picsum sem trocar o runtime quebra o RSVP.** O uso é via `background-image` CSS, não `next/image`. Mitigar: RT-7 obrigatório antes/junto de RT-6; CSP `img-src` cobre o asset local (`'self'`).
- **Regressão estética nas intros.** Refator do SVG pode alterar visual. Mitigar: comparação visual lado a lado com reduced-motion=off (critério de aceite) antes de mergear.
- **grain remoto `grainy-gradients` (DESIGN.md:372) sob a nova CSP.** Se houver fetch de grain remoto, a CSP pode bloqueá-lo. Mitigar: durante o report-only, mapear; padronizar para `NoiseOverlay` inline (fora do escopo de implementação, mas registrar como achado).
