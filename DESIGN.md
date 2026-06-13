---
version: alpha
name: Isadora & Matheus — Atelier
description: Sistema de design para o site de casamento. Estética de galeria editorial — neutros quentes Material-3, o ouro como único acento cromático, vidro líquido como linguagem de elevação e movimento expo-out como gramática. Mobile-first, bilíngue de voz (serifa emocional + sans metadado), WCAG AA.
colors:
  # — Base / figura-fundo —
  background: "#FAF9F7"
  on-background: "#2F3331"
  surface: "#FAF9F7"
  on-surface: "#2F3331"
  on-surface-variant: "#5C605D"
  # — Elevação por superfície (M3) —
  surface-lowest: "#FFFFFF"
  surface-low: "#F3F4F1"
  surface-container: "#EDEEEB"
  surface-high: "#E6E9E6"
  surface-highest: "#E0E3E0"
  # — Primary (neutro quente) —
  primary: "#5F5E5E"
  primary-dim: "#535252"
  primary-container: "#E4E2E1"
  on-primary: "#FAF7F6"
  primary-fixed-dim: "#AFB3B0"
  # — Secondary —
  secondary: "#665E51"
  secondary-dim: "#5A5246"
  on-secondary: "#FFF8F1"
  # — Ouro: acento único, agora DESDOBRADO em dois papéis —
  gold: "#C5A059"
  gold-dim: "#A6854A"
  gold-expressive: "#C5A059"
  gold-readable: "#8C6A0A"
  # — Linhas —
  outline: "#777C79"
  outline-variant: "#AFB3B0"
  # — Estados semânticos (NOVO — antes inexistentes) —
  error: "#B3261E"
  on-error: "#FFFFFF"
  error-container: "#F9DEDC"
  on-error-container: "#410E0B"
  success: "#3F6B3F"
  on-success: "#FFFFFF"
  success-container: "#D7EAD7"
  on-success-container: "#052105"
  warning: "#9A6B00"
  on-warning: "#FFFFFF"
  warning-container: "#FBE7C2"
  on-warning-container: "#2E2100"
  info: "#2A5A8C"
  on-info: "#FFFFFF"
  info-container: "#D6E6F5"
  on-info-container: "#08243D"
typography:
  script:
    fontFamily: "Alex Brush, cursive"
    fontSize: "8rem"
    fontWeight: 400
    lineHeight: "0.8"
    fontStyle: normal
  display:
    fontFamily: "Playfair Display, serif"
    fontSize: "4rem"
    fontWeight: 600
    lineHeight: "1.0"
    fontStyle: italic
  h1:
    fontFamily: "Playfair Display, serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: "1.05"
    fontStyle: italic
  h2:
    fontFamily: "Playfair Display, serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: "1.1"
    fontStyle: italic
  h3:
    fontFamily: "Playfair Display, serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: "1.2"
    fontStyle: italic
  body-lg:
    fontFamily: "Cormorant Garamond, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: "1.6"
    fontStyle: italic
  body:
    fontFamily: "Cormorant Garamond, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: "1.6"
    fontStyle: normal
  label:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1.4"
    letterSpacing: "0.2em"
    textTransform: uppercase
  label-sm:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: "1.4"
    letterSpacing: "0.3em"
    textTransform: uppercase
spacing:
  "3xs": "2px"
  "2xs": "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
  "4xl": "96px"
  section: "128px"
rounded:
  xs: "2px"
  sm: "6px"
  md: "12px"
  lg: "24px"
  xl: "32px"
  pill: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  button-gold:
    backgroundColor: "{colors.gold-expressive}"
    textColor: "{colors.on-background}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "{spacing.md}"
  card-gift:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  input-text:
    backgroundColor: "{colors.surface-low}"
    textColor: "{colors.on-background}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm}"
  badge-category:
    backgroundColor: "{colors.surface-lowest}"
    textColor: "{colors.gold-readable}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs}"
  glass-panel:
    backgroundColor: "{colors.surface-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  dock-glass:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm}"
  tooltip:
    backgroundColor: "{colors.surface-highest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  modal-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xl}"
  banner-error:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  banner-success:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.on-success-container}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  banner-warning:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.on-warning-container}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  banner-info:
    backgroundColor: "{colors.info-container}"
    textColor: "{colors.on-info-container}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  pill-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-warning}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs}"
  pill-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.on-info}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs}"
---

## Overview

Este é o sistema de design do site de casamento **Isadora & Matheus** — uma "Atelier" digital cuja estética é a de uma **galeria editorial impressa**: papel creme quente, tipografia serifada com ar de convite, e o **ouro como único protagonista cromático**. Tudo o mais é um espectro de neutros quentes deliberadamente dessaturados (Material-3) para que nada compita com o ouro.

Esta é a **v2 prescritiva**: ela documenta o que existe hoje (*as-is*) **e** define o alvo (*to-be*), servindo de fonte-da-verdade para um refactor incremental. Decisões consolidadas na entrevista `/grill-me` ([docs/design-upgrade-agreement.html](docs/design-upgrade-agreement.html)):

1. **Preservar a identidade** (ouro + neutros quentes + vidro editorial + curva expo-out), elevando-a a conformidade **WCAG AA**.
2. **Ouro desdobrado em dois papéis** reativos ao tema (`gold-expressive` decorativo + `gold-readable` para texto).
3. **Três vozes tipográficas reais** (Playfair / Cormorant / Montserrat + Alex Brush para nomes); Newsreader e Zeyada **removidas**.
4. **Vidro num único sistema de 3 níveis**; receitas inline e `.liquid-glass` eliminadas.
5. **Tokenizar** o que faltava: spacing, radius, sombra/elevação, motion, z-index e estados semânticos.

> Os tokens de **motion, glass, elevação e z-index** vivem nas seções em prosa abaixo (o schema atual do DESIGN.md ainda não os cobre como chaves de primeira classe). Eles são igualmente normativos.

### Dois temas, first-class

Todo token de cor possui par claro/escuro calibrado manualmente. O YAML acima registra os valores **light** como canônicos; a tabela em [Colors](#colors) traz o mapeamento **dark**. Implementação: variáveis CSS em tripla RGB com `<alpha-value>` (`rgb(var(--token) / <alpha>)`), `darkMode: "class"`.

---

## Colors

### Filosofia

**Papel antes de cor.** Pense sempre em pares figura/fundo (`on-*`) e numa escala de elevação por superfície (`surface-*`), nunca em cores nomeadas soltas. Toda cor nova entra como **token semântico** com contrapartida dark calibrada. O acento é **um só: o ouro** — e ele agora tem dois papéis para poder ser onipresente *sem* violar contraste.

### Paleta completa (light → dark)

| Token | Light | Dark | Papel |
|---|---|---|---|
| `background` / `surface` | `#FAF9F7` | `#1A1C1B` | Fundo creme quente / carvão esverdeado |
| `on-background` / `on-surface` | `#2F3331` | `#E2E3DF` | Texto principal |
| `on-surface-variant` | `#5C605D` | `#C0C9C4` | Texto secundário |
| `surface-lowest` | `#FFFFFF` | `#0F1110` | Cartões acima do fundo |
| `surface-low` | `#F3F4F1` | `#1D1E1D` | Trilhos, inputs |
| `surface-container` | `#EDEEEB` | `#212221` | Contêineres |
| `surface-high` | `#E6E9E6` | `#2B2C2A` | Elevação alta |
| `surface-highest` | `#E0E3E0` | `#363735` | Elevação máxima |
| `primary` | `#5F5E5E` | `#C6C7C4` | Ação neutra (botões) |
| `primary-dim` | `#535252` | `#AAAEAD` | Hover de primary |
| `primary-container` | `#E4E2E1` | `#474846` | Fundo tonal de primary |
| `on-primary` | `#FAF7F6` | `#2F3130` | Texto sobre primary |
| `primary-fixed-dim` ⚑ | `#AFB3B0` | `#404945` | **NOVO/definido** — fio da timeline de eventos |
| `secondary` | `#665E51` | `#D0C7B7` | Tom terroso de apoio |
| `secondary-dim` | `#5A5246` | `#B4AA9C` | Hover de secondary |
| `on-secondary` | `#FFF8F1` | `#362F25` | Texto sobre secondary |
| `gold` (legado) | `#C5A059` | `#DFBD81` | Mantido p/ retrocompat → migrar p/ os dois abaixo |
| **`gold-expressive`** | `#C5A059` | `#DFBD81` | **Decorativo**: bordas, glow, ícones, títulos display ≥24px |
| **`gold-readable`** | `#8C6A0A` | `#DFBD81` | **Texto**: labels, links, microcopy (passa AA) |
| `gold-dim` | `#A6854A` | `#C5A059` | Variante apagada do ouro |
| `outline` | `#777C79` | `#8A938E` | Bordas de ênfase |
| `outline-variant` | `#AFB3B0` | `#404945` | Hairlines sutis |
| `error` / `on-error` | `#B3261E` / `#FFFFFF` | `#F2B8B5` / `#601410` | Estado de erro |
| `error-container` / `on-…` | `#F9DEDC` / `#410E0B` | `#8C1D18` / `#F9DEDC` | Banner de erro |
| `success` / `on-success` | `#3F6B3F` / `#FFFFFF` | `#A6D9A6` / `#0A2E0A` | Sucesso (RSVP confirmado) |
| `success-container` / `on-…` | `#D7EAD7` / `#052105` | `#1E4620` / `#C8E6C9` | Banner de sucesso |
| `warning` / `on-warning` | `#9A6B00` / `#FFFFFF` | `#F2C66B` / `#3D2E00` | Aviso |
| `warning-container` / `on-…` | `#FBE7C2` / `#2E2100` | `#5A4200` / `#FBE7C2` | Banner de aviso |
| `info` / `on-info` | `#2A5A8C` / `#FFFFFF` | `#A9CBEC` / `#0A2540` | Informação |
| `info-container` / `on-…` | `#D6E6F5` / `#08243D` | `#16385A` / `#D6E6F5` | Banner informativo |

⚑ `primary-fixed-dim` era um **token fantasma**: referenciado em `app/eventos/page.tsx` mas nunca declarado no CSS (renderizava transparente). Agora definido.

### O ouro em dois papéis (regra central)

O contraste do `gold-expressive` (#C5A059) sobre o creme é **~2:1** — reprova como texto. Por isso:

- **`gold-expressive`** → bordas, glow, ícones, gradientes de vidro, **títulos display ≥ 24px** (texto grande exige só 3:1). Nunca em texto pequeno no claro.
- **`gold-readable`** → qualquer texto pequeno dourado (labels, links, "Categoria"). Calibrado para **AA**:
  - `#8C6A0A` sobre `#FAF9F7` (claro) = **4.78:1** ✓
  - `#DFBD81` sobre `#1A1C1B` (escuro) = **9.57:1** ✓
- **Proibido**: hex crus de ouro (`#d4af37`, `#F2D780`, `rgba(212,175,55)`, `#8C6A0A` literal). Tudo deriva de token e reage ao tema. Substituir também o hack `[filter:sepia(1)_saturate(5)_hue-rotate(10deg)]` do logo por um asset/token de ouro real.

---

## Typography

### Três vozes (a hierarquia falsa acabou)

Antes, `headline` e `body` apontavam **ambos** para Cormorant — duas variáveis, uma fonte. Agora há contraste real de **família**:

| Voz | Família | Uso | Token |
|---|---|---|---|
| **Script** | Alex Brush | **Só** os nomes do casal ("Isadora & Matheus") | `script` |
| **Display / Título** | Playfair Display *italic* | H1–H3, heros, títulos de seção | `display`, `h1`, `h2`, `h3` |
| **Corpo / Leitura** | Cormorant Garamond | Parágrafos, descrições, citações | `body`, `body-lg` |
| **Label / Metadado** | Montserrat (uppercase, tracking 0.2–0.3em) | Botões, tags, datas, microcopy | `label`, `label-sm` |

**Removidas** do `app/layout.tsx`: **Newsreader** e **Zeyada** (carregadas via `next/font`, zero uso — custo de fonte puro). Alex Brush passa a ser **estritamente** para nomes.

**Regra de hierarquia:** contraste por *família e tracking*, não por peso. Números grandes itálicos extralight permanecem como ornamento (ex.: "01–04" nos cards da home).

> Os `fontSize` de `script`/`display` no YAML são a **âncora desktop**; na implementação use escala fluida — `script` ≈ `clamp(3.5rem, 12vw, 9.5rem)`, `display` ≈ `clamp(2.5rem, 7vw, 5rem)` (mobile-first).

---

## Layout

### Spacing

Escala base ~8pt + um degrau de ritmo de seção. Hoje o código usa valores avulsos (`py-24`, `mt-32`, `gap-12`); estes tokens os normalizam:

`3xs 2` · `2xs 4` · `xs 8` · `sm 12` · `md 16` · `lg 24` · `xl 32` · `2xl 48` · `3xl 64` · `4xl 96` · **`section 128`** (px).

**Ritmo de galeria:** seções respiram com `4xl`/`section`; containers centralizados `max-w` (`6xl`/`7xl`); aspect-ratios fotográficos controlados (3/4, 4/3).

### Rounded (raios)

`xs 2` · `sm 6` · `md 12` · `lg 24` · `xl 32` · `pill 9999` (px). Consolida o atual zoo `rounded-sm/2xl/3xl/[2rem]/full`. **Raio grande é traço de marca** — favoreça `lg`/`xl`/`pill`.

### Z-index (escala nomeada — NOVO)

Hoje há colisões (`z-[60]`, `z-[100]`, `z-[150]`, `9997–9999`). Escala canônica:

| Token | Valor | Uso |
|---|---|---|
| `z-base` | 0 | Conteúdo |
| `z-raised` | 10 | Cards em hover, overlays locais |
| `z-sticky` | 30 | Elementos sticky |
| `z-nav` | 60 | TopNav fixa |
| `z-dock` | 70 | GlobalMenu (dock inferior) |
| `z-dropdown` | 80 | Menus |
| `z-overlay` | 100 | Backdrops de modal |
| `z-modal` | 110 | Conteúdo de modal |
| `z-toast` | 120 | Notificações |
| `z-intro` | 150 | Intro da Catedral / loading |

**Proibido** `z-index` ≥ 9997 (o `ThemeToggle`-cortina morto usava 9999).

---

## Elevation & Materialidade

### Sombra / elevação (NOVO — tokenizar)

Sombras devem usar o token, **não literais** — hoje `shadow-[0_-4px_40px_rgba(47,51,49,0.04)]` embute o valor light de `on-background` e não acompanha o dark.

| Token | Valor (use `var(--on-background)` na cor) |
|---|---|
| `elev-0` | `none` |
| `elev-1` | `0 1px 2px rgb(var(--on-background)/0.06)` |
| `elev-2` | `0 8px 32px rgb(var(--on-background)/0.06)` |
| `elev-3` | `0 24px 64px rgb(var(--on-background)/0.10)` |
| `glow-gold-sm` | `0 0 12px rgb(var(--gold-expressive)/0.25)` |
| `glow-gold-md` | `0 8px 32px rgb(var(--gold-expressive)/0.20)` |

### Materialidade tátil sobre flat

Combata o flat empilhando camadas: **grain** (`NoiseOverlay` fractalNoise @ 0.03, `mix-blend-overlay`), gradientes de contraste sobre fotos, drop-shadows douradas e **profundidade 3D** (`perspective: 1200px`, `rotateY`, `translateZ`) em TiltCards e FocusRail. Padronizar **uma** fonte de grain (hoje há `NoiseOverlay` inline + `grainy-gradients` remoto no dock). Tilt/grain **devem degradar** sob `prefers-reduced-motion` e em mobile.

---

## Glass (Vidro Líquido — sistema único)

A "linguagem de vidro" tinha **3 receitas concorrentes** (`.wedding-glass` 12px, `.liquid-glass` morto, dock inline 24px, Countdown inline). Agora **uma fonte da verdade**, 3 níveis:

| Token | blur | Uso |
|---|---|---|
| `glass-sm` | 8px | Chips, badges, sliders |
| `glass-md` | 12px | Cards, Footer, painéis |
| `glass-lg` | 24px | Dock (GlobalMenu), modais |

Tokens de composição (reativos ao tema):
- `glass-bg` → `rgb(var(--surface-lowest) / 0.35)` (light) · `/ 0.15` (dark)
- `glass-border` → gradiente **vertical simétrico** de `gold-expressive`: `0.25 → 0.05 → 0 → 0 → 0.05 → 0.25` via `mask-composite` (a borda-assinatura)
- `glass-highlight` → `inset 0 1px 1px rgb(255 255 255 / 0.2)` (light) · `/ 0.05` (dark)

**Eliminar**: `.liquid-glass` (CSS morto) e todo glass reimplementado inline; todos os consumidores passam a usar `glass-*`.

---

## Motion (gramática expo-out)

Movimento é **gramática, não enfeite** — comunica continuidade app-nativa. Tokens:

| Token | Valor | Uso |
|---|---|---|
| `ease-expo` | `cubic-bezier(0.22, 1, 0.36, 1)` | **Curva-assinatura** — entradas e hovers |
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transições utilitárias |
| `spring-soft` | `stiffness 300, damping 30` | Indicadores deslizantes, layout |
| `spring-tap` | `stiffness 450, damping 18` | Feedback de toque (FocusRail) |
| `dur-fast` | `200ms` | Micro-feedback |
| `dur-base` | `500ms` | Transições padrão |
| `dur-slow` | `1200ms` | Heros, revelações cinematográficas |

**Padrão de revelação canônico:** `opacity + y + filter blur→sharp`, com stagger. Feedback tátil: `active:scale-[0.98]`, `whileTap 0.95`.

### Reduced-motion (tier de 1ª classe — obrigatório)

Hoje **nenhum** componente consulta `prefers-reduced-motion` (20 partículas infinitas no `FloatingBackground`, rotação 360 infinita, parallax). **Regra:** todo componente animado deve oferecer um caminho reduzido — quando `prefers-reduced-motion: reduce`, animações infinitas/parallax/tilt **param** ou viram um simples fade `dur-fast`. Conteúdo nunca depende de animação para aparecer.

---

## Components

| Componente | Fundo | Texto | Contraste | Notas |
|---|---|---|---|---|
| `button-primary` | `primary` | `on-primary` | **6.1:1** ✓ | `label` uppercase, `rounded.sm` |
| `button-secondary` | `surface` | `primary` | ✓ | borda `outline-variant/30` |
| `button-gold` | `gold-expressive` | `on-background` (≈preto) | **8.5:1** ✓ | CTA "Dar meu Lance", `pill` |
| `card-gift` | `surface` | `on-surface` | ✓ | hover: borda `gold-expressive/10` + `elev-3` |
| `input-text` | `surface-low` | `on-background` | ✓ | `pill`, foco `ring-primary` |
| `badge-category` | `surface-lowest` | `gold-readable` | ✓ AA | tag de categoria (ouro **legível**) |
| `glass-panel` | `glass-md` | `on-surface` | ✓ | borda dourada-assinatura |
| `dock-glass` | `surface-high` | `on-surface` | ✓ | GlobalMenu (dock), `glass-lg`, `z-dock` |
| `tooltip` | `surface-highest` | `on-surface` | ✓ | dica curta, `label-sm` |
| `modal-surface` | `surface` | `on-surface` | ✓ | `z-modal`, backdrop `z-overlay` |
| `banner-error` | `error-container` | `on-error-container` | ✓ AA | feedback de falha no Firestore |
| `banner-success` | `success-container` | `on-success-container` | ✓ AA | "Presença confirmada!" |
| `banner-warning` | `warning-container` | `on-warning-container` | ✓ AA | aviso (ex.: cota quase esgotada) |
| `banner-info` | `info-container` | `on-info-container` | ✓ AA | informação neutra |
| `pill-warning` / `pill-info` | `warning` / `info` | `on-warning` / `on-info` | ✓ AA | chips de status sólidos |

> **Bordas**: o schema atual do DESIGN.md não tem `borderColor`. As bordas normativas vivem aqui — `button-secondary`/`card-gift`/`input-text`/`modal-surface` usam `outline-variant` (≈30% alpha); `glass-panel`/`dock-glass` usam a **borda dourada-assinatura** (gradiente `gold-expressive`).

### Gesto como confirmação (com fallback — regra de acessibilidade)

Ações críticas (confirmar presença, presentear, dar lance) usam **gesto de arrastar** (`SwipeToConfirm`/`SlideToUnlock` — a unificar num componente parametrizado) com snap-back e fading granular do texto. **Obrigatório:** o gesto é a forma *preferida*, **nunca a única**. Todo controle por gesto deve ter:
- `role="button"`, `tabindex="0"`, `aria-label` descritivo no handle;
- ativação por **teclado** (Enter/Espaço) e **tap** simples como fallback;
- estado visível de foco (`ring-2 ring-primary`).

---

## Do's and Don'ts

**Do**
- Derive todo dourado de `gold-expressive`/`gold-readable`; escolha pelo papel (decorar vs ler).
- Use `gold-readable` para qualquer texto dourado pequeno.
- Use a escala `surface-*` para elevação; pares `on-*` para texto.
- Use os tokens de `motion`, `glass`, `elev-*` e `z-*` — nunca valores avulsos.
- Ofereça fallback de teclado/tap + ARIA em todo gesto.
- Respeite `prefers-reduced-motion` em tudo que anima.

**Don't**
- ❌ Hex crus de ouro (`#d4af37`, `#F2D780`, `rgba(212,175,55)`) nem `[filter:sepia...]` no logo.
- ❌ `gold-expressive` em texto pequeno no tema claro (reprova AA).
- ❌ Reimplementar glass inline ou usar `.liquid-glass` (morto).
- ❌ `z-index` ≥ 9997; sombras com cor literal (`rgba(47,51,49,…)`).
- ❌ Carregar Newsreader/Zeyada; usar `headline`≠`body` como se fossem 2 fontes.
- ❌ Ação crítica acionável **só** por arrastar.

---

## Migration map (as-is → to-be)

| # | Hoje | Alvo | Onde |
|---|---|---|---|
| 1 | `--gold` único | `gold-expressive` + `gold-readable` | `globals.css`, todo uso de `text-gold` |
| 2 | Hex crus de ouro | tokens derivados | `CathedralIntro`, `Navigation` (filtro), `FloatingBackground` |
| 3 | `headline == body` (Cormorant) | Playfair (display) vs Cormorant (corpo) | `tailwind.config.ts`, `layout.tsx` |
| 4 | Newsreader + Zeyada carregadas | removidas | `layout.tsx` |
| 5 | 3 receitas de glass | `glass-sm/md/lg` | `globals.css`, `GlobalMenu`, `Countdown`, `Footer` |
| 6 | `[0.22,1,0.36,1]` copiado à mão | `ease-expo` token | ~30 componentes |
| 7 | sem reduced-motion | tier obrigatório | `FloatingBackground`, `AnimatedText`, intros |
| 8 | `--primary-fixed-dim` indefinido | definido | `globals.css`, `eventos/page.tsx` |
| 9 | z-index 9997–9999 / colisões | escala `z-*` | `ThemeToggle` (morto → remover), modais |
| 10 | sem estados semânticos | `error/success/warning/info` | feedback de RSVP/checkout |
| 11 | sombras com cor literal | `elev-*` com `var(--on-background)` | global |
| 12 | gesto sem fallback | teclado/tap + ARIA | `SwipeToConfirm`, `SlideToUnlock` |

> **Fora do escopo deste DESIGN.md** (trilha de engenharia, ver análise crítica): pagamento simulado, RSVP-First sem auth, regras do Firestore, `eval()` de CDN. O design system não os resolve, mas o produto depende deles.
