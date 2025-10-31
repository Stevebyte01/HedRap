import admin from "firebase-admin";

let db = null;

export const initializeFirebase = async () => {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    console.log("Firebase initialized");
    return db;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    throw error;
  }
};

export const getFirestore = () => {
  if (!db) {
    throw new Error("Firestore not initialized");
  }
  return db;
};
