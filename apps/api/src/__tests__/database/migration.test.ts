import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Database Migration Tests', () => {
  describe('Prisma Schema Validation', () => {
    it('should have valid Prisma schema file', () => {
      const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
      expect(fs.existsSync(schemaPath)).toBe(true);
      
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      expect(schemaContent).toContain('model User');
      expect(schemaContent).toContain('model Scenario');
      expect(schemaContent).toContain('model UserSession');
      expect(schemaContent).toContain('model PerformanceMetric');
    });

    it('should have valid datasource configuration', () => {
      const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      
      expect(schemaContent).toContain('datasource db');
      expect(schemaContent).toContain('provider = "postgresql"');
      expect(schemaContent).toContain('url = env("DATABASE_URL")');
    });

    it('should have valid generator configuration', () => {
      const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      
      expect(schemaContent).toContain('generator client');
      expect(schemaContent).toContain('provider = "prisma-client-js"');
    });
  });

  describe('Seed Script Validation', () => {
    it('should have valid seed script', () => {
      const seedPath = path.join(__dirname, '../../prisma/seed.ts');
      expect(fs.existsSync(seedPath)).toBe(true);
      
      const seedContent = fs.readFileSync(seedPath, 'utf-8');
      expect(seedContent).toContain('PrismaClient');
      expect(seedContent).toContain('main()');
    });
  });

  describe('Package.json Scripts', () => {
    it('should have database scripts configured', () => {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      expect(packageContent.scripts).toHaveProperty('db:generate');
      expect(packageContent.scripts).toHaveProperty('db:migrate');
      expect(packageContent.scripts).toHaveProperty('db:seed');
    });
  });

  describe('Prisma Client Generation', () => {
    it('should generate Prisma client without errors', () => {
      // This test validates that the schema can generate a client
      try {
        execSync('npx prisma generate', { cwd: process.cwd(), stdio: 'pipe' });
        expect(true).toBe(true);
      } catch (error) {
        console.error('Prisma generate failed:', error);
        throw error;
      }
    });
  });
});