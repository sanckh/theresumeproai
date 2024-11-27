/* eslint-disable @typescript-eslint/no-require-imports */
const admin = require('firebase-admin');
import { LogEntry } from '../interfaces/logEntry';

// Initialize Firestore instance
const db = admin.firestore();

// Store log entry in Firestore
export const logToFirestore = async (log: LogEntry): Promise<void> => {
  try {
    await db.collection('logs').add({
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firestore logging error:', error);
    throw error;  // Rethrow error to be caught in the controller
  }
};
