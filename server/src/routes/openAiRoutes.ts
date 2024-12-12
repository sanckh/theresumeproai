import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { 
  parseResume,
  analyzeResume,
  enhanceResume,
  classifySection,
  generateCoverLetter
} from '../controllers/openAiController';

const router = express.Router();

router.use(authenticateUser);

router.post('/parse-resume/:userId', parseResume);
router.post('/analyze-resume/:userId', analyzeResume);
router.post('/enhance-resume/:userId', enhanceResume);
router.post('/classify-section/:userId', classifySection);
router.post('/generate-cover-letter/:userId', generateCoverLetter);

export default router;