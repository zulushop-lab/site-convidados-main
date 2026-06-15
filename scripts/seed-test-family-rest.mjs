#!/usr/bin/env node

/**
 * Seed da família de teste usando Firebase REST API.
 * Não requer Service Account — usa apenas a API Key da config.
 */

import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const projectId = config.projectId;
const apiKey = config.apiKey;
const databaseId = config.firestoreDatabaseId;

const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

async function createDocument(collection, docId, data) {
  const url = `${baseUrl}/${collection}/${docId}?key=${apiKey}`;

  const payload = {
    fields: Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = {
        stringValue: String(value),
      };
      return acc;
    }, {}),
  };

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${response.status}: ${JSON.stringify(error)}`);
    }

    console.log(`✅ ${collection}/${docId} criado`);
  } catch (err) {
    console.error(`❌ Erro ao criar ${collection}/${docId}:`, err.message);
    throw err;
  }
}

async function seed() {
  try {
    console.log("\n🌱 Semeando família de teste...\n");

    await createDocument("codes", "EDRQ7ZSH", {
      familyId: "fam_casal",
    });

    await createDocument("families", "fam_casal", {
      id: "fam_casal",
      name: "Matheus & Isadora",
      code: "EDRQ7ZSH",
    });

    await createDocument("guests", "g_matheus", {
      id: "g_matheus",
      familyId: "fam_casal",
      name: "Matheus",
      isMainGuest: "true",
    });

    await createDocument("guests", "g_isadora", {
      id: "g_isadora",
      familyId: "fam_casal",
      name: "Isadora",
      isMainGuest: "true",
    });

    console.log("\n✅ Seed completo!\n");
    console.log("Acesse: http://localhost:3000/rsvp/EDRQ7ZSH\n");
  } catch (error) {
    console.error("\n❌ Seed falhou:", error.message);
    process.exit(1);
  }
}

seed();
