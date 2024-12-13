/* eslint-disable @typescript-eslint/no-require-imports */
import { getAuth } from 'firebase/auth';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';


//We don't need this is prod because the server holds the env variables
if (process.env.NODE_ENV !== 'production') {
  console.log('Loading .env for development...');
  dotenv.config();
} else {
  console.log('Running in production mode...');
}


// Parse the service account JSON from the environment variable
const serviceAccountPath =  process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error('Service account key file not found!');
  process.exit(1); // Stop the process if the key is missing
}


const serviceAccount = require(serviceAccountPath);

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseConfig.databaseURL,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase App
const app = admin.initializeApp(firebaseConfig);
const db = admin.firestore();
const bucket = admin.storage().bucket();

export { app, db, bucket };
