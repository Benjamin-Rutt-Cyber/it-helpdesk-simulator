import request from 'supertest';
import app from '../app';
import { pool } from '../config/database';
import { userRepository } from '../repositories/userRepository';
import { authService } from '../services/authService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';

describe('Authentication API', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Set up test environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'testpass';
    process.env.EMAIL_FROM = 'test@test.com';
    process.env.API_URL = 'http://localhost:3001';
  });

  afterAll(async () => {
    // Clean up database connections
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up test data
    try {
      await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
    } catch (error) {
      // Ignore if table doesn't exist
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.firstName).toBe(userData.firstName);
      expect(response.body.data.isVerified).toBe(false);
      expect(response.body.message).toContain('Please check your email');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      // Register first user
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_EXISTS');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a verified test user
      const userData = {
        email: 'testlogin@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const registerResult = await authService.registerUser(userData);
      testUser = registerResult.user;
      
      // Verify the user
      await userRepository.verifyUser(testUser.id);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'testlogin@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();

      authToken = response.body.data.token;
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'testlogin@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login for unverified user', async () => {
      // Create unverified user
      const userData = {
        email: 'unverified@example.com',
        password: 'TestPassword123!'
      };

      await authService.registerUser(userData);

      const loginData = {
        email: 'unverified@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('GET /auth/verify/:token', () => {
    it('should verify email with valid token', async () => {
      const userData = {
        email: 'testverify@example.com',
        password: 'TestPassword123!'
      };

      await authService.registerUser(userData);
      const user = await userRepository.findByEmail(userData.email);

      const response = await request(app)
        .get(`/auth/verify/${user!.verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isVerified).toBe(true);
      expect(response.body.message).toContain('Email verified successfully');
    });

    it('should reject verification with invalid token', async () => {
      const response = await request(app)
        .get('/auth/verify/invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      const userData = {
        email: 'testforgot@example.com',
        password: 'TestPassword123!'
      };

      await authService.registerUser(userData);
    });

    it('should send reset email for existing user', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'testforgot@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('you will receive a password reset link');
    });

    it('should return success message for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('you will receive a password reset link');
    });
  });

  describe('POST /auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'testreset@example.com',
        password: 'TestPassword123!'
      };

      await authService.registerUser(userData);
      const user = await userRepository.findByEmail(userData.email);
      
      // Generate reset token
      resetToken = 'test-reset-token';
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);
      
      await userRepository.setResetToken(user!.id, resetToken, expiryDate);
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ 
          token: resetToken, 
          password: 'NewPassword123!' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successfully');
    });

    it('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ 
          token: 'invalid-token', 
          password: 'NewPassword123!' 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('GET /auth/profile', () => {
    beforeEach(async () => {
      const userData = {
        email: 'testprofile@example.com',
        password: 'TestPassword123!'
      };

      const result = await authService.registerUser(userData);
      testUser = result.user;
      
      // Verify and login
      await userRepository.verifyUser(testUser.id);
      const loginResult = await authService.loginUser({
        email: userData.email,
        password: userData.password
      });
      authToken = loginResult.token;
    });

    it('should get profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('testprofile@example.com');
      expect(response.body.data.isVerified).toBe(true);
    });

    it('should reject profile request without token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No token provided');
    });

    it('should reject profile request with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });

  describe('PUT /auth/profile', () => {
    beforeEach(async () => {
      const userData = {
        email: 'testupdate@example.com',
        password: 'TestPassword123!'
      };

      const result = await authService.registerUser(userData);
      testUser = result.user;
      
      // Verify and login
      await userRepository.verifyUser(testUser.id);
      const loginResult = await authService.loginUser({
        email: userData.email,
        password: userData.password
      });
      authToken = loginResult.token;
    });

    it('should update profile with valid data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        timezone: 'America/New_York'
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.timezone).toBe('America/New_York');
    });

    it('should reject profile update without token', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put('/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Service', () => {
    describe('Password hashing', () => {
      it('should hash passwords securely', async () => {
        const password = 'TestPassword123!';
        const hashedPassword = await bcrypt.hash(password, 12);
        
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.length).toBeGreaterThan(50);
        
        const isValid = await bcrypt.compare(password, hashedPassword);
        expect(isValid).toBe(true);
      });
    });

    describe('JWT token generation', () => {
      it('should generate valid JWT tokens', async () => {
        const payload = { userId: '123', email: 'test@example.com' };
        const token = jwt.sign(payload, env.JWT_SECRET!, { expiresIn: '1h' });
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        
        const decoded = jwt.verify(token, env.JWT_SECRET!) as any;
        expect(decoded.userId).toBe('123');
        expect(decoded.email).toBe('test@example.com');
      });
    });
  });
});