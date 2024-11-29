import { Router } from 'express';
import { 
  getUserInfo, 
  signIn, 
  signUp, 
  verifyToken,
  resendVerificationEmailController 
} from '../controllers/authController';

const router = Router();

// Firebase auth routes
router.post('/register', signUp);
router.post('/login', signIn);
router.post('/verify-token', verifyToken);
router.post('/resend-verification', resendVerificationEmailController);
router.get('/user', getUserInfo);

export default router;
