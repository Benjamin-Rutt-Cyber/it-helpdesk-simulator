import { config } from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: path.resolve(__dirname, '../../', envFile) });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@helpdesksimu.com',
  API_URL: process.env.API_URL || 'http://localhost:3001',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables (skip in test environment)
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

if (process.env.NODE_ENV !== 'test') {
  for (const envVar of requiredEnvVars) {
    if (!env[envVar as keyof typeof env]) {
      console.warn(`Warning: ${envVar} environment variable is not set`);
    }
  }
}