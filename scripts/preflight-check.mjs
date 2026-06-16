#!/usr/bin/env node

/**
 * preflight-check — confirma, ANTES de deploy de rules / seed / webhooks, que o
 * banco Firestore esperado pelo codigo realmente existe e e acessivel
 * (PREFLIGHT, decisao travada #11).
 *
 * O codigo do app ja aponta para um banco NOMEADO (lib/firebase.ts le
 * firebase-applet-config.json -> firestoreDatabaseId; firebase.json -> database).
 * Este script verifica que esse banco existe no projeto, que as 3 fontes de
 * config concordam, e que da pra LER uma colecao conhecida. Nada e escrito.
 *
 * 100% READ-ONLY. Nao grava, nao deleta, nao deploya.
 *
 * Requer:
 *   npm install firebase-admin   (ja e dependencia do projeto)
 *
 * Credencial (mesmo padrao de seed-families.mjs):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\caminho\\serviceAccount.json"
 *   $env:FIREBASE_DATABASE_ID = "..."   # opcional; default = le do applet-config
 *
 * Uso:
 *   node scripts/preflight-check.mjs
 *   node scripts/preflight-check.mjs --collection gifts   # colecao p/ read de teste
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// --- args ---
const args = process.argv.slice(2);
const getFlag = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const testCollection = getFlag('--collection', 'gifts');

// --- helpers de saida ---
let failures = 0;
const pass = (msg) => console.log(`  PASS  ${msg}`);
const fail = (msg) => {
  console.log(`  FAIL  ${msg}`);
  failures += 1;
};
const info = (msg) => console.log(`  ....  ${msg}`);

// --- 1. ler a config local que o app usa ---
console.log('\n[1/4] Config local (a fonte da verdade do app)');

const appletPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');

if (!fs.existsSync(appletPath)) {
  fail('firebase-applet-config.json nao existe localmente. O app nao consegue inicializar.');
  console.log('\nPREFLIGHT abortado: sem config local.\n');
  process.exit(1);
}

const applet = JSON.parse(fs.readFileSync(appletPath, 'utf8'));
const projectId = applet.projectId;
const appletDbId = applet.firestoreDatabaseId || '(default)';
info(`projectId (applet-config)      = ${projectId}`);
info(`firestoreDatabaseId (applet)   = ${appletDbId}`);

// banco escolhido para a verificacao: env tem prioridade, senao o applet-config
const targetDbId = process.env.FIREBASE_DATABASE_ID || appletDbId;
info(`banco alvo desta verificacao   = ${targetDbId}${process.env.FIREBASE_DATABASE_ID ? ' (via FIREBASE_DATABASE_ID)' : ' (via applet-config)'}`);

// --- 2. checar concordancia entre as 3 fontes de config ---
console.log('\n[2/4] Concordancia de config (cliente vs firebase.json)');

if (fs.existsSync(firebaseJsonPath)) {
  const fbJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
  const fbJsonDb = fbJson?.firestore?.database || '(default)';
  info(`firebase.json -> database      = ${fbJsonDb}`);
  if (fbJsonDb === appletDbId) {
    pass('applet-config e firebase.json apontam para o MESMO banco (deploy de rules vai ao lugar certo).');
  } else {
    fail(`DIVERGENCIA: applet-config (${appletDbId}) != firebase.json (${fbJsonDb}). ` +
         'Deploy de rules iria para um banco diferente do que o app le.');
  }
} else {
  info('firebase.json nao encontrado (deploy de rules usaria (default) na CLI).');
}

// --- 3. credencial presente? ---
console.log('\n[3/4] Service account (Admin SDK)');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  fail('GOOGLE_APPLICATION_CREDENTIALS nao definido. Defina apontando para o serviceAccount.json:');
  console.log('        PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\caminho\\serviceAccount.json"');
  console.log('\nPREFLIGHT incompleto: sem credencial nao da pra confirmar o banco no servidor.\n');
  process.exit(1);
}
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!fs.existsSync(credPath)) {
  fail(`GOOGLE_APPLICATION_CREDENTIALS aponta para um arquivo inexistente: ${credPath}`);
  process.exit(1);
}
pass(`credencial encontrada: ${credPath}`);

// firebase-admin v14 e modular: 'firebase-admin/app' e 'firebase-admin/firestore'
// sao subpacotes separados (mesmo padrao de lib/server/firebaseAdmin.ts). O
// namespace antigo (admin.apps / admin.firestore) NAO existe nessa resolucao ESM.
let appModule, firestoreModule;
try {
  appModule = await import('firebase-admin/app');
  firestoreModule = await import('firebase-admin/firestore');
} catch {
  fail('firebase-admin ausente. Instale: npm install firebase-admin');
  process.exit(1);
}
const { getApps, initializeApp, applicationDefault } = appModule;
const { getFirestore } = firestoreModule;

const credential = applicationDefault();
const app = getApps()[0] ?? initializeApp({ credential });

// --- 4. existencia do banco + read de teste ---
console.log('\n[4/4] Banco real no projeto + read de teste');

// 4a. Listar os bancos do projeto via REST Admin API (read-only).
//     Usa o token do proprio Admin SDK (mesma credencial), sem libs extras.
try {
  const token = await credential.getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!resp.ok) {
    fail(`API de listagem de bancos retornou HTTP ${resp.status}. ` +
         'A service account pode nao ter permissao (datastore.databases.list) ou o projeto esta errado.');
  } else {
    const body = await resp.json();
    const dbs = (body.databases || []).map((d) => d.name.split('/databases/')[1]);
    info(`bancos no projeto ${projectId}: ${dbs.length ? dbs.join(', ') : '(nenhum)'}`);
    const wanted = targetDbId === '(default)' ? '(default)' : targetDbId;
    if (dbs.includes(wanted)) {
      pass(`o banco esperado existe no projeto: ${wanted}`);
    } else {
      fail(`o banco esperado NAO existe: ${wanted}. ` +
           'Ou o nome em firestore.applet-config esta errado, ou o banco precisa ser criado. ' +
           'NAO deploye rules / rode seed ate alinhar isso.');
    }
  }
} catch (err) {
  fail(`falha ao listar bancos: ${err?.message || err}`);
}

// 4b. Read de teste no banco alvo (confirma acesso de leitura real).
try {
  const db = targetDbId === '(default)'
    ? getFirestore(app)
    : getFirestore(app, targetDbId);
  const snap = await db.collection(testCollection).limit(1).get();
  pass(`read OK em "${testCollection}" no banco ${targetDbId} (docs lidos: ${snap.size}; ` +
       `colecao ${snap.empty ? 'vazia mas acessivel' : 'com dados'}).`);
} catch (err) {
  fail(`read FALHOU em "${testCollection}" no banco ${targetDbId}: ${err?.message || err}. ` +
       'Pode ser banco inexistente, sem permissao, ou regiao/ID errados.');
}

// --- veredito ---
console.log('\n' + '='.repeat(60));
if (failures === 0) {
  console.log('PREFLIGHT: PASS — banco confirmado e legivel. Seguro prosseguir');
  console.log('para deploy de rules / seed APONTANDO PARA: ' + targetDbId);
  console.log('='.repeat(60) + '\n');
  process.exit(0);
} else {
  console.log(`PREFLIGHT: FAIL — ${failures} checagem(ns) falharam. NAO deploye rules`);
  console.log('nem rode seed ate resolver os itens FAIL acima.');
  console.log('='.repeat(60) + '\n');
  process.exit(1);
}
