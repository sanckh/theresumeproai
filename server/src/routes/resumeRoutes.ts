import { Router } from 'express';
import { handleSaveResume, handleGetResume, handleGetAllResumes } from '../controllers/resumeController';

const router = Router();

// Resume routes
router.post('/saveresume/:userId', handleSaveResume);
router.get('/getresume/:userId/:resumeId', handleGetResume);
router.get('/getallresumes/:userId', handleGetAllResumes);

export default router;
