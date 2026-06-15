#!/usr/bin/env node

/**
 * Seed via Firestore Emulator.
 * O emulador não requer autenticação.
 */

const PROJECT_ID = "gen-lang-client-0435917056";
const DATABASE_ID = "ai-studio-remixmatheusisad-2704bafb-b28b-4074-97fe-0650887857e8";
const EMULATOR_HOST = "localhost:8080";

// Em produção, use REST API. No emulator, use JSON RPC
const baseUrl = `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

async function createDocument(collection, docId, data) {
  const url = `${baseUrl}/${collection}/${docId}`;

  const payload = {
    fields: Object.entries(data).reduce((acc, [key, value]) => {
      if (typeof value === "boolean") {
        acc[key] = { booleanValue: value };
      } else if (typeof value === "number") {
        acc[key] = { integerValue: String(value) };
      } else {
        acc[key] = { stringValue: String(value) };
      }
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
    console.log("\n🌱 Semeando família de teste no emulador...\n");

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
      isMainGuest: true,
    });

    await createDocument("guests", "g_isadora", {
      id: "g_isadora",
      familyId: "fam_casal",
      name: "Isadora",
      isMainGuest: true,
    });

    console.log("\n✅ Seed completo!\n");
    console.log("Acesse (em dev): http://localhost:3000/rsvp/EDRQ7ZSH\n");
  } catch (error) {
    console.error("\n❌ Seed falhou:", error.message);
    process.exit(1);
  }
}

seed();
