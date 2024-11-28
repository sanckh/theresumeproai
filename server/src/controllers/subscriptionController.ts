import { Request, Response } from 'express';
import { getSubscriptionStatus, updateTrialStatus } from '../services/subscriptionService';

export const getSubscriptionStatusForUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const status = await getSubscriptionStatus(userId);
    return res.status(200).json(status);
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get subscription status',
      error: error.message
    });
  }
};

export const updateUserTrialStatus = async (req: Request, res: Response) => {
  try {
    const { userId, trialType } = req.body;

    if (!userId || !trialType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and trial type are required'
      });
    }

    if (!['creator', 'reviewer'].includes(trialType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trial type'
      });
    }

    await updateTrialStatus(userId, trialType as 'creator' | 'reviewer');
    return res.status(200).json({
      success: true,
      message: `${trialType} trial status updated successfully`
    });
  } catch (error: any) {
    console.error('Error updating trial status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update trial status',
      error: error.message
    });
  }
};
