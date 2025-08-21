import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validateProfileUpdate } from '../middleware/validation';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

// Get current user profile
router.get('/me', 
  authMiddleware,
  userController.getCurrentUser.bind(userController)
);

// Update user profile
router.put('/me/profile', 
  authMiddleware,
  validateProfileUpdate,
  userController.updateProfile.bind(userController)
);

// Get user performance metrics
router.get('/me/performance', 
  authMiddleware,
  userController.getUserPerformance.bind(userController)
);

// Get user progress
router.get('/me/progress', 
  authMiddleware,
  userController.getUserProgress.bind(userController)
);

// Get user analytics
router.get('/me/analytics', 
  authMiddleware,
  userController.getUserAnalytics.bind(userController)
);

export default router;