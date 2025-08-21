import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { userRepository } from '../repositories/userRepository';
import { CreateUserData, LoginData, UpdateProfileData, User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserData = req.body;
      const result = await authService.registerUser(userData);

      res.status(201).json({
        success: true,
        data: result.user,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginData = req.body;
      const result = await authService.loginUser(loginData);

      res.json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          expiresAt: result.expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const result = await authService.verifyEmail(token);

      res.json({
        success: true,
        data: result.user,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userRepository.findById(req.user!.id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const profile = this.mapUserToProfile(user);

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileData: UpdateProfileData = req.body;
      const updatedUser = await userRepository.updateProfile(req.user!.id, profileData);

      const profile = this.mapUserToProfile(updatedUser);

      res.json({
        success: true,
        data: profile,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  private mapUserToProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      level: user.level,
      xp: user.xp,
      timezone: user.timezone,
      preferences: user.preferences,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }
}

export const authController = new AuthController();