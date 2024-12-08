import { Request, Response } from 'express';
import {  saveCoverLetter, getCoverLetter, getAllCoverLetters, deleteCoverLetter, generateCoverLetter } from '../services/coverLetterService';

export const generateCoverLetterHandler = async (req: Request, res: Response) => {
  try {
    const { resumeData, jobDescription, jobUrl } = req.body;
    const userId = req.params.userId?.toString();

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const coverLetter = await generateCoverLetter(userId, resumeData, jobDescription, jobUrl);
    res.json({ coverLetter });
  } catch (error) {
    console.error('Error in generateCoverLetterHandler:', error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
};

export const saveCoverLetterHandler = async (req: Request, res: Response) => {
  try {
    const { resumeId, content, jobDescription, jobUrl, coverId } = req.body;
    const userId = req.params.userId?.toString();

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const coverLetterId = await saveCoverLetter(userId, resumeId, content, jobDescription, jobUrl, coverId);

    res.json({ id: coverLetterId });
  } catch (error) {
    console.error('Error in saveCoverLetterHandler:', error);
    res.status(500).json({ error: 'Failed to save cover letter' });
  }
};

export const getCoverLetterHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.params.userId?.toString();

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const coverLetter = await getCoverLetter(userId, id);
    if (!coverLetter) {
      return res.status(404).json({ error: 'Cover letter not found' });
    }

    res.json(coverLetter);
  } catch (error) {
    console.error('Error in getCoverLetterHandler:', error);
    res.status(500).json({ error: 'Failed to get cover letter' });
  }
};

export const getAllCoverLettersHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId?.toString();

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const coverLetters = await getAllCoverLetters(userId);
    res.json(coverLetters);
  } catch (error) {
    console.error('Error in getAllCoverLettersHandler:', error);
    res.status(500).json({ error: 'Failed to get cover letters' });
  }
};

export const deleteCoverLetterHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.params.userId?.toString();

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await deleteCoverLetter(userId, id);
    res.json({ message: 'Cover letter deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCoverLetterHandler:', error);
    res.status(500).json({ error: 'Failed to delete cover letter' });
  }
};
