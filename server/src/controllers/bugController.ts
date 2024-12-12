import { Request, Response } from 'express';
import { createBugReport } from '../services/bugService';

export const reportBug = async (req: Request, res: Response) => {
  try {    
    const { title, description } = req.body;
    const userId = req.params.userId?.toString();

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const bugReport = await createBugReport({
      userId,
      title,
      description,
      status: 'open',
      createdAt: new Date(),
    });

    return res.status(201).json({ bugReport });
  } catch (error) {
    console.error('Error in bug report controller:', error);
    return res.status(500).json({ error: 'Failed to submit bug report' });
  }
};
