import { Request, Response } from 'express';
import { saveResume, getResume, getAllResumes } from '../services/resumeService';

export const handleSaveResume = async (req: Request, res: Response) => {
  try {
    const { userId, resumeData, name, resumeId } = req.body;
    const savedResumeId = await saveResume(userId, resumeData, name, resumeId);
    res.json({ resumeId: savedResumeId });
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({ error: 'Failed to save resume' });
  }
};

export const handleGetResume = async (req: Request, res: Response) => {
  try {
    const { resumeId } = req.params;
    const { userId } = req.query;
      
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }

    const resume = await getResume(userId, resumeId);
    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }
    res.json(resume);
  } catch (error) {
    console.error('Error getting resume:', error);
    res.status(500).json({ error: 'Failed to load resume' });
  }
};

export const handleGetAllResumes = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
      
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }

    const resumes = await getAllResumes(userId);
    res.json(resumes);
  } catch (error) {
    console.error('Error getting all resumes:', error);
    res.status(500).json({ error: 'Failed to load resumes' });
  }
};