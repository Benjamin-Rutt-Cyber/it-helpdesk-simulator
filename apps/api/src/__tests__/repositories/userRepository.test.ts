import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../repositories/userRepository';

// Mock the entire module and create a mock prisma instance
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainPassword',
        passwordHash: 'hashedPassword',
        verificationToken: 'token123',
        firstName: 'John',
        lastName: 'Doe',
        timezone: 'UTC',
      };

      const mockUser = {
        id: 'user-1',
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        level: 1,
        xp: 0,
        timezone: userData.timezone,
        preferences: {},
        isVerified: false,
        verificationToken: userData.verificationToken,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userRepository.create(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          passwordHash: userData.passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          timezone: userData.timezone,
          verificationToken: userData.verificationToken,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should handle null optional fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainPassword',
        passwordHash: 'hashedPassword',
        verificationToken: 'token123',
      };

      const mockUser = {
        id: 'user-1',
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: null,
        lastName: null,
        level: 1,
        xp: 0,
        timezone: 'UTC',
        preferences: {},
        isVerified: false,
        verificationToken: userData.verificationToken,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userRepository.create(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          passwordHash: userData.passwordHash,
          firstName: null,
          lastName: null,
          timezone: 'UTC',
          verificationToken: userData.verificationToken,
        },
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-1',
        email: email,
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        level: 1,
        xp: 0,
        timezone: 'UTC',
        preferences: {},
        isVerified: true,
        verificationToken: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail(email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const email = 'notfound@example.com';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        level: 1,
        xp: 0,
        timezone: 'UTC',
        preferences: {},
        isVerified: true,
        verificationToken: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findById(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('verifyUser', () => {
    it('should verify user successfully', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        level: 1,
        xp: 0,
        timezone: 'UTC',
        preferences: {},
        isVerified: true,
        verificationToken: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await userRepository.verifyUser(userId);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          isVerified: true,
          verificationToken: null,
        },
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userId = 'user-1';
      const newPasswordHash = 'newHashedPassword';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        passwordHash: newPasswordHash,
        firstName: 'John',
        lastName: 'Doe',
        level: 1,
        xp: 0,
        timezone: 'UTC',
        preferences: {},
        isVerified: true,
        verificationToken: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await userRepository.updatePassword(userId, newPasswordHash);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-1';
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        timezone: 'America/New_York',
        preferences: { theme: 'dark' },
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        level: 1,
        xp: 0,
        timezone: profileData.timezone,
        preferences: profileData.preferences,
        isVerified: true,
        verificationToken: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await userRepository.updateProfile(userId, profileData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          timezone: profileData.timezone,
          preferences: profileData.preferences,
        },
      });

      expect(result).toEqual(mockUser);
    });
  });
});