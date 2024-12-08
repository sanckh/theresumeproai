import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import {
  saveCoverLetterHandler,
  getCoverLetterHandler,
  getAllCoverLettersHandler,
  deleteCoverLetterHandler,
  generateCoverLetterHandler,
} from '../controllers/coverLetterController';

const router = express.Router();

router.use(authenticateUser);

router.post('/generate/:userId', generateCoverLetterHandler);
router.post('/save/:userId', saveCoverLetterHandler);
router.get('/:userId/:id', getCoverLetterHandler);
router.get('/:userId', getAllCoverLettersHandler);
router.delete('/:userId/:id', deleteCoverLetterHandler);

export default router;
