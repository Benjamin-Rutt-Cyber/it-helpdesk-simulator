import { Server } from 'socket.io';
import { createServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { env } from './environment';
import { logger } from '../utils/logger';
import { TypingHandler } from '../sockets/typingHandler';

let io: Server;
let redisClient: ReturnType<typeof createClient>;
let redisSubClient: ReturnType<typeof createClient>;
let typingHandler: TypingHandler;

export const initializeSocket = async (app: any) => {
  try {
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Initialize Socket.IO
    io = new Server(httpServer, {
      cors: {
        origin: env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Set up Redis adapter for clustering
    if (env.REDIS_URL && env.NODE_ENV !== 'test') {
      redisClient = createClient({ url: env.REDIS_URL });
      redisSubClient = redisClient.duplicate();
      
      await redisClient.connect();
      await redisSubClient.connect();
      
      io.adapter(createAdapter(redisClient, redisSubClient));
      logger.info('Socket.IO Redis adapter initialized');
    }

    // Initialize typing handler
    typingHandler = new TypingHandler(io);
    
    // Connection event handlers
    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      // Set up typing handler for this connection
      typingHandler.handleConnection(socket);
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });
    });

    logger.info('Socket.IO server initialized');
    return httpServer;
  } catch (error) {
    logger.error('Failed to initialize Socket.IO:', error);
    throw error;
  }
};

export const getSocketIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

export const getTypingHandler = (): TypingHandler => {
  if (!typingHandler) {
    throw new Error('TypingHandler not initialized. Call initializeSocket first.');
  }
  return typingHandler;
};

export const closeSocket = async () => {
  if (typingHandler) {
    await typingHandler.cleanup();
  }
  if (io) {
    io.close();
  }
  if (redisClient) {
    await redisClient.quit();
  }
  if (redisSubClient) {
    await redisSubClient.quit();
  }
};