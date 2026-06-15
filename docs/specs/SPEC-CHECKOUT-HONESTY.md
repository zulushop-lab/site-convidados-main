# SPEC-CHECKOUT-HONESTY — Checkout & RSVP honestos
> Status: planejado · Fase original: 2b · Track: A · Depende de: SPEC-FIRESTORE-SECURITY · Destrava: SPEC-PAYMENTS-MP

## 1. Objetivo
Remover as mentiras transacionais do fluxo de presente e da tela de confirmação de RSVP, sem implementar pagamento real ainda. A contribuição passa a nascer honestamente como `'pending'` (a verdade até o webhook do Mercado Pago promover o status), a copy de sucesso para de afirmar pagamento confirmado, o formulário de cartão (campos mortos) é rotulado/desabilitado como "em breve", e o card fake "Cotas de Lua de Mel — Finalizada" some de `/presenca`. Esta spec prepara o terreno honesto que a SPEC-PAYMENTS-MP vai preencher com QR/Pix dinâmico e brick de cartão reais.

## 2. Contexto atual (verificado em código)
- `app/presentes/checkout/page.tsx:43` grava `status: 'completed'` no documento de `contributions`, violando o ENUM travado (cliente só pode criar `'pending'`; só servidor promove a `'completed'`/`'failed'`).
- `app/presentes/checkout/page.tsx:48` faz `await new Promise(resolve => setTimeout(resolve, 1500))` — simula "processamento" inexistente e logo seta `isSuccess`.
- `app/presentes/checkout/page.tsx:64-83` (tela de sucesso) afirma em `l.72`: "Sua contribuição para &quot;{item}&quot; foi confirmada com sucesso." — mente sobre um pagamento que não aconteceu.
- `app/presentes/checkout/page.tsx:159-161` exibe QR mock literal `[QR Code Mock]`; `l.166` mostra string Pix truncada estática e `l.59` (`copyPixCode`) copia uma string Pix FAKE/estática para a área de transferência.
- `app/presentes/checkout/page.tsx:179-192` — botão Pix "Já realizei o pagamento" grava a contribuição como `completed` sem nenhuma verificação de pagamento.
- `app/presentes/checkout/page.tsx:198-248` — campos de cartão `cc-number` / `cc-name` / `cc-exp` / `cc-csc` NÃO têm `onChange`/state (são `required` mas inertes); só `donorName` (`l.21,107-108`) e `donorEmail` (`l.22,121-122`) estão ligados ao state. O `onSubmit` do form de cartão (`l.195`) chama o mesmo `handlePayment` que grava `completed`.
- `app/presentes/checkout/page.tsx:253` já cita o provedor correto: "Pagamento processado de forma segura pelo **Mercado Pago**." (coerência de provedor já parcialmente correta no checkout).
- `app/presenca/page.tsx:123-126` renderiza um card hardcoded "Contribuição de Presente / Cotas de Lua de Mel — Finalizada" na tela de sucesso do RSVP — dado FAKE, sem relação com qualquer contribuição real do convidado.
- `app/presenca/page.tsx:107` afirma "Recebemos sua confirmação com sucesso" — esta é verdadeira (o `addDoc` em `rsvps` ocorreu em `l.60`), portanto NÃO é alvo de remoção; o problema é só o card fake de presente.
- `firestore.rules:50-61` — `isValidContribution` já aceita `data.status in ['pending', 'completed']`; logo gravar `'pending'` já é permitido pelas rules. (A restrição "cliente só cria pending" será endurecida na SPEC-FIRESTORE-SECURITY; aqui o writer apenas para de mandar `completed`.)
- `domain/types/index.ts:28-36` define `TieBid` com `status: 'pending' | 'paid'`, mas NÃO existe um tipo `Contribution` no contrato — a contribuição é um objeto literal inline em `checkout/page.tsx:37-45`.
- `docs/adr/0001-fluxos-checkout-separados.md:4,12` ainda cita "PagSeguro" como gateway — incoerente com a decisão travada (Mercado Pago). A atualização desse ADR é tarefa desta spec por ser questão de "coerência de provedor".

## 3. Escopo
**Inclui:**
- Trocar `status: 'completed'` por `status: 'pending'` no writer de `contributions` (`checkout/page.tsx:43`).
- Trocar a copy da tela de sucesso do checkout para algo honesto ("Recebemos sua intenção de presente — confirmamos assim que o pagamento for processado.").
- Ajustar microcopy do bloco Pix e do botão para refletir "aguardando pagamento" em vez de "já realizei o pagamento" como se isso confirmasse algo.
- Rotular/desabilitar o formulário de cartão como "em breve" (campos mortos não podem aparentar funcionalidade); não submeter contribuição via cartão nesta spec.
- Remover o card fake "Cotas de Lua de Mel — Finalizada" de `app/presenca/page.tsx`.
- Garantir coerência de provedor = Mercado Pago em toda a UI do checkout e atualizar `ADR-0001` (PagSeguro → Mercado Pago).
- (Opcional recomendado) Introduzir o tipo `Contribution` em `domain/types/index.ts` como contrato único do documento, com o ENUM de status alinhado.

**Não inclui:**
- Geração de QR/Pix dinâmico real, preferência de pagamento, brick de cartão ou qualquer chamada ao Mercado Pago (→ SPEC-PAYMENTS-MP).
- Webhook/Admin SDK que promove `pending`→`completed`/`failed` (→ SPEC-PAYMENTS-MP).
- Endurecimento das rules para forçar `status == 'pending'` na criação e bloquear `completed` do cliente (→ SPEC-FIRESTORE-SECURITY; esta spec depende desse endurecimento mas não o executa).
- Catálogo real de presentes / leitura de gifts (→ SPEC-GIFTS-CATALOG).
- Qualquer mudança no fluxo da Gravata (→ SPEC-GRAVATA-LEADERBOARD).
- RSVP por família / auth de convidado (→ SPEC-RSVP-AUTH).

## 4. Requisitos técnicos
- **RT-1 — Status honesto na criação.** Em `app/presentes/checkout/page.tsx`, alterar o objeto `contributionData` (`l.37-45`) para gravar `status: 'pending'` em vez de `'completed'`. Nenhum caminho do cliente pode escrever `'completed'`/`'failed'`/`'processing'`.
- **RT-2 — Remover a simulação de processamento enganosa.** Remover o `await new Promise(...setTimeout 1500)` (`l.48`) que simula confirmação de pagamento. O estado de "enviado" deve refletir apenas que a intenção foi registrada no Firestore, não que houve pagamento.
- **RT-3 — Copy de sucesso honesta.** Substituir o texto de `l.72` por: "Recebemos sua intenção de presente — confirmamos assim que o pagamento for processado." e ajustar o subtexto (`l.74-76`) para não afirmar contribuição concluída; pode agradecer pela intenção/carinho e instruir a concluir o Pix no app do banco. Título "Muito Obrigado!" pode permanecer. Nenhuma frase pode conter "confirmada com sucesso", "pagamento confirmado" ou equivalente.
- **RT-4 — Microcopy do Pix em modo simulado.** Enquanto não houver chaves MP (decisão travada #2), o bloco Pix (`l.155-193`) deve deixar claro que o QR/código é placeholder ("modo simulado" / "disponível em breve") e o botão `l.179-192` não deve afirmar confirmação. Renomear o rótulo do botão de "Já realizei o pagamento" para algo neutro que apenas registra a intenção (ex.: "Registrar intenção de presente"), OU desabilitar o caminho Pix com aviso "em breve" — escolher uma das duas e manter consistência com RT-3. O `copyPixCode` (`l.58-62`) não deve copiar uma string Pix FAKE como se fosse válida: ou remover o botão de copiar no modo simulado, ou copiar/exibir um aviso claro de placeholder.
- **RT-5 — Formulário de cartão "em breve".** No painel de cartão (`l.194-271`), desabilitar todos os inputs (`disabled`) e o botão de submit, e adicionar um rótulo/aviso visível "Pagamento por cartão disponível em breve". Como os campos `cc-*` não têm state (`l.198-247`), remover o atributo `required` deles (para não travar submit acessível) e impedir que o `onSubmit` grave qualquer contribuição via cartão. A ligação real (state/brick) é responsabilidade da SPEC-PAYMENTS-MP.
- **RT-6 — Remover card fake de presente em /presenca.** Remover o bloco `app/presenca/page.tsx:123-126` ("Contribuição de Presente" / "Cotas de Lua de Mel — Finalizada"). A tela de sucesso do RSVP deve refletir SOMENTE dados reais do RSVP (o card "Status da Confirmação", `l.117-122`, que usa contagem real de `adults`/`childrenCount`, permanece). O CTA "Ver Lista de Presentes" (`l.135-138`) pode permanecer como navegação, desde que não afirme que houve contribuição.
- **RT-7 — Coerência de provedor (UI).** Garantir que toda menção a gateway no checkout cite "Mercado Pago" (já correto em `l.253`); verificar que nenhuma outra string de UI cite PagSeguro/outro provedor.
- **RT-8 — Coerência de provedor (ADR).** Atualizar `docs/adr/0001-fluxos-checkout-separados.md` substituindo "PagSeguro" (`l.4,12`) por "Mercado Pago", adicionando nota de supersessão referenciando esta decisão travada. (Cumpre a decisão travada #1: "ADR-0001 hoje diz PagSeguro → atualizar".)
- **RT-9 — Contrato de tipo Contribution (recomendado).** Adicionar a `domain/types/index.ts` a interface `Contribution` com o ENUM travado, e tipar `contributionData` no checkout com ela. Status do cliente sempre `'pending'`. Exemplo de contrato em §5.
- **RT-10 — Sem regressão de erro.** Manter o tratamento via `handleFirestoreError(error, OperationType.CREATE, 'contributions')` (`checkout/page.tsx:54`) e `'rsvps'` (`presenca/page.tsx:66`).

## 5. Modelo de dados / contratos
**Coleção `contributions`** (documento criado pelo cliente; campos atuais inline em `checkout/page.tsx:37-45`):
```
{
  amount: number;            // > 0
  giftTitle: string;         // origem: searchParams 'item'
  donorName: string;
  donorEmail: string;
  paymentMethod: 'pix' | 'credit_card';
  status: 'pending';         // <- cliente SEMPRE 'pending' (era 'completed')
  createdAt: serverTimestamp();
}
```

**ENUM de status (travado, fonte da verdade):** `'pending' | 'processing' | 'completed' | 'failed'`. Cliente só cria `'pending'`; transições para `'processing'`/`'completed'`/`'failed'` são exclusivas do servidor (webhook + Admin SDK) na SPEC-PAYMENTS-MP.

**Tipo proposto em `domain/types/index.ts` (RT-9):**
```ts
export type ContributionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Contribution {
  id: string;
  amount: number;
  giftTitle: string;
  donorName: string;
  donorEmail: string;
  paymentMethod: 'pix' | 'credit_card';
  status: ContributionStatus; // cliente sempre cria 'pending'
  createdAt: number;          // serverTimestamp resolvido
}
```

**Rules relevantes (sem alteração nesta spec):** `firestore.rules:50-61` já aceita `status in ['pending', 'completed']`, logo `'pending'` passa. O endurecimento para proibir `'completed'` na criação pelo cliente é da SPEC-FIRESTORE-SECURITY.

**Coleção `rsvps`:** inalterada nesta spec (a remoção do card fake é puramente de UI; o documento gravado em `presenca/page.tsx:52-58` não muda).

**Payloads/URLs:** N/A nesta spec (sem novos endpoints).

## 6. Arquivos afetados
- Editar: `app/presentes/checkout/page.tsx` (RT-1 a RT-5, RT-7, RT-9, RT-10).
- Editar: `app/presenca/page.tsx` (RT-6, RT-10).
- Editar: `docs/adr/0001-fluxos-checkout-separados.md` (RT-8).
- Editar: `domain/types/index.ts` (RT-9, opcional recomendado).
- Criar/remover: nenhum arquivo novo de runtime; nenhum arquivo removido.

## 7. Critérios de aceite
- [ ] Nenhum caminho do cliente grava `status` diferente de `'pending'` em `contributions` (grep por `'completed'` em `app/` retorna 0 ocorrências no checkout).
- [ ] A tela de sucesso do checkout não contém "confirmada com sucesso" nem afirma pagamento concluído; exibe copy de intenção pendente (RT-3).
- [ ] O `setTimeout(...,1500)` simulando processamento foi removido (RT-2).
- [ ] O bloco Pix sinaliza modo simulado/placeholder e o botão não afirma confirmação; `copyPixCode` não copia silenciosamente uma string Pix fake como se fosse pagável (RT-4).
- [ ] O formulário de cartão está visivelmente desabilitado com rótulo "em breve"; seus inputs não têm `required` órfão e não submetem contribuição (RT-5).
- [ ] A tela de sucesso de `/presenca` não contém "Cotas de Lua de Mel — Finalizada" nem nenhum card de contribuição fake; o card de "Status da Confirmação" com contagem real permanece (RT-6).
- [ ] Nenhuma string de UI do checkout cita "PagSeguro" ou provedor != Mercado Pago (RT-7).
- [ ] `docs/adr/0001-fluxos-checkout-separados.md` não cita mais "PagSeguro"; cita "Mercado Pago" com nota de supersessão (RT-8).
- [ ] (Se RT-9 aplicado) `domain/types/index.ts` exporta `Contribution`/`ContributionStatus` e `contributionData` está tipado.
- [ ] `npm run build` passa sem novos erros de tipo/lint.
- [ ] Auditoria de honestidade: nenhuma tela afirma pagamento ou presente que não aconteceu.

## 8. Validação e2e (e2e-validation-gate)
Esta spec toca runtime user-visível e estado persistente (`contributions`/`rsvps`), portanto passa pelo gate.
- **Baseline:** rodar `npm run build` (deve passar) e abrir o fluxo: `/presentes/checkout?amount=10,00&item=Teste`. Registrar que hoje a contribuição grava `completed` e a tela afirma "confirmada com sucesso"; em `/presenca` o card fake aparece.
- **Mudança idempotente:** aplicar RT-1 a RT-8 (rodável mais de uma vez sem efeito colateral acumulado — são edições de UI/string e do valor do campo `status`).
- **Validar propagação por camada:**
  1. UI checkout: tela de sucesso mostra copy de intenção pendente; cartão desabilitado "em breve"; Pix em modo simulado.
  2. Firestore: o documento criado em `contributions` tem `status: 'pending'` (inspecionar no Console/emulador). Confirmar que a regra `firestore.rules:50-61` aceita o write (não regride).
  3. UI /presenca: confirmar presença e verificar que a tela de sucesso mostra só o card real de status, sem o card de presente.
  4. ADR: confirmar texto atualizado para Mercado Pago.
- **Reverter:** `git checkout` nos arquivos afetados (mudança 100% versionada; nenhum dado de produção precisa de rollback além de, se desejado, apagar o doc de teste criado).
- **Revalidar:** novo `npm run build` verde após revert e após reaplicar; comportamento volta ao baseline no revert e ao esperado na reaplicação.

## 9. Tarefas humanas / dependências externas
- **Dependência de spec:** SPEC-FIRESTORE-SECURITY deve endurecer as rules ANTES (ou junto) para garantir que o cliente não consiga mais gravar `completed`; esta spec assume rules endurecidas e só faz o writer parar de enviar `completed`. Coordenar a ordem com o autor de SPEC-FIRESTORE-SECURITY.
- **Preflight de banco (decisão travada #11):** confirmar no Firebase Console qual banco (default vs. nomeado) tem `contributions`/regras provisionadas antes de validar o e2e contra o ambiente certo. `lib/firebase.ts` usa `getFirestore(app)` (default).
- **Decisão de produto (RT-4):** o usuário decide entre (a) manter o caminho Pix visível em "modo simulado" (registra intenção) ou (b) desabilitar Pix por completo até a SPEC-PAYMENTS-MP. Default sugerido: (a) modo simulado, alinhado à decisão travada #2.
- **Credenciais Mercado Pago:** NÃO necessárias nesta spec (são da SPEC-PAYMENTS-MP). Mencionado só para evitar confusão de escopo.

## 10. Riscos e mitigação
- **Risco: ambiguidade de "modo simulado" levar o convidado a achar que pagou.** Mitigação: copy explícita de pendência (RT-3) + rótulo "modo simulado/em breve" no Pix (RT-4); auditoria de honestidade no critério de aceite.
- **Risco: remover `required` dos campos de cartão sem desabilitar deixar o form aparentemente funcional.** Mitigação: RT-5 exige `disabled` + rótulo "em breve" no mesmo passo; submit de cartão não cria contribuição.
- **Risco: dessincronização com SPEC-FIRESTORE-SECURITY** (writer manda `pending` mas rules ainda aceitam `completed`, ou rules endurecem antes e quebram outro writer). Mitigação: tratar a ordem como dependência explícita (§9); validar no e2e que o write `pending` passa nas rules vigentes.
- **Risco: regressão na tela de sucesso do RSVP** ao remover o card (quebra de layout do grid de status cards). Mitigação: remover só o segundo card (`l.123-126`), preservar o primeiro e o espaçamento `space-y-4`; validar visualmente no e2e.
- **Risco: contribuições `pending` órfãs acumulando** sem nunca virar `completed` (até a SPEC-PAYMENTS-MP). Mitigação: aceito conscientemente — é a verdade honesta do estado "intenção registrada, pagamento não processado"; SPEC-PAYMENTS-MP fará a promoção via webhook. Opcional: nota administrativa de que `pending` antigos são intenções não pagas.

## 11. Metas auditáveis (Definition of Done verificável por LLM)
> Objetivos quantitativos. Cada meta tem um método de auditoria executável e um alvo binário (PASS/FAIL). Uma LLM executora deve rodar a auditoria e reportar o resultado sem julgamento subjetivo. **SPEC entregue ⇔ todas as metas não-[humano] = PASS.** Os comandos assumem a raiz do repositório como diretório de trabalho.

| # | Meta (objetivo) | Como auditar (comando / checagem) | Alvo (PASS) |
|---|---|---|---|
| M-1 | Cliente não grava status fora de `'pending'` (RT-1, aceite §7.1) | `rg -n "status:\s*'(completed\|processing\|failed)'" app/presentes/checkout/page.tsx` | 0 ocorrências |
| M-2 | Writer de `contributions` grava `'pending'` (RT-1) | `rg -n "status:\s*'pending'" app/presentes/checkout/page.tsx` | >=1 ocorrência |
| M-3 | Simulação de processamento removida (RT-2, aceite §7.3) | `rg -n "setTimeout\(\s*resolve\s*,\s*1500" app/presentes/checkout/page.tsx` (ou `rg -n "setTimeout" app/presentes/checkout/page.tsx`) | 0 ocorrências |
| M-4 | Copy de sucesso não afirma pagamento confirmado (RT-3, aceite §7.2/§7.10) | `rg -ni "confirmada com sucesso\|pagamento confirmado" app/presentes/checkout/page.tsx` | 0 ocorrências |
| M-5 | Copy honesta de intenção pendente presente (RT-3) | `rg -n "Recebemos sua intenção de presente" app/presentes/checkout/page.tsx` | >=1 ocorrência |
| M-6 | Botão Pix não afirma "já paguei" (RT-4, aceite §7.4) | `rg -n "Já realizei o pagamento" app/presentes/checkout/page.tsx` | 0 ocorrências |
| M-7 | Bloco Pix sinaliza placeholder/simulado (RT-4) | `rg -ni "modo simulado\|em breve\|placeholder" app/presentes/checkout/page.tsx` | >=1 ocorrência |
| M-8 | Inputs de cartão sem `required` órfão e desabilitados (RT-5, aceite §7.5) | `rg -n "id=\"cc-(number\|name\|exp\|csc)\"" app/presentes/checkout/page.tsx` e inspecionar cada match — nenhum contém `required`; cada um contém `disabled` | nenhum input `cc-*` com `required`; todos com `disabled` |
| M-9 | Card fake de presente removido de /presenca (RT-6, aceite §7.6) | `rg -ni "Cotas de Lua de Mel\|Contribuição de Presente" app/presenca/page.tsx` | 0 ocorrências |
| M-10 | Card real "Status da Confirmação" preservado em /presenca (RT-6) | `rg -n "Status da Confirmação" app/presenca/page.tsx` | >=1 ocorrência |
| M-11 | Nenhuma menção a provedor != Mercado Pago na UI do checkout (RT-7, aceite §7.7) | `rg -ni "PagSeguro\|PayPal\|Stripe\|PagBank" app/presentes/checkout/page.tsx` | 0 ocorrências |
| M-12 | ADR-0001 atualizado (RT-8, aceite §7.8) | `rg -ni "PagSeguro" docs/adr/0001-fluxos-checkout-separados.md` retorna 0 **e** `rg -ni "Mercado Pago" docs/adr/0001-fluxos-checkout-separados.md` retorna >=1 | PagSeguro=0 e Mercado Pago>=1 |
| M-13 | Tipo `Contribution` exportado e tipado (RT-9, aceite §7.9 — se aplicado) | `rg -n "export (interface\|type) Contribution\b\|export type ContributionStatus" domain/types/index.ts` | >=1 (ou marcar N/A se RT-9 não aplicado) |
| M-14 | Build/lint sem novos erros (aceite §7.11, RT-10) | `npm run build` | exit code 0 |
| M-15 | [humano] Status `'pending'` real no documento criado (validação e2e §8, RT-1) | Criar contribuição via `/presentes/checkout?amount=10,00&item=Teste` e inspecionar o doc em `contributions` no Firebase Console/emulador | doc gravado com `status: 'pending'` |
| M-16 | [humano] Auditoria visual de honestidade (aceite §7.12, RT-3/RT-4/RT-5) | Abrir checkout e /presenca: nenhuma tela afirma pagamento ou presente que não aconteceu; cartão visualmente "em breve"; Pix em modo simulado | confirmação visual humana |
