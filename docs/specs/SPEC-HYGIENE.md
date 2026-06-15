# SPEC-HYGIENE — Higiene & quick wins

> Status: planejado · Fase original: 0 · Track: B · Depende de: — · Destrava: build limpo (base para todas as demais specs)

## 1. Objetivo
Eliminar a dívida de higiene barata e de alto retorno do repositório: corrigir o bug de render do token fantasma `--primary-fixed-dim` (timeline de eventos renderiza sem cor), remover código/dependências/fontes/CSS mortos, consertar typos visíveis e apagar a identidade residual de "AI Studio". É a Fase 0 do Track B: não toca DB nem runtime transacional, mas deixa o terreno limpo (build sem ruído, sem deps fantasma) para todas as specs subsequentes.

## 2. Contexto atual (verificado em código)
- **Bug crítico de render (token fantasma):** `tailwind.config.ts:18` mapeia `primary.fixed-dim` → `rgb(var(--primary-fixed-dim) / <alpha-value>)`; `app/eventos/page.tsx:244` consome `bg-primary-fixed-dim` no fio central da timeline. Porém `--primary-fixed-dim` **NÃO está declarado** em `app/globals.css` — em `:root` (l.6–28) e `.dark` (l.30–52) só existem `--primary` (l.9/33), `--primary-dim` (l.10/34) e `--primary-container` (l.11/35). Resultado: a variável CSS resolve para vazio e o fio da timeline renderiza com cor indefinida/transparente. `DESIGN.md:23,266,285,479` afirma erroneamente que o token já está definido.
- **Componentes órfãos (zero import):**
  - `components/CardTeaser.tsx` — definido (interface l.9, export l.18), mas nenhum arquivo de `app/` ou `components/` o importa.
  - `components/ThemeToggle.tsx` (export l.143) e `components/NavigationThemeToggle.tsx` (export l.7) — `NavigationThemeToggle.tsx:4` importa `./ThemeToggle`, mas nenhum **pai** importa `NavigationThemeToggle` nem `components/ThemeToggle`. Os dois só se cross-importam → cluster morto. Atenção: o `ThemeToggle` **vivo** é outro, definido localmente em `components/Navigation.tsx:22` e usado em `Navigation.tsx:129` — esse NÃO se remove.
- **Dependências fantasma (`package.json`):** `@google/genai` (l.12) e `@hookform/resolvers` (l.13) — zero imports em código (só aparecem em `package.json`/`package-lock.json` e em docs).
- **Fontes mortas (`app/layout.tsx`):** `Newsreader` (l.34–39, define `--font-newsreader`) e `Zeyada` (l.48–52, define `--font-zeyada`). As classes `font-newsreader`/`font-zeyada` têm **zero uso** em `.tsx`. As variáveis ainda são injetadas no `<html className>` (l.64) e mapeadas em `tailwind.config.ts:49-50` (`zeyada`, `newsreader`). Verificado que `font-playfair` (Footer, LoadingScreen, Navigation), `font-alex-brush` (page.tsx, rsvp/[code]/page.tsx) e `font-label`/`--font-montserrat` (uso amplo) estão **vivas** → preservar.
- **CSS morto:** `.liquid-glass` em `app/globals.css:126-154` (e variantes `.dark .liquid-glass`, `.liquid-glass::before`) — zero consumidores. A `.wedding-glass` (l.93–123) é a viva → preservar.
- **Typos visíveis (`app/presentes/page.tsx`):** l.990 texto do botão `"Carregar Mais Presentes ({...} descatologados)"` (deveria ser "restantes"); l.649 `aria-label="Refechar modal"` (deveria ser "Fechar modal").
- **Identidade residual "AI Studio":**
  - `package.json:2` `"name": "ai-studio-applet"`.
  - `README.md` (l.5 "Run and deploy your AI Studio app", l.9 link AI Studio, l.18 instrução `GEMINI_API_KEY`, l.2 banner do Google AI).
  - `.env.example` referencia `GEMINI_API_KEY` e `APP_URL` com texto "AI Studio automatically injects…" — irrelevante para um site de casamento Firebase.

## 3. Escopo
**Inclui:**
- Declarar `--primary-fixed-dim` em `app/globals.css` (light + dark) — corrige o bug de render da timeline.
- Remover componentes órfãos confirmados (`CardTeaser.tsx`, `ThemeToggle.tsx`, `NavigationThemeToggle.tsx`).
- Remover deps fantasma de `package.json` e atualizar `package-lock.json`.
- Remover fontes mortas (`Newsreader`, `Zeyada`) de `app/layout.tsx`, do `<html className>` e de `tailwind.config.ts`.
- Remover CSS morto `.liquid-glass` (+ variantes) de `app/globals.css`.
- Corrigir os dois typos em `app/presentes/page.tsx`.
- Corrigir identidade: `package.json name`, `README.md`, `.env.example`.

**Não inclui:**
- Aplicar os tokens novos do `DESIGN.md` v2 (paleta error/success/warning/info, escala `z-*`, novos containers etc.) — isso é a **trilha de design** (ciclo separado). Aqui só se declara o **único** token fantasma já referenciado em código (`--primary-fixed-dim`), com o valor mínimo necessário para o build/render parar de quebrar.
- Refatorar o `ThemeToggle` vivo (`Navigation.tsx:22`) ou trocar mecânica de tema.
- Qualquer mudança em rules do Firestore, schema (`domain/types/index.ts`), `lib/firebase.ts`, decisão de banco nomeado vs default (é TAREFA DE PREFLIGHT de outra spec) ou seed.
- Reescrever o `README.md` com documentação completa do projeto (basta remover o resíduo AI Studio e deixar um stub honesto).

## 4. Requisitos técnicos
- **RT-1 — Declarar `--primary-fixed-dim`.** Em `app/globals.css`, adicionar a variável em ambos os blocos:
  - `:root` (light): `--primary-fixed-dim: <r, g, b>;` (formato RGB sem `rgb()`, como as demais — ex. consistente com o token de mesma família `--primary-container`/`--primary-dim`).
  - `.dark`: `--primary-fixed-dim: <r, g, b>;`.
  - Valor mínimo: usar um tom de baixo contraste adequado a um fio de timeline de 1px. Sugestão alinhada ao `DESIGN.md:266` (light `#AFB3B0` → `175, 179, 176`; dark `#404945` → `64, 73, 69`), que por acaso coincidem com `--outline-variant` já presente (l.25 light; l.49 dark). Aceita-se reusar exatamente esses valores. **Não** introduzir os demais tokens do DESIGN.md v2.
- **RT-2 — Reconfirmar zero-import antes de deletar.** Antes de apagar cada componente, rodar grep por nome do arquivo e pelo símbolo exportado em `app/**` e `components/**`. Só deletar se o resultado for vazio (descontando o próprio arquivo e a cross-importação `NavigationThemeToggle → ThemeToggle`). Documentar o comando/resultado no PR.
- **RT-3 — Remover componentes órfãos.** Deletar `components/CardTeaser.tsx`, `components/NavigationThemeToggle.tsx` e `components/ThemeToggle.tsx`. **Não** tocar em `components/Navigation.tsx` (que tem seu próprio `ThemeToggle` local, vivo).
- **RT-4 — Remover deps fantasma.** Em `package.json`, remover as linhas `@google/genai` (l.12) e `@hookform/resolvers` (l.13). Rodar `npm install` para sincronizar `package-lock.json` (remover as entradas correspondentes do lockfile).
- **RT-5 — Remover fontes mortas.** Em `app/layout.tsx`: remover `Newsreader` e `Zeyada` do import `next/font/google` (l.2), apagar os blocos `const newsreader = …` (l.34–39) e `const zeyada = …` (l.48–52) e tirar `${newsreader.variable}` e `${zeyada.variable}` do `<html className>` (l.64). Em `tailwind.config.ts`: remover as chaves `zeyada` (l.49) e `newsreader` (l.50) de `fontFamily`. Preservar `montserrat`/`--font-montserrat`, `cormorant`, `playfair`, `alex-brush` (todas vivas).
- **RT-6 — Remover CSS morto.** Em `app/globals.css`, apagar o comentário "Liquid Glass Effect from Prompt" (l.125) e os blocos `.liquid-glass`, `.dark .liquid-glass`, `.liquid-glass::before` (l.126–154). Preservar `.wedding-glass`.
- **RT-7 — Corrigir typos.** Em `app/presentes/page.tsx`: l.990 trocar `descatologados` por `restantes`; l.649 trocar `aria-label="Refechar modal"` por `aria-label="Fechar modal"`.
- **RT-8 — Corrigir identidade do projeto.** Em `package.json:2` trocar `"name": "ai-studio-applet"` por `"name": "site-convidados"`. Em `README.md` remover banner/texto "AI Studio" e instrução `GEMINI_API_KEY`; substituir por stub honesto (nome do projeto, stack Next.js 15 + Firebase, comandos `npm install` / `npm run dev` / `npm run build`). Em `.env.example` remover `GEMINI_API_KEY` e o texto "AI Studio"; deixar apenas placeholders relevantes ao projeto (ou esvaziar com comentário "preencher conforme Firebase/Mercado Pago em specs futuras").
- **RT-9 — Build limpo.** Após todas as mudanças, `npm run build` (`NODE_ENV=production next build`, ver `package.json:7`) deve passar sem erros, e `npm run lint` (`eslint .`, l.9) não deve introduzir novos erros relacionados às remoções.

## 5. Modelo de dados / contratos
N/A — esta spec não toca Firestore, schema (`domain/types/index.ts`), rules, payloads nem URLs. A única alteração de "contrato visual" é a adição do token CSS `--primary-fixed-dim` (consumido via `tailwind.config.ts:18` → utilitário `bg-primary-fixed-dim`/`*-primary-fixed-dim`), que passa a resolver para um valor RGB válido em light e dark.

## 6. Arquivos afetados
**Editar:**
- `app/globals.css` — adicionar `--primary-fixed-dim` em `:root` e `.dark` (RT-1); remover `.liquid-glass` e variantes (RT-6).
- `tailwind.config.ts` — remover `zeyada` e `newsreader` de `fontFamily` (RT-5).
- `app/layout.tsx` — remover fontes `Newsreader`/`Zeyada` (import, consts, `<html className>`) (RT-5).
- `package.json` — remover deps fantasma (RT-4); corrigir `name` (RT-8).
- `package-lock.json` — sincronizar após `npm install` (RT-4).
- `app/presentes/page.tsx` — corrigir typos l.649 e l.990 (RT-7).
- `README.md` — remover resíduo AI Studio; stub honesto (RT-8).
- `.env.example` — remover `GEMINI_API_KEY`/AI Studio (RT-8).

**Remover:**
- `components/CardTeaser.tsx` (RT-3).
- `components/ThemeToggle.tsx` (RT-3).
- `components/NavigationThemeToggle.tsx` (RT-3).

**Não tocar (vivos / fora de escopo):**
- `components/Navigation.tsx` (contém o `ThemeToggle` local vivo).
- `app/globals.css` `.wedding-glass`; fontes `montserrat`/`cormorant`/`playfair`/`alex-brush`.
- `lib/firebase.ts`, `firebase-applet-config.json`, `domain/types/index.ts`, rules.

## 7. Critérios de aceite
- [ ] `--primary-fixed-dim` está declarado em `app/globals.css` tanto em `:root` quanto em `.dark`, no mesmo formato RGB das demais variáveis.
- [ ] Em `app/eventos/page.tsx`, o fio central da timeline (`bg-primary-fixed-dim`, l.244) renderiza com cor visível em ambos os temas (light e dark).
- [ ] `components/CardTeaser.tsx`, `components/ThemeToggle.tsx`, `components/NavigationThemeToggle.tsx` foram removidos; grep por seus nomes/símbolos em `app/**` e `components/**` retorna vazio; `components/Navigation.tsx` continua intacto e o tema continua alternando.
- [ ] `@google/genai` e `@hookform/resolvers` não aparecem em `package.json` nem em `package-lock.json` (`dependencies`).
- [ ] Grep por `--font-newsreader`, `--font-zeyada`, `font-newsreader`, `font-zeyada` retorna zero ocorrências em `app/**`, `components/**` e `tailwind.config.ts`. Fontes vivas (`playfair`, `alex-brush`, `montserrat`/`label`, `cormorant`) seguem funcionando.
- [ ] `.liquid-glass` (e variantes) não existe mais em `app/globals.css`; `.wedding-glass` continua presente e funcional.
- [ ] `app/presentes/page.tsx` exibe "restantes" no botão (l.~990) e `aria-label="Fechar modal"` (l.~649).
- [ ] `package.json` `name` = `"site-convidados"`; `README.md` e `.env.example` não contêm "AI Studio" nem `GEMINI_API_KEY`.
- [ ] `npm run build` passa sem erros; `npm run lint` não acusa novos erros decorrentes das remoções.

## 8. Validação e2e (e2e-validation-gate)
Esta spec é estática/build-time (não toca DB nem fluxo transacional), então o gate se concentra em build + render visual:
- **Baseline:** rodar `npm run build` e `npm run lint` no estado atual (capturar warnings/erros). Abrir `app/eventos/page.tsx` em dev e registrar que o fio da timeline está invisível/transparente (bug).
- **Mudança idempotente:** aplicar RT-1..RT-8. Rerodar a remoção/edição não deve produzir efeito adicional (deletar arquivo já removido = no-op; token já declarado = idempotente).
- **Validar propagação por camada:**
  1. CSS: o token `--primary-fixed-dim` aparece em `:root` e `.dark`; no devtools, `--primary-fixed-dim` resolve para RGB válido.
  2. Tailwind/render: `bg-primary-fixed-dim` na timeline (`eventos/page.tsx:244`) fica visível em light e dark.
  3. Bundle: `npm run build` conclui; nenhum import quebrado pelas remoções de componentes.
  4. Deps: `npm ls @google/genai @hookform/resolvers` retorna "not found"/vazio.
  5. Fontes/CSS mortos: grep confirma zero ocorrências de `font-newsreader`/`font-zeyada`/`.liquid-glass`.
  6. Texto: a página de presentes mostra "restantes" e o `aria-label` "Fechar modal".
- **Reverter:** `git stash`/checkout das mudanças; confirmar que o build volta ao baseline (e o bug do fio reaparece) — prova de que a correção é o que fecha o gap.
- **Revalidar:** reaplicar (ou `git stash pop`), rerodar `npm run build` + `npm run lint` e reconferir o render da timeline. Tudo verde.

## 9. Tarefas humanas / dependências externas
- **Conteúdo do README/.env (decisão do usuário):** confirmar o stub final do `README.md` e quais placeholders manter em `.env.example` (ainda não há credenciais Firebase/Mercado Pago definidas — ver decisões travadas #2 e #11). O usuário deve aprovar o texto antes do merge.
- **Confirmação do valor do token (opcional):** aprovar os valores RGB de `--primary-fixed-dim` propostos (reuso de `--outline-variant` / valores do DESIGN.md). Não bloqueante — há default seguro.
- Nenhuma credencial, planilha, rotação de chave ou verificação de console é exigida por esta spec.

## 10. Riscos e mitigação
- **Risco: deletar um componente que parece órfão mas é referenciado dinamicamente** (ex. import por string, lazy/dynamic). Mitigação: RT-2 exige grep por nome de arquivo **e** símbolo exportado em todo `app/**`/`components/**` antes de deletar; build + lint cobrem imports estáticos quebrados.
- **Risco: confundir o `ThemeToggle` morto (`components/ThemeToggle.tsx`) com o vivo (`Navigation.tsx:22`).** Mitigação: a spec só remove o arquivo `components/ThemeToggle.tsx`; `Navigation.tsx` está explicitamente fora de escopo e deve ser verificado (tema continua alternando) no gate.
- **Risco: remover fonte ainda usada.** Mitigação: verificado que `font-newsreader`/`font-zeyada` têm zero uso; `playfair`/`alex-brush`/`montserrat`(`label`)/`cormorant` são preservados. Gate re-checa por grep.
- **Risco: lockfile dessincronizado** após editar `package.json` à mão. Mitigação: rodar `npm install` e commitar `package-lock.json` junto; CI/`npm ci` deve passar.
- **Risco: invadir a trilha de design** introduzindo tokens novos do DESIGN.md v2. Mitigação: escopo restringe a UM token (o fantasma já referenciado em código); qualquer outro token novo é rejeitado em review e fica para o ciclo de design.
- **Risco: `DESIGN.md` fica desatualizado** (afirma que o token já estava definido). Mitigação: não corrigir aqui (DESIGN.md é da trilha de design), mas anotar a divergência no PR para o ciclo de design acertar a redação (`DESIGN.md:285`).

## 11. Metas auditáveis (Definition of Done verificável por LLM)
> Objetivos quantitativos. Cada meta tem um método de auditoria executável e um alvo binário (PASS/FAIL). Uma LLM executora deve rodar a auditoria e reportar o resultado sem julgamento subjetivo. **SPEC entregue ⇔ todas as metas não-[humano] = PASS.** Os comandos assumem a raiz do repositório como diretório de trabalho.

| # | Meta (objetivo) | Como auditar (comando / checagem) | Alvo (PASS) |
|---|---|---|---|
| M-1 | RT-1 — token `--primary-fixed-dim` declarado em light + dark | `rg -n "^\s*--primary-fixed-dim:\s*\d+,\s*\d+,\s*\d+;" app/globals.css` | retorna >= 2 linhas (uma em `:root`, uma em `.dark`) |
| M-2 | RT-1 — token está no formato RGB sem `rgb()` (consistente com a família) | `rg -n "\-\-primary-fixed-dim:\s*rgb\(" app/globals.css` | retorna 0 linhas |
| M-3 | RT-3 — componentes órfãos removidos do disco | `test ! -e components/CardTeaser.tsx && test ! -e components/ThemeToggle.tsx && test ! -e components/NavigationThemeToggle.tsx; echo $?` | imprime `0` (os 3 arquivos não existem) |
| M-4 | RT-2/RT-3 — zero referência aos componentes removidos em `app/**` e `components/**` | `rg -n "CardTeaser\|NavigationThemeToggle\|from ['\"].*components/ThemeToggle['\"]\|from ['\"]\./ThemeToggle['\"]" app components` | retorna 0 linhas |
| M-5 | RT-3 — `components/Navigation.tsx` preservado e com seu `ThemeToggle` local vivo | `test -e components/Navigation.tsx && rg -n "ThemeToggle" components/Navigation.tsx` | arquivo existe e retorna >= 1 linha |
| M-6 | RT-4 — deps fantasma removidas de `package.json` | `rg -n "@google/genai\|@hookform/resolvers" package.json` | retorna 0 linhas |
| M-7 | RT-4 — deps fantasma ausentes do lockfile resolvido | `npm ls @google/genai @hookform/resolvers` (após `npm install`) | sai indicando "(empty)"/"not found" — nenhum pacote instalado |
| M-8 | RT-5 — fontes mortas removidas de código e config | `rg -n "Newsreader\|Zeyada\|font-newsreader\|font-zeyada\|--font-newsreader\|--font-zeyada\|newsreader\|zeyada" app components tailwind.config.ts` | retorna 0 linhas |
| M-9 | RT-5 — fontes vivas preservadas | `rg -n "playfair\|alex-brush\|montserrat\|cormorant" tailwind.config.ts` | retorna >= 4 linhas |
| M-10 | RT-6 — CSS morto `.liquid-glass` removido; `.wedding-glass` preservado | `rg -n "\.liquid-glass" app/globals.css` retorna 0 **e** `rg -n "\.wedding-glass" app/globals.css` retorna >= 1 | ambas as condições verdadeiras |
| M-11 | RT-7 — typos corrigidos em `app/presentes/page.tsx` | `rg -n "descatologados\|Refechar modal" app/presentes/page.tsx` retorna 0 **e** `rg -n "restantes\|aria-label=\"Fechar modal\"" app/presentes/page.tsx` retorna >= 2 | typos ausentes e textos corretos presentes |
| M-12 | RT-8 — identidade AI Studio eliminada | `rg -n -i "ai-studio\|AI Studio\|GEMINI_API_KEY" package.json README.md .env.example` | retorna 0 linhas |
| M-13 | RT-8 — `name` do projeto corrigido | `rg -n "\"name\":\s*\"site-convidados\"" package.json` | retorna >= 1 linha |
| M-14 | RT-9 — build limpo | `npm run build` | sai com código 0 (sem erros) |
