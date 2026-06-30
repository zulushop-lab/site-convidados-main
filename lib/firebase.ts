import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Garante uma sessao (anonima) antes de writes que exigem isSignedIn() nas rules.
// O uid carimba a operacao e habilita endurecimento progressivo das rules
// (SPEC-FIRESTORE-SECURITY / SPEC-RSVP-AUTH). App Check fica para sprint posterior.
export const ensureAnonymousAuth = async () => {
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
};

export const signInWithGooglePopup = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signInWithGoogleRedirect = async (): Promise<void> => {
  await signInWithRedirect(auth, googleProvider);
};

export const getGoogleRedirectUser = async (): Promise<User | null> => {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
};

export const signOutFromFirebase = async () => {
  await signOut(auth);
};
