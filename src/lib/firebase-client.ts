/**
 * Firebase Client SDK — usado no frontend.
 * Inicialização lazy pra não quebrar o build quando env vars estão ausentes.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let app: FirebaseApp | undefined;

function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.apiKey) {
    throw new Error(
      "Firebase Client SDK não configurado. Defina as variáveis NEXT_PUBLIC_FIREBASE_* no Vercel."
    );
  }

  app = initializeApp(config);
  return app;
}

export const auth: Auth = new Proxy({} as Auth, {
  get: (_, prop) => (getAuth(getFirebaseApp()) as any)[prop],
});

export const db: Firestore = new Proxy({} as Firestore, {
  get: (_, prop) => (getFirestore(getFirebaseApp()) as any)[prop],
});

export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get: (_, prop) => (getStorage(getFirebaseApp()) as any)[prop],
});
