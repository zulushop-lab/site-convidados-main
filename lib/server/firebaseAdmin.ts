/**
 * Firebase Admin SDK isolado (server-only) — SPEC-PAYMENTS-MP RT-2.
 *
 * NOTA: nao usamos `import 'server-only'` aqui porque ele e avaliado durante a
 * coleta de page-data de Route Handlers (Next 15.5) e quebra o build. A garantia
 * server-only e mantida por contrato: este modulo so e importado por rotas
 * app/api/** (runtime nodejs) e le segredos de process.env (nunca NEXT_PUBLIC_).
 *
 * Inicializacao LAZY e singleton: sem credencial, getAdminDb() retorna null e as
 * rotas de pagamento falham explicitamente sem quebrar build/page-data. databaseId e parametrizado via env
 * (PREFLIGHT pendente, decisao #11) — nunca hardcodar o banco nomeado.
 *
 * Dependencia opcional: `firebase-admin` so e necessaria quando ha credencial.
 * Carregada via import dinamico para nao exigir o pacote no build sem MP.
 */

type AdminDb = import('firebase-admin/firestore').Firestore;
type AdminAuth = import('firebase-admin/auth').Auth;
type AdminApp = import('firebase-admin/app').App;

let cachedApp: AdminApp | null | undefined;
let cachedDb: AdminDb | null | undefined;
let cachedAuth: AdminAuth | null | undefined;

function readServiceAccount(): Record<string, unknown> | null {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (base64) {
    try {
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    } catch {
      console.error('[MP] FIREBASE_SERVICE_ACCOUNT_BASE64 invalido (nao e JSON base64).');
      return null;
    }
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
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
 * Retorna a app Admin SDK, ou null se nao houver credencial configurada.
 */
async function getAdminApp(): Promise<AdminApp | null> {
  if (cachedApp !== undefined) return cachedApp;

  const serviceAccount = readServiceAccount();
  const hasAppDefault = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccount && !hasAppDefault) {
    cachedApp = null;
    return cachedApp;
  }

  try {
    const { getApps, initializeApp, cert, applicationDefault } = await import('firebase-admin/app');

    cachedApp =
      getApps()[0] ??
      initializeApp({
        credential: serviceAccount
          ? cert(serviceAccount as Parameters<typeof cert>[0])
          : applicationDefault(),
      });

    return cachedApp;
  } catch (error) {
    console.error('[MP] Falha ao inicializar firebase-admin:', error);
    cachedApp = null;
    return cachedApp;
  }
}

/**
 * Retorna a instancia de Firestore do Admin SDK, ou null se nao houver
 * credencial configurada. Memoiza o resultado.
 */
export async function getAdminDb(): Promise<AdminDb | null> {
  if (cachedDb !== undefined) return cachedDb;

  const app = await getAdminApp();
  if (!app) {
    cachedDb = null;
    return cachedDb;
  }

  try {
    const { getFirestore } = await import('firebase-admin/firestore');

    const databaseId = process.env.FIREBASE_DATABASE_ID?.trim().replace(/\\r\\n?|\\n/g, '');
    cachedDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    return cachedDb;
  } catch (error) {
    console.error('[MP] Falha ao inicializar Firestore Admin:', error);
    cachedDb = null;
    return cachedDb;
  }
}

/**
 * Retorna o Auth Admin SDK para verificar ID tokens em rotas server-side.
 */
export async function getAdminAuth(): Promise<AdminAuth | null> {
  if (cachedAuth !== undefined) return cachedAuth;

  const app = await getAdminApp();
  if (!app) {
    cachedAuth = null;
    return cachedAuth;
  }

  try {
    const { getAuth } = await import('firebase-admin/auth');
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (error) {
    console.error('[MP] Falha ao inicializar Auth Admin:', error);
    cachedAuth = null;
    return cachedAuth;
  }
}
