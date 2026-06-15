# Modelos de Planilha — alimentação do banco (seed)

Estes dois CSVs são os **artefatos de entrada** dos scripts admin de seed do plano de engenharia
([engineering-plan-v2.md](../engineering-plan-v2.md)):

| Planilha | Alimenta | SPEC | Sprint |
|---|---|---|---|
| `planilha-convidados.csv` | `scripts/seed-families.ts` → coleções `families` / `guests` / `codes` | [SPEC-RSVP-AUTH](../specs/SPEC-RSVP-AUTH.md) | 3 |
| `planilha-presentes.csv` | `scripts/seed-gifts.ts` → coleção `gifts` | [SPEC-GIFTS-CATALOG](../specs/SPEC-GIFTS-CATALOG.md) | 2 |

> ⚠️ **Apague as linhas de exemplo antes de usar.** Toda linha cujo `id_familia` / `id` começa com
> `exemplo-` é só demonstração de formato — o script deve ignorá-las/você deve removê-las.

## Como preencher

- Abra em **Google Sheets** (recomendado — lida bem com vírgula) ou Excel. Ao terminar, exporte de volta
  como **CSV UTF-8** com **vírgula** como separador.
- Se abrir direto no **Excel em pt-BR** e tudo cair numa coluna só, use *Dados → Texto para Colunas →
  Delimitado → Vírgula* (o Excel pt-BR usa `;` por padrão).
- Não use vírgula dentro de um campo de texto sem aspas. Se precisar (ex.: descrição com vírgula),
  coloque o texto entre `"aspas duplas"`.
- `sim`/`nao` em letras minúsculas, sem acento, nos campos booleanos.

---

## `planilha-convidados.csv` — **uma linha por pessoa**

Cada integrante é uma linha. Os campos de família (`id_familia`, `nome_familia`, `telefone_whatsapp`)
**repetem igual** em todas as linhas da mesma família — é assim que o script agrupa e gera **um código por
família**.

| Coluna | Obrigatório | O que é |
|---|---|---|
| `id_familia` | sim | Identificador curto, estável e único da família (ex.: `silva`, `souza-prado`). **Repetir idêntico** em todas as linhas da família. Garante idempotência: re-rodar o seed **não regenera** o código de uma família já semeada (não invalida links já enviados). |
| `nome_familia` | sim | Nome exibido no site (ex.: "Família Silva"; para convidado solteiro, o próprio nome). Repetir nas linhas da família. |
| `telefone_whatsapp` | sim | Número no formato **E.164**: `+55` + DDD + número (ex.: `+5511999998888`). É para onde o link vai e entra na mensagem de WhatsApp gerada. Repetir nas linhas da família. |
| `nome_convidado` | sim | Nome da pessoa (1 por linha). Vira um `guest` com `guestId` próprio. |
| `e_crianca` | sim | `sim` ou `nao`. |
| `e_responsavel_familia` | opcional | `sim` para a pessoa que recebe/gerencia o link (1 por família). Default: a 1ª linha da família. |
| `email` | opcional | E-mail do convidado, se tiver. |
| `observacoes` | opcional | Notas para os noivos (restrição alimentar, acessibilidade, etc.). Não aparece para o convidado. |

**O que o script gera a partir disso:** para cada família, um `code` de alta entropia (8–10 chars,
inadivinhável), o link base `/rsvp/<code>`, os links individuais `/rsvp/<code>?c=<guestId>` e a **mensagem de
WhatsApp pronta** para você copiar e colar.

---

## `planilha-presentes.csv` — **uma linha por presente**

Modelo de **cotas**: um presente pode ser dividido em N cotas de mesmo valor. Presente indivisível =
`cotas = 1` e `valor_cota = preco_total`.

| Coluna | Obrigatório | O que é |
|---|---|---|
| `id` | opcional | Identificador estável do presente (ex.: `lua-de-mel`, `jogo-panelas`). Se vazio, derivado do `nome`. Garante idempotência do seed. |
| `nome` | sim | Nome do presente. |
| `descricao` | sim | Texto curto exibido no card. Use `"aspas"` se tiver vírgula. |
| `categoria` | sim | Agrupamento no catálogo (ex.: `Lua de Mel`, `Cozinha`, `Eletrodomésticos`, `Experiências`). Categorias iguais devem ser escritas **idênticas** (mesma grafia/acento). |
| `foto_url` | sim | Caminho de imagem em `/public` (ex.: `/imagem-1.jpg`) **ou** URL externa. URLs externas precisam estar liberadas em `next.config.ts` (`remotePatterns`). |
| `preco_total` | sim | Valor total do presente, em **reais** (ex.: `5000` ou `5000.00`). Use **ponto** como decimal, sem `R$` e sem separador de milhar. |
| `cotas` | sim | Número de cotas (`1` se indivisível). |
| `valor_cota` | opcional | Valor de cada cota em reais. Se vazio, o script calcula `preco_total ÷ cotas`. Se preenchido, deve bater. |
| `ordem` | opcional | Ordem de exibição no catálogo (inteiro; menor primeiro). |

> A unidade final gravada no banco (reais vs centavos) é definida na
> [SPEC-FIRESTORE-SECURITY](../specs/SPEC-FIRESTORE-SECURITY.md); a planilha sempre usa **reais**, e o
> script converte se necessário.

---

## Próximo passo

1. Preencher os dois CSVs (apagando as linhas `exemplo-`).
2. Salvar como CSV UTF-8 e disponibilizar para os scripts de seed (caminho definido em cada SPEC).
3. Antes de rodar qualquer seed: **PREFLIGHT do banco** (named vs default) no Firebase Console — ver
   [engineering-plan-v2.md](../engineering-plan-v2.md), seção *Tarefas humanas*.
