/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { logToFirestore } from '../services/logs_service';

/**
 * Log an event to Firestore.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const logEvent = async (req: Request, res: Response) => {
  try {
    const { eventType, message, data, timestamp } = req.body;

    if (!eventType || !message) {
      return res.status(400).json({ error: 'Invalid log entry' });
    }
    await logToFirestore({
      eventType,
      message,
      data,
      timestamp: timestamp || new Date().toISOString(),
    });

    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Logging error:', error);

    // Log the error to Firestore for better tracking
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to log event',
      data: { error: error.message },
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ error: 'Failed to log event' });
  }
};