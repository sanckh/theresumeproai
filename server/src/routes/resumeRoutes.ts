import { Router } from 'express';
import { handleSaveResume, handleGetResume, handleGetAllResumes, handleDeleteResume } from '../controllers/resumeController';

const router = Router();

router.post('/saveresume/:userId', handleSaveResume);
router.get('/getresume/:userId/:resumeId', handleGetResume);
router.get('/getallresumes/:userId', handleGetAllResumes);
router.delete('/deleteresume/:userId/:resumeId', handleDeleteResume);

export default router;
