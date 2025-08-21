import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import {
  validateRegistration,
  validateLogin,
  validateEmailVerification,
  validatePasswordReset,
  validateNewPassword,
  validateProfileUpdate
} from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/verify/:token', validateEmailVerification, authController.verifyEmail);
router.post('/forgot-password', validatePasswordReset, authController.forgotPassword);
router.post('/reset-password', validateNewPassword, authController.resetPassword);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validateProfileUpdate, authController.updateProfile);

export default router;