import express from 'express';
import { logEvent } from '../controllers/logsController';

const router = express.Router();

router.post('/log', logEvent);

export default router;
