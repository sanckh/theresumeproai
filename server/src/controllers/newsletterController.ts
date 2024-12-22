import { Request, Response } from 'express';
import { NewsletterService } from '../services/newsletterService';

export const subscribe = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const newsletterService = new NewsletterService();
    const result = await newsletterService.subscribeToNewsletter(email);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result.data);
  } catch (error) {
    console.error('Newsletter controller error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
