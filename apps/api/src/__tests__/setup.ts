import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '../../.env.test') });

// Mock database connection for tests
jest.mock('../config/database', () => ({
  getDbConnection: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn(),
  }),
  checkDatabaseHealth: jest.fn().mockResolvedValue({
    status: 'healthy',
    message: 'Database connection successful',
    timestamp: new Date().toISOString(),
  }),
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  pool: {
    end: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock email service for tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
    }),
  }),
}));

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(() => {
  // Suppress console warnings during tests
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});