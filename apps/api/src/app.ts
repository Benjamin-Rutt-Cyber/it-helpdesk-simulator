import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { checkDatabaseHealth, initializeDatabase } from './config/database';
import { env } from './config/environment';
import { setupSwagger } from './config/swagger';
import { initializeRedis, checkRedisHealth } from './config/redis';
import { initializeSocket } from './config/socket';
import { setupChatHandlers } from './sockets/chatHandler';
import { setupSessionHandlers } from './sockets/sessionHandler';
import { generalRateLimiter, authRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth';
import scenarioRoutes from './routes/scenarios';
import sessionRoutes from './routes/sessions';
import userRoutes from './routes/users';
import chatRoutes from './routes/chat';
import aiRoutes from './routes/ai';
import { contextRoutes } from './routes/contextRoutes';
import { analyticsRoutes } from './routes/analyticsRoutes';
import { searchRoutes } from './routes/searchRoutes';
import { contentRoutes } from './routes/contentRoutes';
import researchRoutes from './routes/researchRoutes';
import searchIntegrationRoutes from './routes/searchIntegrationRoutes';
import citationRoutes from './routes/citationRoutes';
import workflowRoutes from './routes/workflowRoutes';
import sessionManagerRoutes from './routes/sessionRoutes';
import documentationRoutes from './routes/documentationRoutes';

const app = express();
const PORT = env.PORT;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging middleware
app.use(requestLogger);

// Rate limiting with Redis-backed store
app.use('/api/v1/auth', authRateLimiter);
app.use('/api/v1', generalRateLimiter);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Swagger documentation
setupSwagger(app);

// API routes with versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scenarios', scenarioRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/context', contextRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/search', searchIntegrationRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/research', researchRoutes);
app.use('/api/v1/citations', citationRoutes);
app.use('/api/v1/workflow', workflowRoutes);
app.use('/api/v1/session-manager', sessionManagerRoutes);
app.use('/api/v1/documentation', documentationRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and its dependencies
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const overallStatus = dbHealth.status === 'healthy' ? 'OK' : 'ERROR';
    
    res.status(dbHealth.status === 'healthy' ? 200 : 503).json({ 
      success: dbHealth.status === 'healthy',
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'IT Helpdesk Simulator API',
      database: dbHealth
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'IT Helpdesk Simulator API',
      error: 'Health check failed'
    });
  }
});

// API status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    res.json({
      success: true,
      status: 'OK',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      service: 'IT Helpdesk Simulator API',
      environment: env.NODE_ENV,
      database: dbHealth,
      endpoints: {
        auth: '/api/v1/auth',
        scenarios: '/api/v1/scenarios',
        sessions: '/api/v1/sessions',
        users: '/api/v1/users',
        ai: '/api/v1/ai',
        context: '/api/v1/context',
        analytics: '/api/v1/analytics',
        search: '/api/v1/search',
        content: '/api/v1/content',
        research: '/api/v1/research',
        documentation: '/api/v1/documentation',
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'IT Helpdesk Simulator API',
      error: 'Status check failed'
    });
  }
});

// Database health check endpoint
app.get('/health/database', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
      success: dbHealth.status === 'healthy',
      ...dbHealth
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Database health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'IT Helpdesk Simulator API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await initializeRedis(); // Initialize Redis (non-blocking)
    
    // Initialize Socket.IO and get HTTP server
    const httpServer = await initializeSocket(app);
    
    // Import and set up socket handlers
    const { getSocketIO } = await import('./config/socket');
    const io = getSocketIO();
    
    // Set up socket event handlers
    setupChatHandlers(io);
    setupSessionHandlers(io);
    
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.IO server initialized on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;