/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { saveResume, getResume, getAllResumes, deleteResume } from '../services/resumeService';
import { logToFirestore } from '../services/logs_service';

export const handleSaveResume = async (req: Request, res: Response) => {
  const userId = req.params.userId?.toString();

  if (!userId || typeof userId !== 'string') {
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Invalid or missing user ID in save resume request',
      data: { params: req.params },
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json({ error: 'User ID must be a string' });
  }

  try {
    const { resumeData, name, resumeId } = req.body;
    const savedResumeId = await saveResume(userId, resumeData, name, resumeId);
    res.json({ resumeId: savedResumeId });
  } catch (error: any) {
    console.error('Error saving resume:', error);

    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to save resume',
      data: { error: error.message, userId },
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ error: 'Failed to save resume' });
  }
};

export const handleGetResume = async (req: Request, res: Response) => {
  const userId = req.params.userId?.toString();
  const resumeId = req.params.resumeId?.toString();

  if (!userId || typeof userId !== 'string') {
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Invalid or missing user ID in get resume request',
      data: { params: req.params },
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json({ error: 'User ID must be a string' });
  }

  if (!resumeId || typeof resumeId !== 'string') {
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Invalid or missing resume ID in get resume request',
      data: { params: req.params },
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json({ error: 'Resume ID must be a string' });
  }

  try {
    const resume = await getResume(userId, resumeId);
    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }
    res.json(resume);
  } catch (error: any) {
    console.error('Error getting resume:', error);

    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to load resume',
      data: { error: error.message, userId, resumeId },
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ error: 'Failed to load resume' });
  }
};

export const handleGetAllResumes = async (req: Request, res: Response) => {
  const userId = req.params.userId?.toString();

  if (!userId || typeof userId !== 'string') {
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Invalid or missing user ID in get all resumes request',
      data: { params: req.params },
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json({ error: 'User ID must be a string' });
  }

  try {
    const resumes = await getAllResumes(userId);
    res.json(resumes);
  } catch (error: any) {
    console.error('Error getting all resumes:', error);

    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to load resumes',
      data: { error: error.message, userId },
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ error: 'Failed to load resumes' });
  }
};

export const handleDeleteResume = async (req: Request, res: Response) => {
  try {
    const { userId, resumeId } = req.params;

    if (!userId || !resumeId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    await deleteResume(userId, resumeId);
    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error in deleteResume controller:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
};