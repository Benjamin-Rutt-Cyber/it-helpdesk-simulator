import { PrismaClient } from '@prisma/client';
import { User, CreateUserData, UpdateProfileData } from '../models/User';

const prisma = new PrismaClient();

export class UserRepository {
  async create(userData: CreateUserData & { passwordHash: string; verificationToken: string }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        timezone: userData.timezone || 'UTC',
        verificationToken: userData.verificationToken,
      },
    });
    
    return this.mapPrismaUserToUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });
    
    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });
    
    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async verifyUser(id: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });
    
    return this.mapPrismaUserToUser(user);
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    
    return this.mapPrismaUserToUser(user);
  }

  async setResetToken(id: string, resetToken: string, expiryDate: Date): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        resetToken,
        resetTokenExpiry: expiryDate,
      },
    });
    
    return this.mapPrismaUserToUser(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async updateProfile(id: string, profileData: UpdateProfileData): Promise<User> {
    const updateData: any = {};
    
    if (profileData.firstName !== undefined) {
      updateData.firstName = profileData.firstName;
    }
    
    if (profileData.lastName !== undefined) {
      updateData.lastName = profileData.lastName;
    }
    
    if (profileData.timezone !== undefined) {
      updateData.timezone = profileData.timezone;
    }
    
    if (profileData.preferences !== undefined) {
      updateData.preferences = profileData.preferences;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    
    return this.mapPrismaUserToUser(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: userData,
    });
    
    return this.mapPrismaUserToUser(user);
  }

  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      level: prismaUser.level,
      xp: prismaUser.xp,
      timezone: prismaUser.timezone,
      preferences: prismaUser.preferences || {},
      isVerified: prismaUser.isVerified,
      verificationToken: prismaUser.verificationToken,
      resetToken: prismaUser.resetToken,
      resetTokenExpiry: prismaUser.resetTokenExpiry,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      lastLoginAt: prismaUser.lastLoginAt
    };
  }
}

export const userRepository = new UserRepository();