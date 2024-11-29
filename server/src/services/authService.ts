import { auth, db } from '../../firebase_options';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  UserCredential,
  sendEmailVerification
} from 'firebase/auth';
import { logToFirestore } from './logs_service';

export async function createUser(email: string, password: string): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  console.log("usercredential.user", userCredential.user);
  await sendEmailVerification(userCredential.user);
  return userCredential;
}

export async function signInUser(email: string, password: string): Promise<UserCredential> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  if (!userCredential.user.emailVerified) {
    throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
  }
  return userCredential;
}

export async function verifyIdToken(token: string): Promise<unknown> {
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

export async function getAdditionalUserInfo(uid: string) {
  try {
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.where('uid', '==', uid).limit(1).get();

      if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data() as { name: string, profileImageUrl: string } | undefined;
          return {
              name: userData?.name,
              profileImageUrl: userData?.profileImageUrl,
          };
      } else {
          await logToFirestore({
              eventType: 'ERROR',
              message: 'User not found',
              data: { uid },
              timestamp: new Date().toISOString(),
          });

          throw new Error('User not found');
      }
  } catch (error: any) {
      console.error('Error fetching user info:', error);

      await logToFirestore({
          eventType: 'ERROR',
          message: 'Failed to fetch user info',
          data: { error: error.message, uid },
          timestamp: new Date().toISOString(),
      });

      throw new Error('Failed to fetch user info');
  }
}

export const resendVerificationEmail = async (user: any) => {
  try {
    if (!user) {
      throw new Error('No user provided');
    }
    await sendEmailVerification(user);
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Error in resendVerificationEmail service:', error);
    throw error;
  }
};
