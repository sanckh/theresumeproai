import { Request, Response } from 'express';
import { createUser, signInUser, verifyIdToken, getAdditionalUserInfo, resendVerificationEmail } from '../services/authService';
import { logToFirestore } from '../services/logs_service';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

export const signUp = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await createUser(email, password);
    res.json(user);
  } catch (error) {
    console.error('Error signing up:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await signInUser(email, password);
    res.json(user);
  } catch (error) {
    console.error('Error signing in:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const decodedToken = await verifyIdToken(token);
    res.json(decodedToken);
  } catch (error) {
    console.error('Error verifying token:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(401).json({ error: errorMessage });
  }
};

export const getUserInfo = async (req: Request, res: Response) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const userInfo = await getAdditionalUserInfo(user.uid);

      await new Promise((resolve) => setTimeout(resolve, 0));

      res.status(200).send({ uid: user.uid, ...userInfo });
    } catch (error: any) {
      console.error('Error fetching user info:', error);

      await logToFirestore({
        eventType: 'ERROR',
        message: 'Failed to fetch user info at getUserInfo',
        data: { error: error.message},
        timestamp: new Date().toISOString(),
      });

      res.status(500).send({ error: 'Error fetching additional user info' });
    }
  } else {
    res.status(400).send({ error: 'User not logged in' });
  }
}

export const resendVerificationEmailController = async (req: Request, res: Response) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return res.status(401).json({ error: 'No user is currently signed in' });
    }

    const result = await resendVerificationEmail(user);
    res.json(result);
  } catch (error) {
    console.error('Error in resendVerificationEmailController:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
};
