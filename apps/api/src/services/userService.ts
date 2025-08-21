import { UserRepository } from '../repositories/userRepository';
import { SessionRepository } from '../repositories/sessionRepository';
import { NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  timezone?: string;
  preferences?: any;
}

export class UserService {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
  }

  async getUserById(id: string) {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      // Remove sensitive information
      const { passwordHash, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error) {
      logger.error('Error retrieving user by ID', { id, error });
      throw error;
    }
  }

  async updateUserProfile(id: string, updates: UserProfileUpdate) {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      const updatedUser = await this.userRepository.update(id, updates);

      // Remove sensitive information
      const { passwordHash, ...userWithoutPassword } = updatedUser;

      logger.info('User profile updated', {
        userId: id,
        updatedFields: Object.keys(updates),
      });

      return userWithoutPassword;
    } catch (error) {
      logger.error('Error updating user profile', { id, updates, error });
      throw error;
    }
  }

  async getUserProgress(userId: string) {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Get user's session statistics
      const completedSessions = await this.sessionRepository.findCompletedSessionsByUser(userId);
      const activeSessions = await this.sessionRepository.findActiveSessionsByUser(userId);

      // Calculate progress metrics
      const progress = {
        userId,
        level: user.level,
        xp: user.xp,
        completedScenarios: completedSessions.length,
        activeScenarios: activeSessions.length,
        lastActivity: user.lastLoginAt,
        streakDays: this.calculateStreakDays(completedSessions),
      };

      return progress;
    } catch (error) {
      logger.error('Error retrieving user progress', { userId, error });
      throw error;
    }
  }

  private calculateStreakDays(completedSessions: any[]): number {
    // Simple streak calculation - count consecutive days with completed sessions
    // In a real implementation, this would be more sophisticated
    if (completedSessions.length === 0) return 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if there's activity today
    const hasActivityToday = completedSessions.some(session => 
      session.completedAt && session.completedAt.toISOString().split('T')[0] === todayStr
    );

    if (!hasActivityToday) return 0;

    // For now, return a simple count based on recent activity
    // In a real implementation, this would check consecutive days
    return Math.min(completedSessions.length, 7); // Cap at 7 days for demo
  }
}