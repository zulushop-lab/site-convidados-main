# SPEC-PRESENTES-CARD-UX — Destaque do preço total + "Ajustar Valor" inline

> Status: 🟡 a implementar (22/06) · Track: UI/UX · Depende de: SPEC-GIFTS-CATALOG (contrato/itens), SPEC-CHECKOUT-HONESTY (contrato `?amount=&item=`) · Relacionada: [[SPEC-PRESENTES-FOTOS]]

## 1. Objetivo
Dois ajustes de UX na página de presentes:
1. **Destaque do preço total nos cards da grade:** inverter a hierarquia visual — o **preço total** passa ao slot de destaque (hoje ocupado pela cota mínima) e a **cota mínima** vira a linha discreta, somada a uma **frase de reforço** ("Contribua a partir de R$ X") para o convidado não achar que paga o total. **O modal de detalhes não muda.**
2. **Conserto do "Ajustar Valor":** hoje o botão (no card e no modal) leva o convidado para a seção genérica "Contribuição Livre" e **perde o presente** (checkout vira `item=Contribuição Livre`). Deve virar um **campo inline** onde o convidado digita e envia o valor desejado **mantendo o presente** escolhido (checkout recebe o título correto), com **mínimo de R$ 50**.

> A troca de destaque é **só de exibição**: o botão "Contribuir" continua enviando `minimumContribution` ao checkout. A honestidade ("cota mínima" continua visível + reforço) evita interpretar o total como valor a pagar.

## 2. Contexto atual (verificado em código)
- `app/presentes/page.tsx:448-463` — bloco de preço **do card**: linha em destaque mostra `Cota mínima` + `minimumContribution` (`text-primary font-bold text-base`); abaixo, `Preço total: …` discreto (`text-[10px] …/60`).
- `app/presentes/page.tsx:207-221` — bloco de preço **do modal**: `Cota mínima` grande (`font-headline text-2xl italic`) + `Preço total` pequeno. (Inalterado por esta spec.)
- `app/presentes/page.tsx:46-57` — `handleShortcutClick(amount)`: faz `setCustomAmount(...)` e **rola** até `customAmountRef` (seção "Contribuição Livre", `:537`). É o que "desvia" o convidado.
- `app/presentes/page.tsx:230-238` (modal) e `:484-493` (card, dentro do `SlideToUnlock` `unlockedContent`) — botão **"Ajustar Valor"** chama `handleShortcutClick(minimumContribution)`; no modal ainda fecha o modal (`setSelectedGift(null)`).
- `app/presentes/page.tsx:224-229` (modal) e `:476-483` (card) — botão **"Contribuir"** é um `Link` para `/presentes/checkout?amount=<minimumContribution vírgula>&item=<encodeURIComponent(title)>`.
- `app/presentes/page.tsx:59-67` — `handleCustomContribution()` → `setIsConfirmModalOpen(true)`; `confirmContribution()` → `router.push('/presentes/checkout?amount=<customAmount>&item=Contribuição Livre')`. Fluxo da seção "Contribuição Livre" (`:537-586`), **independente** e mantido.
- `app/presentes/checkout/page.tsx:13-14` — checkout lê `amount` e `item` da query string. Contrato a preservar.
- `components/SlideToUnlock.tsx` — recebe `unlockedContent` (ReactNode) e o exibe após o gesto; é onde ficam os botões do card.

## 3. Escopo
**Inclui:**
- Inverter a hierarquia preço total ↔ cota mínima **apenas nos cards** da grade (`:448-463`), com frase de reforço.
- Criar componente reutilizável de ações de contribuição do presente (botões "Contribuir" + "Ajustar Valor" com input inline) e usá-lo no card e no modal.
- Conserto do "Ajustar Valor" (inline, mantém presente, mínimo R$ 50) no **card e no modal**.
- Remover `handleShortcutClick` (fica órfão).

**Não inclui:**
- Mudança de layout do **modal** quanto à exibição de preço/cota (continua como está).
- Mudanças no checkout (`app/presentes/checkout/page.tsx`) além de consumir o contrato existente.
- Seção "Contribuição Livre" do rodapé (`:537-586`) e seu modal de confirmação — permanecem.
- Fotos/itens do catálogo (→ [[SPEC-PRESENTES-FOTOS]]).

## 4. Requisitos técnicos
- **RT-1 — Inverter destaque no card (só card).** Em `app/presentes/page.tsx:452-462`, trocar para: linha de destaque = rótulo `Preço total` + `referenceTotal` (mantendo as classes de destaque `font-body text-primary font-bold text-base`); linha discreta = `Cota mínima: <minimumContribution>` (`text-[10px] …/60`). O modal (`:207-221`) **não muda**.
- **RT-2 — Frase de reforço.** Logo após a cota mínima discreta, exibir uma microcópia curta, ex.: `Contribua a partir de <minimumContribution>` (`text-[10px] text-primary/70`). Texto não pode afirmar que o convidado paga o total.
- **RT-3 — Componente de ações reutilizável.** Criar `components/GiftContributionActions.tsx` (client component) com props `{ giftTitle: string; minimum: number; layout?: 'modal' | 'card' }`. Responsabilidades:
  - Estado padrão: botões "Contribuir" (vai ao checkout com `amount = minimum`) e "Ajustar Valor".
  - Ao clicar "Ajustar Valor": alterna para um **input inline** (`inputMode="decimal"`, pré-preenchido com `minimum` formatado `R$`), + botão "Contribuir"/enviar e opção de cancelar/voltar.
  - Ao enviar: validar `valor >= minimum`; se ok, `router.push('/presentes/checkout?amount=<valor vírgula>&item=<encodeURIComponent(giftTitle)>')`. Se `< minimum`, manter desabilitado + aviso curto.
  - Formatar `amount` como os links atuais: `valor.toFixed(2).replace('.', ',')`.
  - Parsing do input: aceitar dígitos e vírgula; converter vírgula→ponto para comparar com `minimum`.
- **RT-4 — Usar no modal.** Substituir os dois botões do modal (`:223-239`) pelo `<GiftContributionActions giftTitle={selectedGift.title} minimum={selectedGift.minimumContribution} layout="modal" />`. O "Ajustar Valor" não fecha mais o modal nem rola a página.
- **RT-5 — Usar no card.** Substituir o conteúdo de `unlockedContent` do `SlideToUnlock` (`:473-495`) pelo `<GiftContributionActions giftTitle={gift.title} minimum={gift.minimumContribution} layout="card" />`. Preservar o `onClick={(e) => e.stopPropagation()}` no wrapper (`:469`) para o clique não abrir o modal do card.
- **RT-6 — Remover `handleShortcutClick`.** Após RT-4/RT-5, remover a função (`:46-57`) e qualquer import não usado. **Não** remover `handleCustomAmountChange`, `handleCustomContribution`, `confirmContribution`, `customAmount`, `customAmountRef`, `isConfirmModalOpen` — pertencem à seção "Contribuição Livre" do rodapé, que permanece.
- **RT-7 — Preservar contrato do checkout.** Todo caminho de contribuição de um presente (Contribuir e Ajustar Valor) deve gerar `?amount=<valor com vírgula>&item=<encodeURIComponent(<título do presente>)>` — **nunca** `item=Contribuição Livre` para um presente específico.
- **RT-8 — Acessibilidade.** Botões/inputs com `aria-label` claros; o input do "Ajustar Valor" associado a `label`; foco vai ao input ao abrir o modo de ajuste.

## 5. Modelo de dados / contratos
**Sem mudança de dados.** Contrato de navegação (inalterado, agora também usado pelo "Ajustar Valor"):
`/presentes/checkout?amount=<valor com vírgula>&item=<encodeURIComponent(título)>` (lido em `app/presentes/checkout/page.tsx:13-14`).

**Props do componente novo:**
```ts
interface GiftContributionActionsProps {
  giftTitle: string;
  minimum: number;          // = gift.minimumContribution (R$ 50)
  layout?: 'modal' | 'card';
}
```

## 6. Arquivos afetados
- **Editar** `app/presentes/page.tsx` — RT-1/RT-2 (destaque no card), RT-4 (modal usa componente), RT-5 (card usa componente), RT-6 (remover `handleShortcutClick`).
- **Criar** `components/GiftContributionActions.tsx` — RT-3.
- **(Documento)** este arquivo.

## 7. Critérios de aceite
- [ ] No **card**, o **preço total** está em destaque (bold/primary) e a **cota mínima** aparece discreta + frase "Contribua a partir de R$ 50".
- [ ] O **modal** continua mostrando "Cota mínima" em destaque (layout inalterado).
- [ ] "Ajustar Valor" (card e modal) abre input inline; digitar `120,00` e enviar leva a `/presentes/checkout?amount=120,00&item=<título do presente>` (não "Contribuição Livre").
- [ ] Valor `< 50` fica bloqueado (botão desabilitado/aviso).
- [ ] "Contribuir" (card e modal) continua indo a `?amount=<cota mínima>&item=<título>`.
- [ ] `handleShortcutClick` não existe mais; a seção "Contribuição Livre" do rodapé continua funcionando.
- [ ] Clicar "Ajustar Valor" no card **não** abre o modal de detalhes do card (stopPropagation preservado).
- [ ] `npm run build` passa sem erro.

## 8. Validação e2e (e2e-validation-gate)
Pipeline crítico: **card/modal → `GiftContributionActions` → `/presentes/checkout?amount=&item=`**.
1. **Baseline:** `npm run build` verde; abrir `/presentes`; notar destaque atual (cota mínima) e que "Ajustar Valor" rola para "Contribuição Livre".
2. **Mudança:** aplicar RT-1..RT-8.
3. **Validar por camada:**
   - UI card: preço total em destaque; "Contribua a partir de R$ 50" visível; modal inalterado.
   - Ação Contribuir (card e modal): URL do checkout com `amount` = cota mínima e `item` = título.
   - Ação Ajustar Valor (card e modal): inline; enviar `120,00` → checkout `amount=120,00&item=<título>`; `40,00` bloqueado.
   - Regressão: seção "Contribuição Livre" do rodapé ainda envia `item=Contribuição Livre`.
4. **Reverter:** `git checkout -- app/presentes/page.tsx && git clean -f components/GiftContributionActions.tsx`.
5. **Revalidar:** build verde após revert e após reaplicar.

## 9. Tarefas humanas / dependências externas
- Nenhuma credencial nova. Validação visual humana recomendada (auditoria de honestidade: nenhuma tela sugere que o convidado paga o total).

## 10. Riscos e mitigação
- **Convidado achar que paga o preço total:** Mitigação RT-2 (frase de reforço) + cota mínima sempre visível; auditoria de honestidade no aceite.
- **"Ajustar Valor" do card abrir o modal por bubbling:** Mitigação RT-5 (preservar `stopPropagation` do wrapper `:469`).
- **Quebra do contrato do checkout** (perder `item`/`amount`): Mitigação RT-7 + e2e passo 3.
- **Remoção indevida de estado da "Contribuição Livre"** ao remover `handleShortcutClick`: Mitigação RT-6 (lista explícita do que NÃO remover).
- **Formato de `amount` divergente** (ponto vs vírgula) quebrando o parse do checkout: Mitigação RT-3 (sempre `toFixed(2).replace('.', ',')`).

## 11. Metas auditáveis (Definition of Done verificável por LLM)
| # | Meta | Como auditar | Alvo (PASS) |
|---|---|---|---|
| M-1 | `handleShortcutClick` removido (RT-6) | `rg -n "handleShortcutClick" app/presentes/page.tsx` | 0 ocorrências |
| M-2 | Componente novo existe e é client (RT-3) | `test -f components/GiftContributionActions.tsx` e `rg -n "'use client'" components/GiftContributionActions.tsx` | arquivo existe E ≥1 |
| M-3 | Componente usado no card e no modal (RT-4/RT-5) | `rg -n "GiftContributionActions" app/presentes/page.tsx` | ≥2 ocorrências (import + usos; ou ≥3 com 2 usos) |
| M-4 | Frase de reforço presente no card (RT-2) | `rg -ni "Contribua a partir de" app/presentes/page.tsx` | ≥1 ocorrência |
| M-5 | Rótulo "Preço total" no slot de destaque do card (RT-1) | inspeção de `app/presentes/page.tsx:452-462`: a linha `flex justify-between` mostra `Preço total` + `referenceTotal` | PASS por inspeção |
| M-6 | Modal de preço inalterado (RT-1) | `rg -n "font-headline text-2xl italic text-primary" app/presentes/page.tsx` (bloco do modal `:211`) | ≥1 (cota mínima ainda em destaque no modal) |
| M-7 | Nenhum caminho de presente usa `item=Contribuição Livre` no componente (RT-7) | `rg -n "Contribuição Livre" components/GiftContributionActions.tsx` | 0 ocorrências |
| M-8 | Contrato do checkout preservado (RT-7) | `rg -n "presentes/checkout\?amount=" components/GiftContributionActions.tsx app/presentes/page.tsx` | ≥1 ocorrência com `item=` |
| M-9 | Estado da "Contribuição Livre" preservado (RT-6) | `rg -n "handleCustomContribution\|confirmContribution\|customAmountRef" app/presentes/page.tsx` | ≥1 de cada |
| M-10 | Build sem erro (aceite) | `npm run build` | exit code 0 |
| M-11 | [humano] Ajustar Valor inline funciona em card+modal e bloqueia `<50` (RT-3) | teste manual conforme e2e §8.3 | confirmação humana |

## 12. Rodada 2 — pós-conferência (22/06)

### RT-9 — "Contribuir Total" envia o valor total
O botão principal (card e modal) passa a se chamar **"Contribuir Total"** e envia `referenceTotal` ao checkout (antes enviava `minimumContribution`). Em `components/GiftContributionActions.tsx`: nova prop `total: number`; o botão principal usa `router.push(checkoutHref(toAmountParam(total)))`. `app/presentes/page.tsx` passa `total={gift.referenceTotal}` / `total={selectedGift.referenceTotal}`. O **"Ajustar Valor" fica inalterado** (piso e valor pré-preenchido = `minimum`, R$ 50).

### RT-10 — Selo de categoria legível em todos os cards
O selo de categoria no card (`app/presentes/page.tsx`) muda de `bg-white/95 backdrop-blur-sm ... text-primary` (cinza translúcido, ilegível sobre fotos claras) para **`bg-gold text-white font-semibold`** (pílula dourada opaca + texto branco), com `text-[8px]`→`text-[9px]`. Como é renderizado dentro do `.map`, aplica-se a todos os cards.

### Aceite (Rodada 2)
- [ ] "Contribuir Total" (card e modal) → `/presentes/checkout?amount=<referenceTotal>&item=<título>`.
- [ ] "Ajustar Valor" continua custom (≥ R$ 50); seção "Contribuição Livre" do rodapé intacta.
- [ ] Selo de categoria legível (dourado/branco) em todas as fotos.
- [ ] `npm run build` verde.

### Metas auditáveis (Rodada 2)
| # | Meta | Como auditar | Alvo (PASS) |
|---|---|---|---|
| M-12 | Prop `total` e rótulo "Contribuir Total" no componente (RT-9) | `rg -n "total" components/GiftContributionActions.tsx` e `rg -n "Contribuir Total" components/GiftContributionActions.tsx` | ambas ≥1 |
| M-13 | `page.tsx` passa `total=` ao componente nos 2 usos (RT-9) | `rg -n "total=\{.*referenceTotal\}" app/presentes/page.tsx` | ≥2 ocorrências |
| M-14 | Selo dourado/branco aplicado (RT-10) | `rg -n "bg-gold text-white" app/presentes/page.tsx` | ≥1 ocorrência |
| M-15 | Build verde (aceite) | `npm run build` | exit code 0 |
