import express from 'express';
import { logEvent } from '../controllers/logsController';

const router = express.Router();

// Route for logging events
router.post('/log', logEvent);

export default router;
