# SPEC-GIFTS-CATALOG — Catálogo real de presentes + seed admin

> Status: ✅ implementado vs. realidade (16/06 — cliente só lê `GIFT_CATALOG` de `domain/gifts/catalog.ts`; `scripts/seed-gifts.mjs` existe). ⚠️ Esta spec foi escrita contra um código ANTIGO (descreve `DEFAULT_GIFTS`+`setDoc` no cliente que não existem mais); ler como histórico. Resta: humano preencher planilha + rodar seed · Fase original: 2a · Track: A · Depende de: SPEC-FIRESTORE-SECURITY · Destrava: SPEC-CHECKOUT-HONESTY, SPEC-PAYMENTS-MP

## 1. Objetivo
Transformar a lista de presentes de um catálogo fake hardcoded no cliente (com seed destrutivo) em um catálogo real, mantido por um script admin a partir de uma planilha de presentes reais (descrição, foto, preço, categoria, cotas). O cliente passa a SÓ LER a coleção `gifts`; a escrita fica exclusiva do admin (via Firebase Admin SDK), casando com as rules endurecidas em SPEC-FIRESTORE-SECURITY. Esta spec também conserta o spinner que pode travar e remove a re-semeadura por divergência de contagem. Decisão travada do usuário: PRIMEIRO o catálogo real com categorias, DEPOIS o Mercado Pago.

## 2. Contexto atual (verificado em código)
- `app/presentes/page.tsx:457` — `useState(true)` para `isLoading`; o spinner inicia ligado e só é desligado em alguns ramos.
- `app/presentes/page.tsx:476` — re-semeadura disparada por `querySnapshot.empty || querySnapshot.size !== DEFAULT_GIFTS.length` (re-semeia toda vez que a contagem no banco difere dos 37 itens locais).
- `app/presentes/page.tsx:478-486` — `seedGifts()` faz `setDoc` destrutivo (l.480 sobrescreve cada doc por id) e chama `fetchGifts()` recursivamente (l.483); o ramo que entra no seed faz `return` (l.486) SEM chamar `setIsLoading(false)` → se o re-fetch recursivo falhar/repetir o gate, o spinner trava ligado.
- `app/presentes/page.tsx:494` e `app/presentes/page.tsx:496` — `setIsLoading(false)` só nos ramos de sucesso (dados consistentes) e de erro (catch); ausente no ramo de seed.
- `app/presentes/page.tsx:32-443` — `DEFAULT_GIFTS` (37 itens) embutido no bundle do cliente como fonte de dados + fallback.
- `app/presentes/page.tsx:9-10` — cliente importa `setDoc, doc` (escrita) de `firebase/firestore`; deveria importar só leitura.
- `app/presentes/page.tsx:17` — tipo local `GiftCategory = 'Todas' | 'Primeiros Passos' | 'Lua de Mel' | 'Casa'` (duplicado no client, não vem de `domain/types`).
- `app/presentes/page.tsx:20-30` — `interface Gift` LOCAL (campos `title`, `category`, `price`, `preco_total`, `cotas_disponiveis`, `valor_cota`, `description`, `imageSrc`) — divergente do contrato em `domain/types`.
- `domain/types/index.ts:19-26` — `interface Gift` ÓRFÃ (não importada em lugar nenhum) com shape mínimo: `id, title, description, price, imageUrl, purchased`. NÃO tem `category`, `cotas_disponiveis`, `valor_cota`, `preco_total`. É o contrato a evoluir.
- `firestore.rules:36-47` — `isValidGift` exige `title is string (<=200)`, `price is number (>=0)`, `category is string`, `isBought` opcional bool; `read/list` liberados (`if true`); `write: if isAdmin() && isValidGift(...)`. Ou seja, o seed client-side já é INCOMPATÍVEL com as rules (write é admin-only) — hoje só "funciona" porque cai no fallback do catch quando o write é negado.
- `app/presentes/checkout/page.tsx:13-14` — checkout lê `amount` e `item` da query string (`?amount=...&item=...`), montados em `app/presentes/page.tsx:697,955` a partir de `valor_cota` e `title`. O contrato de navegação catálogo→checkout depende desses campos.
- `lib/firebase.ts:7` — `getFirestore(app)` (banco default); ignora `firestoreDatabaseId` do `firebase-applet-config.json:6`. Relevante para o seed admin apontar ao banco certo (ver Tarefas humanas).
- `package.json:5-10` — não existe diretório `scripts/` nem dependência `firebase-admin`; nenhum script `seed:*` definido.
- `docs/engineering-backlog-plan.md:46,61` — backlog já prevê: parar seeding client-side de `gifts` (FASE 1, item 5) e consertar seed destrutivo/spinner travado (FASE 2).

## 3. Escopo
**Inclui:**
- Estender o tipo `Gift` em `domain/types/index.ts` (contrato único) com categoria e os campos de cota/preço reais.
- Definir um `enum`/tipo de categoria centralizado em `domain/types` e consumi-lo no cliente.
- Refatorar `app/presentes/page.tsx` para SÓ LER `gifts` (via `onSnapshot` ou `getDocs`), sem nenhum `setDoc`/`doc`/import de escrita.
- Remover a re-semeadura por divergência de contagem e o `seedGifts()` recursivo.
- Consertar o spinner: garantir `setIsLoading(false)` em TODOS os ramos (sucesso, vazio, erro), sem recursão órfã.
- Manter agrupamento/filtro por categoria na UI (categorias derivadas do contrato).
- Criar script admin `seed:gifts` (Firebase Admin SDK) que lê uma planilha/JSON de presentes reais e grava `gifts` respeitando rules admin-only.
- Artefato "Modelo de Planilha de Presentes" (colunas exatas) + tarefa humana de preenchimento.

**Não inclui:**
- Mercado Pago / pagamento (SPEC-PAYMENTS-MP) — é a ÚLTIMA do track.
- Honestidade da tela de checkout/sucesso e status `pending` (SPEC-CHECKOUT-HONESTY).
- Endurecimento das rules de `gifts` (já entregue por SPEC-FIRESTORE-SECURITY; esta spec apenas casa com elas).
- Decisão final sobre banco nomeado vs default (preflight herdado; ver Tarefas humanas).
- Upload/hospedagem de imagens (esta spec assume URLs de imagem fornecidas na planilha).
- Reserva/decremento de cotas em tempo real e qualquer lógica transacional de compra.

## 4. Requisitos técnicos
- **RT-1 — Evoluir o contrato `Gift`.** Em `domain/types/index.ts`, estender `interface Gift` para o shape real, mantendo retrocompatibilidade com a UI atual:
  - `id: string`
  - `title: string`
  - `description: string`
  - `category: GiftCategory` (novo; ver RT-2)
  - `imageUrl: string` (renomear o uso ou mapear para `imageSrc` no cliente; ver RT-7)
  - `preco_total: number` (preço cheio do item)
  - `cotas_disponiveis: number` (quantidade de cotas)
  - `valor_cota: number` (valor de cada cota)
  - `price: number` (mantido = `valor_cota`, usado em `orderBy('price','asc')` em `app/presentes/page.tsx:473` e nos filtros de faixa de preço)
  - `isBought?: boolean` (opcional, alinhado a `isValidGift` em `firestore.rules:40`; substitui o `purchased` órfão atual)
  Remover/substituir o `purchased: boolean` antigo de `domain/types/index.ts:25` por `isBought?`.
- **RT-2 — Tipo de categoria centralizado.** Em `domain/types/index.ts`, exportar `type GiftCategory = 'Primeiros Passos' | 'Lua de Mel' | 'Casa'` (categorias de DADOS, sem o pseudo-valor de UI `'Todas'`). O cliente compõe a lista de filtros como `['Todas', ...GiftCategory]`. Eliminar a definição duplicada de `app/presentes/page.tsx:17`.
- **RT-3 — Cliente só lê.** Em `app/presentes/page.tsx`, remover de `firebase/firestore` os imports de escrita `setDoc` e `doc` (l.9), mantendo só `collection, getDocs, query, orderBy` (ou trocar para `onSnapshot` para reatividade). Nenhum caminho de código no cliente pode escrever em `gifts`.
- **RT-4 — Remover re-semeadura por contagem.** Excluir a condição `querySnapshot.empty || querySnapshot.size !== DEFAULT_GIFTS.length` (l.476) e todo o bloco `seedGifts()` (l.478-486). Catálogo vazio NÃO dispara seed; é tratado como estado de UI (ver RT-6).
- **RT-5 — Consertar o spinner.** Garantir `setIsLoading(false)` em todos os ramos do `fetchGifts`: sucesso com dados, sucesso vazio, e `catch`. Forma recomendada: `try { ... ; setGifts(data) } catch { ... } finally { setIsLoading(false) }`. Eliminar o `return` que pulava o reset (l.486) e a recursão `fetchGifts()` interna (l.483).
- **RT-6 — Estado de catálogo vazio.** Quando `gifts` vier vazio do banco (sem seed feito ainda), exibir um estado vazio honesto ("Lista em preparação" / placeholder) em vez de cair em dados fake. `DEFAULT_GIFTS` deixa de ser fonte de dados; pode ser removido do cliente OU mantido apenas como semente local do JSON do script admin (NUNCA escrito pelo cliente). Decisão preferida: mover os dados para `scripts/seed/gifts.example.json` e remover o array gigante do `page.tsx`.
- **RT-7 — Mapear `imageUrl`↔`imageSrc`.** A UI usa `gift.imageSrc` (`app/presentes/page.tsx:657,908`). Padronizar o campo persistido como `imageUrl` (alinhado ao contrato e a `isValidGift`). No cliente, mapear `imageSrc = doc.imageUrl` na leitura, ou renomear os usos de `imageSrc` para `imageUrl`. Escolher uma das duas e documentar; não manter ambos divergentes.
- **RT-8 — Manter contrato de navegação para o checkout.** Os links catálogo→checkout (`app/presentes/page.tsx:697,955`) devem continuar montando `?amount=<valor_cota formatado>&item=<title encodado>`. Esta spec não altera o checkout; só garante que os campos `valor_cota` e `title` continuem presentes no novo shape lido do banco.
- **RT-9 — Script admin `seed:gifts`.** Criar `scripts/seed-gifts.ts` (ou `.mjs`) que:
  - inicializa o Firebase Admin SDK via service account (`GOOGLE_APPLICATION_CREDENTIALS` ou JSON local fora do versionamento);
  - aponta para o MESMO banco que o app usa em runtime (default vs nomeado — ver Tarefas humanas / preflight);
  - lê a fonte de presentes reais de `scripts/seed/gifts.json` (gerado a partir da planilha) ou de um CSV convertido;
  - valida cada linha contra o contrato `Gift` (campos obrigatórios, números >= 0, categoria pertencente a `GiftCategory`) antes de gravar;
  - grava em `gifts` por `id` estável (slug derivado do título OU id da planilha), de forma idempotente (upsert por `set(..., { merge:true })`), sem apagar a coleção inteira por padrão;
  - suporta flags: `--dry-run` (só valida e imprime o diff, não grava) e `--prune` (opcional/explícito, remove docs ausentes da planilha) — `--prune` NUNCA é default.
- **RT-10 — Registrar o script no `package.json`.** Adicionar `"seed:gifts": "tsx scripts/seed-gifts.ts"` (ou `node` + loader) em `scripts`, e `firebase-admin` (+ `tsx`/`ts-node` se necessário) em `devDependencies`. O script roda LOCAL, nunca no bundle do app.
- **RT-11 — Validação local de shape.** O script deve falhar com mensagem clara se a planilha tiver coluna faltando, número inválido, categoria fora do enum, ou URL de imagem vazia — antes de qualquer write. Saída resumida: N criados / N atualizados / N inalterados / N inválidos.
- **RT-12 — Compatibilidade com as rules.** O documento gravado pelo script deve satisfazer `isValidGift` (`firestore.rules:36-41`): `title` string ≤200, `price` number ≥0, `category` string, `isBought` ausente ou bool. Se SPEC-FIRESTORE-SECURITY tiver endurecido `isValidGift` com `keys().hasOnly([...])`, o script grava EXATAMENTE o conjunto de campos permitido (sem extras).

## 5. Modelo de dados / contratos

**Contrato `Gift` (após RT-1/RT-2) em `domain/types/index.ts`:**
```ts
export type GiftCategory = 'Primeiros Passos' | 'Lua de Mel' | 'Casa';

export interface Gift {
  id: string;
  title: string;            // <= 200 chars (casar com isValidGift)
  description: string;
  category: GiftCategory;
  imageUrl: string;         // URL pública da foto
  preco_total: number;      // preço cheio do item, >= 0
  cotas_disponiveis: number;// número de cotas, inteiro > 0
  valor_cota: number;       // valor de cada cota, >= 0
  price: number;            // = valor_cota (ordenação/filtros do cliente)
  isBought?: boolean;       // default ausente; só admin altera
}
```

**Coleção Firestore `gifts/{giftId}`:** documento = shape de `Gift` acima (campos persistidos). `read`/`list` públicos; `write` admin-only (`firestore.rules:43-47`). `giftId` = id estável (slug/planilha), legível e idempotente.

**Contrato de navegação catálogo → checkout (inalterado):**
`/presentes/checkout?amount=<valor_cota com vírgula>&item=<encodeURIComponent(title)>` (montado em `app/presentes/page.tsx:697,955`; lido em `app/presentes/checkout/page.tsx:13-14`).

**Fonte do seed (`scripts/seed/gifts.json`), 1 objeto por presente:**
```json
{
  "id": "cs_15_geladeira",
  "title": "Geladeira Frost Free Inox",
  "description": "O eletrodoméstico mais importante da cozinha.",
  "category": "Casa",
  "imageUrl": "https://.../foto.jpg",
  "preco_total": 4299.00,
  "cotas_disponiveis": 40,
  "valor_cota": 107.47,
  "price": 107.47
}
```
(`isBought` omitido no seed; o script não o grava se a rule usar `hasOnly`.)

## 6. Arquivos afetados
- **Editar** `domain/types/index.ts` — RT-1 (estender `Gift`), RT-2 (exportar `GiftCategory`), remover `purchased`/`imageUrl` órfãos divergentes.
- **Editar** `app/presentes/page.tsx` — RT-3 (só leitura), RT-4 (remover seed), RT-5 (spinner em `finally`), RT-6 (estado vazio + remover/mover `DEFAULT_GIFTS`), RT-7 (`imageUrl`↔`imageSrc`), RT-8 (manter query do checkout), importar `Gift`/`GiftCategory` do contrato.
- **Criar** `scripts/seed-gifts.ts` — RT-9, RT-11, RT-12 (script admin idempotente).
- **Criar** `scripts/seed/gifts.example.json` — exemplo/template do JSON de entrada (pode receber os 37 itens migrados do `DEFAULT_GIFTS`).
- **Criar** `scripts/seed/gifts.json` — fonte real (gerada da planilha pelo usuário; deve entrar no `.gitignore` se contiver dados sensíveis ou ser versionada se pública — decidir).
- **Editar** `package.json` — RT-10 (`scripts.seed:gifts`, `devDependencies.firebase-admin` + loader TS).
- **Editar** `.gitignore` — ignorar a service account JSON do Admin SDK (e, se aplicável, `scripts/seed/gifts.json`).
- **(Documento)** `docs/specs/SPEC-GIFTS-CATALOG.md` — esta spec.

## 7. Critérios de aceite
- [ ] `domain/types/index.ts` exporta `GiftCategory` e o `Gift` estendido; o cliente importa esses tipos (sem `interface Gift` local em `page.tsx`).
- [ ] `app/presentes/page.tsx` não contém `setDoc`, `doc` (escrita), nem `seedGifts`; nenhum caminho escreve em `gifts`.
- [ ] Não há mais re-semeadura por divergência de contagem; abrir `/presentes` com a coleção populada NÃO dispara writes (verificável: zero writes em `gifts` na aba Network/Firestore ao carregar).
- [ ] O spinner SEMPRE termina: com dados, sem dados (estado vazio honesto) e em erro — `isLoading` vira `false` em todos os ramos.
- [ ] Catálogo vazio mostra estado "em preparação", não dados fake.
- [ ] Categorias e filtros continuam funcionando, alimentados por dados reais do banco.
- [ ] `npm run seed:gifts -- --dry-run` valida a planilha e imprime o diff sem gravar; `npm run seed:gifts` grava/atualiza `gifts` de forma idempotente (rodar 2x não gera mudanças na 2ª execução).
- [ ] Documentos gravados pelo script passam em `isValidGift` (rules) — write como admin tem sucesso; write anônimo continua negado.
- [ ] Catálogo→checkout: clicar "Contribuir com 1 Cota" leva a `/presentes/checkout?amount=...&item=...` com os valores corretos do item real.
- [ ] `npm run build` passa sem erros de tipo.
- [ ] Artefato "Modelo de Planilha de Presentes" documentado (colunas exatas) e referenciado como tarefa humana.

## 8. Validação e2e (e2e-validation-gate)
Pipeline crítico: **planilha → `scripts/seed/gifts.json` → `seed:gifts` (Admin SDK) → coleção `gifts` → `onSnapshot/getDocs` em `/presentes` → UI (cards/filtros) → query do checkout**.
1. **Baseline:** com a coleção populada via `seed:gifts`, abrir `/presentes`; capturar contagem de cards por categoria, ausência de writes no carregamento, spinner desligando, e um link de checkout gerado.
2. **Mudança idempotente:** rodar `npm run seed:gifts` novamente com a MESMA planilha → resultado deve ser "0 criados / 0 atualizados / N inalterados" (idempotência). Em seguida, alterar `valor_cota` de UM item na planilha e rodar de novo → "0 criados / 1 atualizado".
3. **Validar propagação por camada:** (a) doc no Firestore reflete o novo `valor_cota`; (b) `/presentes` mostra o novo valor no card e no modal sem reload manual (se `onSnapshot`) ou após refresh (se `getDocs`); (c) o link do checkout do item carrega o novo `amount`.
4. **Reverter:** restaurar o `valor_cota` original na planilha e rodar `seed:gifts` → "1 atualizado" de volta ao valor inicial.
5. **Revalidar:** `/presentes` volta ao baseline; spinner ok em catálogo populado E em catálogo vazio (testar apontando a uma coleção vazia / `--dry-run`); confirmar que convidado anônimo NÃO consegue escrever em `gifts` (tentativa via console/regra retorna permission-denied).
Cobertura mínima adicional: `npm run build` verde.

## 9. Tarefas humanas / dependências externas
- **Preencher o "Modelo de Planilha de Presentes"** (artefato abaixo) com os presentes reais e exportar para `scripts/seed/gifts.json` (ou CSV convertido pelo script). Sem isso, o catálogo fica vazio (estado honesto), não fake.

  **Modelo de Planilha de Presentes — colunas exatas:**

  | Coluna | Obrigatória | Tipo | Regra/observação |
  |---|---|---|---|
  | `nome` | sim | texto (≤200) | vira `title` |
  | `descricao` | sim | texto | vira `description` |
  | `foto_url` | sim | URL | vira `imageUrl`; URL pública acessível |
  | `categoria` | sim | enum | um de: `Primeiros Passos`, `Lua de Mel`, `Casa` |
  | `preco_total` | sim | número ≥ 0 | preço cheio do item |
  | `cotas` | sim | inteiro > 0 | vira `cotas_disponiveis` |
  | `valor_cota` | sim | número ≥ 0 | vira `valor_cota` e `price`; idealmente ≈ `preco_total / cotas` |
  | `id` | opcional | texto slug | se vazio, o script gera slug do `nome` |

- **Service account do Firebase Admin SDK:** gerar/baixar a chave (Console → Configurações do projeto → Contas de serviço), salvar fora do repo e expor via `GOOGLE_APPLICATION_CREDENTIALS`. Adicionar o arquivo ao `.gitignore`.
- **PREFLIGHT — banco default vs nomeado:** confirmar no Firebase Console qual banco tem `gifts`/regras provisionadas. `lib/firebase.ts:7` usa `getFirestore(app)` (default) e ignora `firestoreDatabaseId` (`firebase-applet-config.json:6`). O `seed:gifts` DEVE apontar para o MESMO banco que o app lê — passar `databaseId` no Admin SDK apenas se o app de fato usar o banco nomeado. Não alterar às cegas.
- **Decisão de versionamento de `scripts/seed/gifts.json`:** definir se os dados de presentes são públicos (podem ser versionados) ou ficam fora do git.

## 10. Riscos e mitigação
- **Seed destrutivo recorrente (estado atual):** `setDoc` sobrescreve e o re-seed por contagem re-semeia (`app/presentes/page.tsx:476-480`). Mitigação: remover o seed do cliente (RT-3/RT-4) e usar `set(..., { merge:true })` idempotente no script (RT-9); `--prune` nunca default.
- **Spinner travado:** ramo de seed faz `return` sem reset (`app/presentes/page.tsx:486`). Mitigação: `finally { setIsLoading(false) }` (RT-5) + remoção da recursão.
- **Script grava no banco errado:** `getFirestore(app)` default vs `firestoreDatabaseId` nomeado. Mitigação: preflight obrigatório no console antes de rodar o seed; o script imprime o `databaseId`/projectId alvo no início e exige `--dry-run` primeiro.
- **Incompatibilidade com `isValidGift`:** se a rule usar `keys().hasOnly([...])`, campos extras quebram o write. Mitigação: RT-12 — o script grava só o conjunto permitido e valida shape antes (RT-11); rodar contra rules reais no e2e gate.
- **Drift de contrato (UI usa `imageSrc`, contrato usa `imageUrl`):** Mitigação: RT-7 padroniza um único campo; `domain/types` é a fonte da verdade e o cliente importa de lá.
- **Quebra do link de checkout:** se o novo shape perder `valor_cota`/`title`, os links de `app/presentes/page.tsx:697,955` quebram. Mitigação: RT-8 mantém ambos no contrato; coberto pelo e2e (passo 3c).
- **Catálogo vazio percebido como bug:** ao parar o seed automático, o app pode parecer "sem presentes" até rodar `seed:gifts`. Mitigação: estado vazio honesto (RT-6) + tarefa humana de preencher a planilha e rodar o seed.

## 11. Metas auditáveis (Definition of Done verificável por LLM)
> Objetivos quantitativos. Cada meta tem um método de auditoria executável e um alvo binário (PASS/FAIL). Uma LLM executora deve rodar a auditoria e reportar o resultado sem julgamento subjetivo. **SPEC entregue ⇔ todas as metas não-[humano] = PASS.** Os comandos assumem a raiz do repositório como diretório de trabalho.

| # | Meta (objetivo) | Como auditar (comando / checagem) | Alvo (PASS) |
|---|---|---|---|
| M-1 | Contrato `GiftCategory` exportado e sem `'Todas'` nos dados (RT-2) | `rg -n "export type GiftCategory" domain/types/index.ts` e `rg -n "'Todas'" domain/types/index.ts` | 1ª ≥1 linha E 2ª = 0 linhas |
| M-2 | Contrato `Gift` estendido com os campos reais; sem `purchased` órfão (RT-1) | `rg -n "category|preco_total|cotas_disponiveis|valor_cota|isBought" domain/types/index.ts` e `rg -n "purchased" domain/types/index.ts` | 1ª ≥5 ocorrências (os 5 campos) E 2ª = 0 linhas |
| M-3 | Cliente não importa nem usa escrita do Firestore (RT-3, aceite) | `rg -n "setDoc|seedGifts" app/presentes/page.tsx` | 0 ocorrências |
| M-4 | Sem `interface Gift`/`type GiftCategory` local no cliente; tipos vêm do contrato (RT-2, aceite) | `rg -n "interface Gift|type GiftCategory" app/presentes/page.tsx` e `rg -n "from .*domain/types" app/presentes/page.tsx` | 1ª = 0 linhas E 2ª ≥1 linha |
| M-5 | Re-semeadura por divergência de contagem removida (RT-4, aceite) | `rg -n "DEFAULT_GIFTS.length\|querySnapshot.size !==" app/presentes/page.tsx` | 0 ocorrências |
| M-6 | `DEFAULT_GIFTS` não é mais fonte de dados no cliente; movido para o seed (RT-6) | `rg -n "DEFAULT_GIFTS" app/presentes/page.tsx` (alvo) e existência de `scripts/seed/gifts.example.json` | 1ª = 0 ocorrências E arquivo de seed existe |
| M-7 | Spinner sempre desliga: `setIsLoading(false)` no `finally`, sem `return`/recursão órfãos (RT-5, aceite) | `rg -n "finally" app/presentes/page.tsx` (presente no `fetchGifts`) e `rg -n "setIsLoading\(false\)" app/presentes/page.tsx` | `finally` ≥1 E `setIsLoading(false)` ≥1, com o reset dentro do `finally` |
| M-8 | Contrato de navegação catálogo→checkout preservado (RT-8, aceite) | `rg -n "amount=" app/presentes/page.tsx` e `rg -n "encodeURIComponent" app/presentes/page.tsx` | ambas ≥1 ocorrência (links com `amount`/`item` mantidos) |
| M-9 | Script admin `seed:gifts` existe e é idempotente com flags exigidas (RT-9) | existência de `scripts/seed-gifts.ts` (ou `.mjs`) E `rg -n "\-\-dry-run\|--prune\|merge" scripts/seed-gifts.*` | arquivo existe E ≥3 ocorrências (dry-run, prune e merge presentes) |
| M-10 | `--prune` nunca é default no script (RT-9, risco) | inspeção: `rg -n "prune" scripts/seed-gifts.*` mostra `prune` ativado SOMENTE quando a flag é passada (default `false`) | nenhum caminho deleta sem `--prune` explícito |
| M-11 | Script registrado no `package.json` e `firebase-admin` em devDependencies (RT-10) | `rg -n "\"seed:gifts\"" package.json` e `rg -n "firebase-admin" package.json` | ambas ≥1 ocorrência |
| M-12 | Service account do Admin SDK ignorada pelo git (RT-9, Tarefas humanas) | `rg -n "serviceAccount\|GOOGLE_APPLICATION_CREDENTIALS\|\\.json" .gitignore` (entrada que cubra a chave) | ≥1 entrada ignorando a credencial JSON |
| M-13 | Build/types passam sem erro (aceite) | `npm run build` | exit code 0 |
| M-14 | [humano] Documento gravado pelo script passa em `isValidGift` e write anônimo é negado (RT-12, aceite, e2e passo 5) | teste `@firebase/rules-unit-testing` (ou tentativa no console): create admin de `gift` válido → `assertSucceeds`; create anônimo em `gifts` → `assertFails`/permission-denied | PASS = admin grava E anônimo é negado |
| M-15 | [humano] Catálogo vazio mostra estado "em preparação" e idempotência do seed visível (RT-6, aceite, e2e passos 2 e 5) | rodar `npm run seed:gifts` 2x (saída "0 criados / 0 atualizados / N inalterados") e abrir `/presentes` com coleção vazia | PASS = 2ª execução sem mudanças E estado vazio honesto exibido (sem dados fake) |
