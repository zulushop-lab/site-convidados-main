#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function loadEnvFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) return;

  const text = fs.readFileSync(abs, "utf8");
  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function readServiceAccount() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (base64) {
    const decoded = Buffer.from(base64, "base64").toString("utf8").trim();
    return JSON.parse(decoded.slice(decoded.indexOf("{"), decoded.lastIndexOf("}") + 1));
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (raw) {
    return JSON.parse(raw);
  }

  return null;
}

function timestampSuffix() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function serializeValue(value) {
  if (!value) return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeValue(item)]));
  }
  return value;
}

const args = process.argv.slice(2);
const getOpt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

loadEnvFile(getOpt("--env-file", ".env.local"));

const serviceAccount = readServiceAccount();
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !serviceAccount) {
  console.error("Credencial Admin SDK ausente. Configure GOOGLE_APPLICATION_CREDENTIALS ou FIREBASE_SERVICE_ACCOUNT_BASE64.");
  process.exit(1);
}

const { getApps, initializeApp, cert, applicationDefault } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const app = getApps()[0] ?? initializeApp({
  credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
});

const databaseId = process.env.FIREBASE_DATABASE_ID?.trim().replace(/\\r\\n?|\\n/g, "");
const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
const collections = ["families", "guests", "codes", "rsvps"];
const backup = {
  createdAt: new Date().toISOString(),
  databaseId: databaseId || "(default)",
  collections: {},
};

for (const collectionName of collections) {
  const snapshot = await db.collection(collectionName).get();
  backup.collections[collectionName] = snapshot.docs.map((doc) => ({
    id: doc.id,
    data: serializeValue(doc.data()),
  }));
  console.log(`${collectionName}: ${snapshot.size}`);
}

const outDir = path.resolve(getOpt("--out-dir", "output/firebase-backups"));
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `rsvp-firestore-backup-${timestampSuffix()}.json`);
fs.writeFileSync(outFile, JSON.stringify(backup, null, 2) + "\n", "utf8");
console.log(`backup: ${outFile}`);
