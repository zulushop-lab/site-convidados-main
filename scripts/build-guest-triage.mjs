#!/usr/bin/env node

/**
 * Builds a review-first guest triage CSV from the Obsidian wedding guest note.
 *
 * This intentionally does not produce the final seed CSV. The source note is a
 * human list, not yet a reliable RSVP model. The output makes grouping, phone
 * ownership, children, possible couples, and duplicates explicit for review.
 *
 * Usage:
 *   node scripts/build-guest-triage.mjs [source.md] [outDir]
 */

import fs from "node:fs";
import path from "node:path";

const [, , sourceArg, outDirArg] = process.argv;

const sourceFile =
  sourceArg ||
  "C:\\Users\\CARRE\\Desktop\\Obsidian Files\\Projetos\\Casamento\\Lista de convidados.md";
const outDir = outDirArg || path.join("output", "convites");

function stripInvisible(text) {
  return String(text)
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return stripInvisible(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function delimitedEscape(value, delimiter) {
  const raw = String(value ?? "");
  const needsQuotes = raw.includes(delimiter) || /["\r\n]/.test(raw);
  return needsQuotes ? `"${raw.replaceAll('"', '""')}"` : raw;
}

function toDelimited(rows, columns, delimiter) {
  return [
    columns.join(delimiter),
    ...rows.map((row) =>
      columns.map((column) => delimitedEscape(row[column], delimiter)).join(delimiter)
    ),
  ].join("\n") + "\n";
}

function timestampSuffix() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function writeTextFile(file, content) {
  try {
    fs.writeFileSync(file, content, "utf8");
    return file;
  } catch (err) {
    if (err?.code !== "EBUSY") throw err;

    const parsed = path.parse(file);
    const alternate = path.join(parsed.dir, `${parsed.name}-${timestampSuffix()}${parsed.ext}`);
    fs.writeFileSync(alternate, content, "utf8");
    console.warn(`Arquivo em uso, criada copia: ${alternate}`);
    return alternate;
  }
}

function titleCaseFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

if (!fs.existsSync(sourceFile)) {
  console.error(`Arquivo nao encontrado: ${sourceFile}`);
  process.exit(1);
}

const text = fs.readFileSync(sourceFile, "utf8").replace(/\r\n?/g, "\n");
const rows = [];
let currentSection = "";
const sectionCounts = new Map();

for (const [index, line] of text.split("\n").entries()) {
  const sectionMatch = line.match(/^(\d+)\.\s+(.+?)\s*$/);
  if (sectionMatch && !/^\s/.test(line)) {
    currentSection = stripInvisible(sectionMatch[2]).replace(/:$/, "");
    sectionCounts.set(currentSection, 0);
    continue;
  }

  const guestMatch = line.match(/^\s+\d+\.\s+(.+?)\s*$/);
  if (!guestMatch || !currentSection) continue;

  const originalName = stripInvisible(guestMatch[1]);
  if (!originalName) continue;

  sectionCounts.set(currentSection, (sectionCounts.get(currentSection) || 0) + 1);

  const baseSlug = slugify(originalName) || `convidado-${rows.length + 1}`;
  const origem = currentSection.toUpperCase();
  const isChildSection = origem.includes("CRIAN");
  const looksLikeCouple = /\s+e\s+/i.test(originalName);
  const isExtra = origem.includes("LISTA EXTRA");

  const reviewFlags = [];
  if (!originalName.includes(" ")) reviewFlags.push("nome_curto_revisar");
  if (looksLikeCouple) reviewFlags.push("possivel_casal_ou_grupo");
  if (isChildSection) reviewFlags.push("vincular_crianca_a_responsavel");
  if (isExtra) reviewFlags.push("lista_extra_confirmar_convite");

  rows.push({
    origem,
    linha_origem: index + 1,
    nome_original: originalName,
    nome_convidado: originalName,
    id_familia_sugerido: baseSlug,
    nome_familia_sugerido: looksLikeCouple
      ? originalName
      : `Familia ${titleCaseFromSlug(baseSlug)}`,
    telefone_whatsapp: "",
    e_crianca: isChildSection ? "sim" : "nao",
    e_responsavel_familia: isChildSection ? "nao" : "sim",
    status_revisao: reviewFlags.length ? reviewFlags.join(";") : "revisar_grupo_e_telefone",
    observacoes: "",
  });
}

const seen = new Map();
for (const row of rows) {
  const key = slugify(row.nome_convidado);
  const prior = seen.get(key);
  if (prior) {
    row.status_revisao += ";possivel_duplicado";
    prior.status_revisao += prior.status_revisao.includes("possivel_duplicado")
      ? ""
      : ";possivel_duplicado";
  } else {
    seen.set(key, row);
  }
}

const columns = [
  "origem",
  "linha_origem",
  "nome_original",
  "nome_convidado",
  "id_familia_sugerido",
  "nome_familia_sugerido",
  "telefone_whatsapp",
  "e_crianca",
  "e_responsavel_familia",
  "status_revisao",
  "observacoes",
];

fs.mkdirSync(outDir, { recursive: true });

let csvFile = path.join(outDir, "convidados-triagem.csv");
let excelCsvFile = path.join(outDir, "convidados-triagem-excel.csv");
let reviewFile = path.join(outDir, "convidados-triagem-resumo.md");

csvFile = writeTextFile(csvFile, toDelimited(rows, columns, ","));
excelCsvFile = writeTextFile(excelCsvFile, `\uFEFFsep=;\n${toDelimited(rows, columns, ";")}`);

const riskyRows = rows.filter((row) =>
  /possivel_casal|duplicado|crianca|lista_extra|nome_curto/i.test(row.status_revisao)
);

const summary = [
  "# Triagem de convidados",
  "",
  `Fonte: ${sourceFile}`,
  `CSV: ${csvFile}`,
  `CSV Excel: ${excelCsvFile}`,
  "",
  "## Contagem por origem",
  "",
  ...[...sectionCounts.entries()].map(([section, count]) => `- ${section}: ${count}`),
  "",
  `Total de linhas de convite em triagem: ${rows.length}`,
  `Linhas que exigem decisao humana: ${riskyRows.length}`,
  "",
  "## Campos que ainda bloqueiam o seed final",
  "",
  "- `telefone_whatsapp`: obrigatorio no CSV final do seed.",
  "- `id_familia_sugerido`: precisa ser revisado para agrupar quem confirma junto.",
  "- `e_responsavel_familia`: deve ter exatamente um responsavel por familia.",
  "- `e_crianca`: criancas precisam ser vinculadas ao grupo/responsavel correto.",
  "",
  "## Sinais de risco",
  "",
  "- `possivel_casal_ou_grupo`: provavelmente precisa virar duas pessoas no mesmo grupo.",
  "- `possivel_duplicado`: conferir antes de enviar convite.",
  "- `lista_extra_confirmar_convite`: decidir se entra na lista oficial.",
  "- `nome_curto_revisar`: nome curto demais para identificacao segura.",
  "",
].join("\n");

reviewFile = writeTextFile(reviewFile, summary);

console.log(`Triagem gerada: ${csvFile}`);
console.log(`Triagem Excel:  ${excelCsvFile}`);
console.log(`Resumo gerado:  ${reviewFile}`);
console.log(`Total: ${rows.length} linha(s)`);
for (const [section, count] of sectionCounts.entries()) {
  console.log(`- ${section}: ${count}`);
}
