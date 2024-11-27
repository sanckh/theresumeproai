import { auth } from '../../firebase_options';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';

export class FirebaseService {
  async createUser(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async signInUser(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async verifyIdToken(token: string): Promise<unknown> {
    // Note: In a production environment, you should use Firebase Admin SDK
    // for server-side token verification
    try {
      // For now, we'll just return the token info
      // TODO: Implement proper token verification with Firebase Admin SDK
      return { valid: true, token };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
