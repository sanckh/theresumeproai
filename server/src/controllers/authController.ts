import { Request, Response } from 'express';
import { FirebaseService } from '../services/authService';

export class FirebaseController {
  private firebaseService: FirebaseService;

  constructor() {
    this.firebaseService = new FirebaseService();
  }

  signUp = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await this.firebaseService.createUser(email, password);
      res.json(user);
    } catch (error) {
      console.error('Error signing up:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  };

  signIn = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await this.firebaseService.signInUser(email, password);
      res.json(user);
    } catch (error) {
      console.error('Error signing in:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  };

  verifyToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      res.json(decodedToken);
    } catch (error) {
      console.error('Error verifying token:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(401).json({ error: errorMessage });
    }
  };
}
