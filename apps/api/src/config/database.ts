import { Pool, PoolClient } from 'pg';
import { env } from './environment';

export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

export const databaseConfig: DatabaseConfig = {
  url: env.DATABASE_URL,
  maxConnections: 10,
  connectionTimeout: 5000,
};

// PostgreSQL connection pool
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: databaseConfig.maxConnections,
  connectionTimeoutMillis: databaseConfig.connectionTimeout,
});

// Database connection helper
export async function getDbConnection(): Promise<PoolClient> {
  return pool.connect();
}

// Basic database health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  
  if (!env.DATABASE_URL) {
    return {
      status: 'unhealthy',
      message: 'DATABASE_URL environment variable is not configured',
      timestamp,
    };
  }

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      timestamp,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp,
    };
  }
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  const client = await getDbConnection();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        timezone VARCHAR(50) DEFAULT 'UTC',
        preferences JSONB DEFAULT '{}',
        is_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}