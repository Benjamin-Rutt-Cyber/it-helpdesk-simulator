# Backend Architecture

## Service Architecture

### Function Organization

```
apps/api/src/
├── controllers/               # HTTP request handlers
│   ├── authController.ts
│   ├── scenarioController.ts
│   ├── sessionController.ts
│   ├── performanceController.ts
│   └── userController.ts
├── services/                  # Business logic services
│   ├── authService.ts
│   ├── aiService.ts
│   ├── chatService.ts
│   ├── scenarioService.ts
│   ├── performanceService.ts
│   └── gamificationService.ts
├── models/                    # Data models and schemas
│   ├── User.ts
│   ├── Scenario.ts
│   ├── UserSession.ts
│   ├── ChatMessage.ts
│   └── PerformanceMetric.ts
├── repositories/              # Data access layer
│   ├── userRepository.ts
│   ├── scenarioRepository.ts
│   ├── sessionRepository.ts
│   └── performanceRepository.ts
├── middleware/                # Express middleware
│   ├── auth.ts
│   ├── validation.ts
│   ├── rateLimiting.ts
│   └── errorHandler.ts
├── routes/                    # API route definitions
│   ├── auth.ts
│   ├── scenarios.ts
│   ├── sessions.ts
│   ├── performance.ts
│   └── users.ts
├── utils/                     # Utility functions
│   ├── logger.ts
│   ├── validators.ts
│   ├── encryption.ts
│   └── constants.ts
├── sockets/                   # WebSocket handlers
│   ├── chatHandler.ts
│   ├── sessionHandler.ts
│   └── performanceHandler.ts
├── config/                    # Configuration
│   ├── database.ts
│   ├── redis.ts
│   ├── openai.ts
│   └── environment.ts
└── app.ts                     # Express app setup
```

### Controller Template

```typescript
// controllers/scenarioController.ts
import { Request, Response, NextFunction } from 'express';
import { scenarioService } from '../services/scenarioService';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export class ScenarioController {
  async getScenarios(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { difficulty, completed } = req.query;
      const userId = req.user?.id;

      const scenarios = await scenarioService.getScenarios({
        userId,
        difficulty: difficulty as string,
        completed: completed === 'true',
      });

      logger.info(`Retrieved ${scenarios.length} scenarios for user ${userId}`);

      res.json({
        success: true,
        data: scenarios,
        meta: {
          total: scenarios.length,
          difficulty: difficulty || 'all',
        },
      });
    } catch (error) {
      logger.error('Error retrieving scenarios:', error);
      next(error);
    }
  }

  async startScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      const session = await scenarioService.startScenario(scenarioId, userId);

      logger.info(`Started scenario ${scenarioId} for user ${userId}`);

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Error starting scenario:', error);
      next(error);
    }
  }

  async getScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const userId = req.user?.id;

      const scenario = await scenarioService.getScenarioWithProgress(
        scenarioId,
        userId
      );

      if (!scenario) {
        return res.status(404).json({
          error: 'Scenario not found',
        });
      }

      res.json({
        success: true,
        data: scenario,
      });
    } catch (error) {
      logger.error('Error retrieving scenario:', error);
      next(error);
    }
  }
}

export const scenarioController = new ScenarioController();
```

## Database Architecture

### Schema Design

```typescript
// models/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSession } from './UserSession';
import { PerformanceMetric } from './PerformanceMetric';
import { UserAchievement } from './UserAchievement';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  // Relationships
  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @OneToMany(() => PerformanceMetric, (metric) => metric.user)
  performanceMetrics: PerformanceMetric[];

  @OneToMany(() => UserAchievement, (achievement) => achievement.user)
  achievements: UserAchievement[];
}

// models/Scenario.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSession } from './UserSession';

export enum ScenarioDifficulty {
  STARTER = 'starter',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Entity('scenarios')
export class Scenario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ScenarioDifficulty,
    default: ScenarioDifficulty.STARTER,
  })
  difficulty: ScenarioDifficulty;

  @Column({ name: 'estimated_time' })
  estimatedTime: number;

  @Column({ name: 'xp_reward' })
  xpReward: number;

  @Column({ type: 'jsonb', name: 'ticket_template' })
  ticketTemplate: {
    priority: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    customerInfo: any;
    technicalContext: any;
  };

  @Column({ type: 'jsonb', name: 'customer_persona' })
  customerPersona: {
    name: string;
    personality: any;
    technicalLevel: 'novice' | 'intermediate' | 'advanced';
    communicationStyle: any;
  };

  @Column({ type: 'jsonb', name: 'knowledge_base_entries' })
  knowledgeBaseEntries: any[];

  @Column({ type: 'jsonb', name: 'assessment_criteria' })
  assessmentCriteria: any;

  @Column({ type: 'uuid', array: true, default: [] })
  prerequisites: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => UserSession, (session) => session.scenario)
  sessions: UserSession[];
}
```

### Data Access Layer

```typescript
// repositories/userRepository.ts
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Repository } from 'typeorm';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['sessions', 'performanceMetrics', 'achievements'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
    });
  }

  async updateXP(userId: string, xpGained: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.xp += xpGained;
    // Calculate new level (100 XP per level)
    const newLevel = Math.floor(user.xp / 100) + 1;
    const leveledUp = newLevel > user.level;
    user.level = newLevel;

    await this.repository.save(user);
    return user;
  }

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return await this.repository.find({
      order: { xp: 'DESC' },
      take: limit,
      select: ['id', 'firstName', 'lastName', 'level', 'xp'],
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(userId, {
      lastLoginAt: new Date(),
    });
  }
}

export const userRepository = new UserRepository();
```
