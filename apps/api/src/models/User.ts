export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  level: number;
  xp: number;
  timezone: string;
  preferences: Record<string, any>;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  level: number;
  xp: number;
  timezone: string;
  preferences: Record<string, any>;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  timezone?: string;
  preferences?: Record<string, any>;
}