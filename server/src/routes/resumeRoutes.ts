import { Router } from 'express';
import { handleSaveResume, handleGetResume, handleGetAllResumes } from '../controllers/resumeController';

const router = Router();

// Resume routes
router.post('/saveresume', handleSaveResume);
router.get('/getresume/:resumeId', handleGetResume);
router.get('/getallresumes', handleGetAllResumes);

export default router;
