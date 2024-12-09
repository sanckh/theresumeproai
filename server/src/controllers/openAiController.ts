import { Request, Response } from 'express';
import {
  parseResumeService,
  analyzeResumeService,
  enhanceResumeService,
  classifySectionService,
  generateCoverLetterService
} from '../services/openAiService';

export const parseResume = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId?.toString();
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const { resumeText } = req.body;
    const result = await parseResumeService(resumeText);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId?.toString();
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const { resumeData } = req.body;
    const result = await analyzeResumeService(resumeData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const enhanceResume = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId?.toString();
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const { resumeData } = req.body;
    const result = await enhanceResumeService(resumeData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const classifySection = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId?.toString();
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const { text, context } = req.body;
    const result = await classifySectionService(text, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const generateCoverLetter = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId?.toString();
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const { resumeData, jobDescription, jobUrl } = req.body;
    const result = await generateCoverLetterService(resumeData, jobDescription, jobUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};