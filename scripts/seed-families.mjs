#!/usr/bin/env node

/**
 * seed-families — popula `families` / `guests` / `codes` a partir da planilha de
 * convidados, gera um codigo de alta entropia por familia e imprime os links de
 * RSVP + a mensagem de WhatsApp pronta (SPEC-RSVP-AUTH RT-12).
 *
 * Idempotente: a chave e `id_familia` (coluna da planilha). Re-rodar NAO
 * regenera o codigo de uma familia ja semeada (nao invalida links enviados).
 * Por seguranca, --dry-run e o DEFAULT — gravar exige --commit.
 *
 * Requer (so no --commit; dry-run nao precisa do SDK):
 *   npm install firebase-admin
 *
 * Credencial:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\caminho\\serviceAccount.json"
 *   $env:FIREBASE_DATABASE_ID = "..."   # opcional (PREFLIGHT, decisao #11)
 *
 * Uso:
 *   node scripts/seed-families.mjs                                  # dry-run
 *   node scripts/seed-families.mjs --host https://meusite.com.br
 *   node scripts/seed-families.mjs --commit
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";

// --- args ---
const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const getOpt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const commit = hasFlag("--commit");
const dryRun = !commit;
const file = getOpt("--file", "docs/templates/planilha-convidados.csv");
const host = getOpt("--host", "https://site-convidados-main.vercel.app").replace(/\/$/, "");

// Alfabeto sem ambiguos (0/O/1/l/I). 9 chars ~= 46 bits de entropia.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 9;

function generateCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

// id estavel de guest a partir do id_familia + nome.
const slugify = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// --- CSV parser (campos entre aspas; sem multilinha) ---
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
      } else if (ch === "," && !inQuotes) { out.push(cur); cur = ""; }
      else cur += ch;
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

const EVENT_DATE = "03 de Setembro de 2026";

function whatsappMessage(familyName, link) {
  return (
    `Ola, ${familyName}! ` +
    `Com muita alegria, Matheus & Isadora convidam voces para o casamento em ${EVENT_DATE}, em Brasilia. ` +
    `Confirmem a presenca e vejam os detalhes neste link: ${link}`
  );
}

function buildFamilies(rows) {
  const families = new Map();
  const errors = [];

  rows.forEach((raw, index) => {
    const idFamilia = String(raw.id_familia ?? "").trim();
    const nomeFamilia = String(raw.nome_familia ?? "").trim();
    const phone = String(raw.telefone_whatsapp ?? "").trim();
    const nomeConvidado = String(raw.nome_convidado ?? "").trim();
    const eCrianca = String(raw.e_crianca ?? "nao").trim().toLowerCase() === "sim";
    const eResponsavel = String(raw.e_responsavel_familia ?? "").trim().toLowerCase() === "sim";
    const email = String(raw.email ?? "").trim();

    const line = index + 2; // +2: header + 1-based
    if (!idFamilia) errors.push(`linha ${line}: id_familia vazio`);
    if (!nomeFamilia) errors.push(`linha ${line}: nome_familia vazio`);
    if (phone && !/^\+\d{8,15}$/.test(phone)) errors.push(`linha ${line}: telefone fora do formato E.164 (${phone})`);
    if (!nomeConvidado) errors.push(`linha ${line}: nome_convidado vazio`);
    if (!idFamilia || !nomeConvidado) return;

    if (!families.has(idFamilia)) {
      families.set(idFamilia, { id: idFamilia, name: nomeFamilia, phone: "", guests: [] });
    }
    const fam = families.get(idFamilia);
    if (!fam.phone && phone) fam.phone = phone;
    if (eResponsavel && phone) fam.phone = phone;
    const guestId = `${slugify(idFamilia)}_${slugify(nomeConvidado)}`;
    fam.guests.push({
      id: guestId,
      familyId: idFamilia,
      name: nomeConvidado,
      isChild: eCrianca,
      isMainGuest: eResponsavel,
      ...(email ? { email } : {}),
    });
  });

  // garante 1 responsavel por familia (default: primeiro)
  for (const fam of families.values()) {
    if (!fam.guests.some((g) => g.isMainGuest) && fam.guests[0]) {
      fam.guests[0].isMainGuest = true;
    }
    if (!fam.phone) {
      errors.push(`familia ${fam.id}: telefone_whatsapp vazio para o grupo`);
    }
  }

  return { families: [...families.values()], errors };
}

async function main() {
  console.log(`\nseed-families — modo: ${dryRun ? "DRY-RUN (nao grava)" : "COMMIT"}`);
  console.log(`fonte: ${file}`);
  console.log(`host:  ${host}\n`);

  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`Arquivo nao encontrado: ${abs} (ver docs/templates/README.md)\n`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(abs, "utf8"));
  const realRows = rows.filter((r) => !String(r.id_familia ?? "").startsWith("exemplo-"));
  const skipped = rows.length - realRows.length;
  if (skipped > 0) console.log(`(${skipped} linha(s) de exemplo ignorada(s))`);
  if (!realRows.length) {
    console.error("\nNenhuma familia real encontrada (so exemplos?). Preencha a planilha.\n");
    process.exit(1);
  }

  const { families, errors } = buildFamilies(realRows);
  if (errors.length) {
    console.error(`${errors.length} erro(s) de validacao — nada sera gravado:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`OK: ${families.length} familia(s), ${families.reduce((n, f) => n + f.guests.length, 0)} convidado(s).`);

  // --- COMMIT path: Admin SDK + idempotencia de codigo ---
  let admin = null;
  let db = null;
  if (commit) {
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
    db = databaseId ? admin.firestore(undefined, databaseId) : admin.firestore();
    console.log(`Firestore alvo: ${databaseId || "(default)"}`);
  }

  // gera/reusa codigo por familia e imprime links + mensagem
  const usedCodes = new Set();
  for (const fam of families) {
    let code = null;

    if (commit) {
      // reusa codigo ja semeado para esta familia (idempotencia)
      const existing = await db.collection("families").doc(fam.id).get();
      if (existing.exists && existing.data().code) {
        code = existing.data().code;
      }
    }
    if (!code) {
      do { code = generateCode(); } while (usedCodes.has(code));
    }
    usedCodes.add(code);
    fam.code = code;

    const baseLink = `${host}/rsvp/${code}`;
    console.log(`\n=== ${fam.name} (${fam.id}) ===`);
    console.log(`  code:  ${code}`);
    console.log(`  link:  ${baseLink}`);
    for (const g of fam.guests) {
      console.log(`   - ${g.name}${g.isMainGuest ? " [responsavel]" : ""}${g.isChild ? " [crianca]" : ""}: ${baseLink}?c=${g.id}`);
    }
    console.log(`  WhatsApp:\n    ${whatsappMessage(fam.name, baseLink)}`);

    if (commit) {
      const batch = db.batch();
      batch.set(db.collection("codes").doc(code), { familyId: fam.id }, { merge: true });
      batch.set(
        db.collection("families").doc(fam.id),
        { id: fam.id, name: fam.name, code, ...(fam.phone ? { phone: fam.phone } : {}) },
        { merge: true },
      );
      for (const g of fam.guests) {
        batch.set(db.collection("guests").doc(g.id), { ...g, rsvpStatus: "pending" }, { merge: true });
      }
      await batch.commit();
    }
  }

  console.log(dryRun ? `\nDry-run concluido. Rode com --commit para gravar.\n` : `\nConcluido: ${families.length} familia(s) gravada(s).\n`);
}

main().catch((err) => {
  console.error("Falha no seed-families:", err);
  process.exit(1);
});
