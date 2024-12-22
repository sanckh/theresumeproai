import { Request, Response } from 'express';
import { createAffiliate, findAffiliateByEmail } from '../services/affiliateService';
import { CreateAffiliateRequest } from '../interfaces/afilliateInterface';

export const createAffiliateRequest = async (req: Request, res: Response) => {
  try {
    const data = req.body as CreateAffiliateRequest;
    
    // Basic validation
    if (!data.name || !data.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if affiliate request already exists
    const existingAffiliate = await findAffiliateByEmail(data.email);
    if (existingAffiliate) {
      return res.status(400).json({ error: 'An affiliate request with this email already exists' });
    }

    const affiliateRequest = await createAffiliate({
      ...data,
      createdAt: new Date(),
      status: 'pending'
    });

    res.status(201).json(affiliateRequest);
  } catch (error) {
    console.error('Error creating affiliate request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAffiliateRequestByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const affiliateRequest = await findAffiliateByEmail(email);
    
    if (!affiliateRequest) {
      return res.status(404).json({ error: 'Affiliate request not found' });
    }
    
    res.json(affiliateRequest);
  } catch (error) {
    console.error('Error getting affiliate request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
