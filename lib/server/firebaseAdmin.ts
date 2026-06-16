/**
 * Firebase Admin SDK isolado (server-only) — SPEC-PAYMENTS-MP RT-2.
 *
 * NOTA: nao usamos `import 'server-only'` aqui porque ele e avaliado durante a
 * coleta de page-data de Route Handlers (Next 15.5) e quebra o build. A garantia
 * server-only e mantida por contrato: este modulo so e importado por rotas
 * app/api/** (runtime nodejs) e le segredos de process.env (nunca NEXT_PUBLIC_).
 *
 * Inicializacao LAZY e singleton: sem credencial, getAdminDb() retorna null e as
 * rotas degradam para "modo simulado" (a spec exige que a ausencia de chave NUNCA
 * quebre o build nem a navegacao). databaseId e parametrizado via env
 * (PREFLIGHT pendente, decisao #11) — nunca hardcodar o banco nomeado.
 *
 * Dependencia opcional: `firebase-admin` so e necessaria quando ha credencial.
 * Carregada via import dinamico para nao exigir o pacote no build sem MP.
 */

type AdminDb = import('firebase-admin/firestore').Firestore;

let cached: AdminDb | null | undefined;

function readServiceAccount(): Record<string, unknown> | null {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    try {
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    } catch {
      console.error('[MP] FIREBASE_SERVICE_ACCOUNT_BASE64 invalido (nao e JSON base64).');
      return null;
    }
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      console.error('[MP] FIREBASE_SERVICE_ACCOUNT_KEY invalido (nao e JSON).');
      return null;
    }
  }
  return null;
}

/**
 * Retorna a instancia de Firestore do Admin SDK, ou null se nao houver
 * credencial configurada (modo simulado). Memoiza o resultado.
 */
export async function getAdminDb(): Promise<AdminDb | null> {
  if (cached !== undefined) return cached;

  const serviceAccount = readServiceAccount();
  const hasAppDefault = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccount && !hasAppDefault) {
    cached = null;
    return cached;
  }

  try {
    const { getApps, initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    const app =
      getApps()[0] ??
      initializeApp({
        credential: serviceAccount
          ? cert(serviceAccount as Parameters<typeof cert>[0])
          : applicationDefault(),
      });

    const databaseId = process.env.FIREBASE_DATABASE_ID;
    cached = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    return cached;
  } catch (error) {
    console.error('[MP] Falha ao inicializar firebase-admin:', error);
    cached = null;
    return cached;
  }
}
