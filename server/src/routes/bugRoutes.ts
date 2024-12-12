import express from 'express';
import { reportBug } from '../controllers/bugController';

const router = express.Router();

router.use(express.json());

router.post('/report/:userId', reportBug);

export default router;
