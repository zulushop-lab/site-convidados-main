#!/usr/bin/env node

/**
 * Seed da família de teste usando o refresh token da Firebase CLI logada.
 *
 * Lê o refresh_token de ~/.config/configstore/firebase-tools.json,
 * troca por um access_token OAuth e escreve via Firestore REST API
 * autenticada (permissão de admin da conta logada — ignora as rules).
 *
 * Uso: node scripts/seed-with-cli-token.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "gen-lang-client-0435917056";
const DATABASE_ID = "ai-studio-remixmatheusisad-2704bafb-b28b-4074-97fe-0650887857e8";

// OAuth client ID/secret públicos do firebase-tools (embutidos na própria CLI).
const CLI_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLI_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

function readRefreshToken() {
  const cfgPath = path.join(
    os.homedir(),
    ".config",
    "configstore",
    "firebase-tools.json"
  );
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
  const rt = cfg?.tokens?.refresh_token;
  if (!rt) throw new Error("refresh_token não encontrado na config da CLI");
  return rt;
}

async function getAccessToken(refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLI_CLIENT_ID,
      client_secret: CLI_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao obter access_token: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

function toFirestoreFields(data) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (typeof value === "boolean") acc[key] = { booleanValue: value };
    else if (typeof value === "number") acc[key] = { integerValue: String(value) };
    else acc[key] = { stringValue: String(value) };
    return acc;
  }, {});
}

async function createDocument(accessToken, collection, docId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collection}/${docId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    throw new Error(`${collection}/${docId} -> ${res.status} ${await res.text()}`);
  }
  console.log(`✅ ${collection}/${docId}`);
}

async function main() {
  console.log("\n🌱 Semeando família de teste (via token da Firebase CLI)...\n");

  const refreshToken = readRefreshToken();
  const accessToken = await getAccessToken(refreshToken);

  await createDocument(accessToken, "codes", "EDRQ7ZSH", {
    familyId: "fam_casal",
  });
  await createDocument(accessToken, "families", "fam_casal", {
    id: "fam_casal",
    name: "Matheus & Isadora",
    code: "EDRQ7ZSH",
  });
  await createDocument(accessToken, "guests", "g_matheus", {
    id: "g_matheus",
    familyId: "fam_casal",
    name: "Matheus",
    isMainGuest: true,
  });
  await createDocument(accessToken, "guests", "g_isadora", {
    id: "g_isadora",
    familyId: "fam_casal",
    name: "Isadora",
    isMainGuest: true,
  });

  console.log("\n✅ Seed completo!");
  console.log("\nAcesse: http://localhost:3000/rsvp/EDRQ7ZSH\n");
}

main().catch((err) => {
  console.error("\n❌ Seed falhou:", err.message);
  process.exit(1);
});
