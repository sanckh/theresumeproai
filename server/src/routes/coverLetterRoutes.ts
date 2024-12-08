import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import {
  generateCoverLetterHandler,
  saveCoverLetterHandler,
  getCoverLetterHandler,
  getAllCoverLettersHandler,
  deleteCoverLetterHandler,
} from '../controllers/coverLetterController';

const router = express.Router();

router.use(authenticateUser);

router.post('/generate', generateCoverLetterHandler);

router.post('/save', saveCoverLetterHandler);

router.get('/:id', getCoverLetterHandler);

router.get('/', getAllCoverLettersHandler);

router.delete('/:id', deleteCoverLetterHandler);

export default router;
