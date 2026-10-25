/**
 * Firebase Admin SDK — usado APENAS no backend (API routes).
 * Inicialização lazy pra não quebrar o build se as env vars não estiverem setadas.
 */

import {
  initializeApp,
  getApps,
  cert,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK não configurado. Variáveis FIREBASE_ADMIN_* ausentes."
    );
  }

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
  return adminApp;
}

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get: (_, prop) => (getFirestore(getAdminApp()) as any)[prop],
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get: (_, prop) => (getAuth(getAdminApp()) as any)[prop],
});
