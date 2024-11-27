import { Router } from 'express';
import { FirebaseController } from '../controllers/authController';

const router = Router();
const firebaseController = new FirebaseController();

// Firebase auth routes
router.post('/auth/signup', firebaseController.signUp);
router.post('/auth/signin', firebaseController.signIn);
router.post('/auth/verify-token', firebaseController.verifyToken);

export default router;
