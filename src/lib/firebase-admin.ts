import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

const credential =
  projectId && clientEmail && privateKey
    ? admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      })
    : admin.credential.applicationDefault();

const adminApp = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

const adminDb = admin.database(adminApp);
const adminAuth = admin.auth(adminApp);

export { admin, adminApp, adminAuth, adminDb };
