#!/usr/bin/env node

/**
 * seed-gifts — popula a colecao `gifts` a partir de uma planilha/JSON de
 * presentes reais, usando o Firebase Admin SDK (SPEC-GIFTS-CATALOG RT-9).
 *
 * O cliente SO LE `gifts` (write e admin-only nas rules); este script e o
 * unico caminho de escrita. Idempotente: usa set({ merge: true }) por id
 * estavel. Por seguranca, --dry-run e o DEFAULT — gravar exige --commit.
 *
 * Requer (instalar quando for usar de verdade — modo dry-run nao precisa do SDK):
 *   npm install firebase-admin
 *
 * Credencial (Admin SDK ignora rules; precisa de service account):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\caminho\\serviceAccount.json"
 *   # opcional, se o app usar banco nomeado (ver PREFLIGHT, decisao #11):
 *   $env:FIREBASE_DATABASE_ID = "ai-studio-remixmatheusisad-..."
 *
 * Fonte: CSV (docs/templates/planilha-presentes.csv, default) ou JSON (array).
 * Linhas de exemplo (id/nome comecando com "exemplo-") sao IGNORADAS.
 *
 * Uso:
 *   node scripts/seed-gifts.mjs                       # dry-run: valida + diff, NAO grava
 *   node scripts/seed-gifts.mjs --file scripts/seed/gifts.json
 *   node scripts/seed-gifts.mjs --commit              # grava (upsert merge)
 *   node scripts/seed-gifts.mjs --commit --prune      # remove docs ausentes da planilha
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const GIFT_CATEGORIES = ["Primeiros Passos", "Lua de Mel", "Casa"];

// --- args ---
const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const getOpt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const commit = hasFlag("--commit");
const prune = hasFlag("--prune");
const dryRun = !commit;
const file = getOpt("--file", "docs/templates/planilha-presentes.csv");

// Parser CSV minimo (campos entre aspas com virgula; sem multilinha).
function parseCsv(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length);
  if (!lines.length) return [];
  const splitLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        out.push(cur); cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

const isExampleRow = (raw) =>
  String(raw.id ?? "").startsWith("exemplo-") || String(raw.nome ?? raw.title ?? "").startsWith("exemplo-");

// --- slug helper (id estavel a partir do titulo) ---
const slugify = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

// --- validacao de uma linha contra o contrato Gift / isValidGift ---
function validateGift(raw, index) {
  const errors = [];
  const title = String(raw.title ?? raw.nome ?? "").trim();
  const description = String(raw.description ?? raw.descricao ?? "").trim();
  const category = String(raw.category ?? raw.categoria ?? "").trim();
  const imageUrl = String(raw.imageUrl ?? raw.foto_url ?? raw.imageSrc ?? "").trim();
  const price = Number(raw.price ?? raw.valor_cota);

  if (!title) errors.push("title/nome vazio");
  if (title.length > 200) errors.push("title > 200 chars");
  if (!description) errors.push("description/descricao vazio");
  if (!GIFT_CATEGORIES.includes(category)) {
    errors.push(`category invalida: "${category}" (use ${GIFT_CATEGORIES.join(" | ")})`);
  }
  if (!imageUrl) errors.push("imageUrl/foto_url vazio");
  if (!Number.isFinite(price) || price < 0) errors.push(`price/valor_cota invalido: ${raw.price ?? raw.valor_cota}`);

  const id = (raw.id && String(raw.id).trim()) || slugify(title);
  if (!id) errors.push("id vazio (e titulo nao gera slug)");

  // Grava SOMENTE o conjunto permitido por isValidGift (sem campos extras).
  const doc = { title, description, category, price, imageUrl };

  return { id, doc, errors: errors.map((e) => `linha ${index + 1}: ${e}`) };
}

async function main() {
  console.log(`\nseed-gifts — modo: ${dryRun ? "DRY-RUN (nao grava)" : "COMMIT"}${prune ? " +PRUNE" : ""}`);
  console.log(`fonte: ${file}\n`);

  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`Arquivo nao encontrado: ${abs}`);
    console.error(`Use --file ou preencha docs/templates/planilha-presentes.csv (ver docs/templates/README.md).\n`);
    process.exit(1);
  }

  const text = fs.readFileSync(abs, "utf8");
  let rows;
  if (file.toLowerCase().endsWith(".json")) {
    try {
      rows = JSON.parse(text);
    } catch (err) {
      console.error(`JSON invalido em ${file}: ${err.message}`);
      process.exit(1);
    }
    if (!Array.isArray(rows)) {
      console.error("O JSON de presentes deve ser um array.");
      process.exit(1);
    }
  } else {
    rows = parseCsv(text);
  }

  // Ignora linhas de exemplo do template.
  const realRows = rows.filter((r) => !isExampleRow(r));
  const skipped = rows.length - realRows.length;
  if (skipped > 0) console.log(`(${skipped} linha(s) de exemplo ignorada(s))`);
  if (!realRows.length) {
    console.error("\nNenhuma linha real encontrada (so exemplos?). Preencha a planilha com presentes reais.\n");
    process.exit(1);
  }

  // valida tudo ANTES de qualquer write
  const validated = realRows.map(validateGift);
  const allErrors = validated.flatMap((v) => v.errors);
  const ids = validated.map((v) => v.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) allErrors.push(`ids duplicados: ${[...new Set(dupes)].join(", ")}`);

  if (allErrors.length) {
    console.error(`${allErrors.length} erro(s) de validacao — nada sera gravado:`);
    for (const e of allErrors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`OK: ${validated.length} presente(s) validados.`);

  if (dryRun) {
    for (const { id, doc } of validated) {
      console.log(`  [dry] ${id}  ${doc.category}  R$ ${doc.price.toFixed(2)}  ${doc.title}`);
    }
    console.log(`\nDry-run concluido. Rode com --commit para gravar.\n`);
    return;
  }

  // --- COMMIT: carrega Admin SDK lazy (so quando vai gravar de verdade) ---
  let admin;
  try {
    admin = (await import("firebase-admin")).default;
  } catch {
    console.error("\nfirebase-admin ausente. Instale: npm install firebase-admin\n");
    process.exit(1);
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error("\nGOOGLE_APPLICATION_CREDENTIALS nao definido (service account). Abortando.\n");
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  const databaseId = process.env.FIREBASE_DATABASE_ID;
  const db = databaseId ? admin.firestore(undefined, databaseId) : admin.firestore();
  console.log(`Firestore alvo: ${databaseId || "(default)"}\n`);

  const col = db.collection("gifts");
  const existingSnap = await col.get();
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));

  let created = 0;
  let updated = 0;
  const batch = db.batch();
  for (const { id, doc } of validated) {
    if (existingIds.has(id)) updated++;
    else created++;
    batch.set(col.doc(id), doc, { merge: true });
  }

  let pruned = 0;
  if (prune) {
    const incoming = new Set(ids);
    for (const d of existingSnap.docs) {
      if (!incoming.has(d.id)) {
        batch.delete(d.ref);
        pruned++;
      }
    }
  }

  await batch.commit();
  console.log(`Concluido: ${created} criado(s) / ${updated} atualizado(s)${prune ? ` / ${pruned} removido(s)` : ""}.\n`);
}

main().catch((err) => {
  console.error("Falha no seed-gifts:", err);
  process.exit(1);
});
