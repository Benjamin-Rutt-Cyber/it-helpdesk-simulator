import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

describe('Authentication Unit Tests', () => {
  const JWT_SECRET = 'test-secret-key';

  describe('Password hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should fail with wrong password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT token generation and validation', () => {
    it('should generate valid JWT tokens', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.userId).toBe('123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should fail with invalid secret', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('should fail with expired token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
      
      // Wait a moment for token to expire
      setTimeout(() => {
        expect(() => {
          jwt.verify(token, JWT_SECRET);
        }).toThrow();
      }, 100);
    });
  });

  describe('Password validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'TestPassword123!',
        'AnotherTest456@',
        'ComplexPass789#',
        'SecurePass101$'
      ];

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

      strongPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8);
        expect(passwordRegex.test(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        'onlylowercase',
        'ONLYUPPERCASE',
        '12345678',
        'NoSpecialChar123',
        'nouppercasechar123!',
        'NOLOWERCASECHAR123!'
      ];

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

      weakPasswords.forEach(password => {
        const isValid = password.length >= 8 && passwordRegex.test(password);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Email validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@domain',
        'user.domain.com',
        'user@domain.'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });
});