import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { userRepository } from '../repositories/userRepository';
import { User, CreateUserData, LoginData, UserProfile } from '../models/User';
import { env } from '../config/environment';

export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  async registerUser(userData: CreateUserData): Promise<{ user: UserProfile; message: string }> {
    // Validate input
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await userRepository.create({
      ...userData,
      passwordHash,
      verificationToken
    });

    // Send verification email
    await this.sendVerificationEmail(user.email, verificationToken);

    return {
      user: this.mapUserToProfile(user),
      message: 'User registered successfully. Please check your email to verify your account.'
    };
  }

  async loginUser(loginData: LoginData): Promise<{ user: UserProfile; token: string; expiresAt: Date }> {
    // Validate input
    if (!loginData.email || !loginData.password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = await userRepository.findByEmail(loginData.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const secret = env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    return {
      user: this.mapUserToProfile(user),
      token,
      expiresAt
    };
  }

  async verifyEmail(token: string): Promise<{ user: UserProfile; message: string }> {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    const verifiedUser = await userRepository.verifyUser(user.id);

    return {
      user: this.mapUserToProfile(verifiedUser),
      message: 'Email verified successfully. You can now log in.'
    };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Return success message even if user doesn't exist for security
      return { message: 'If an account with this email exists, you will receive a password reset link.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1); // 1 hour from now

    await userRepository.setResetToken(user.id, resetToken, expiryDate);

    // Send reset email
    await this.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If an account with this email exists, you will receive a password reset link.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Validate input
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await userRepository.updatePassword(user.id, passwordHash);

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }

  async validateToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const secret = env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }
      
      const decoded = jwt.verify(token, secret) as { userId: string; email: string };
      return { userId: decoded.userId, email: decoded.email };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${env.API_URL}/auth/verify/${token}`;
    
    const mailOptions = {
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email - IT Helpdesk Simulator',
      html: `
        <h2>Welcome to IT Helpdesk Simulator!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${env.NEXTAUTH_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset - IT Helpdesk Simulator',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  private mapUserToProfile(user: User): UserProfile {
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

export const authService = new AuthService();