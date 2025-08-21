import { createClient, RedisClientType } from 'redis';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { ChatMessage } from '../sockets/chatHandler';

export interface QueuedMessage {
  id: string;
  sessionId: string;
  message: ChatMessage;
  attempts: number;
  createdAt: Date;
  nextRetry?: Date;
}

export interface MessageQueue {
  pending: string; // Queue for pending messages
  failed: string; // Queue for failed messages
  processing: string; // Queue for messages being processed
}

export class MessageQueueService {
  private redis: RedisClientType;
  private queues: MessageQueue = {
    pending: 'chat:queue:pending',
    failed: 'chat:queue:failed',
    processing: 'chat:queue:processing',
  };
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.redis = createClient({ url: env.REDIS_URL });
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      await this.redis.connect();
      logger.info('Message queue Redis client connected');
    } catch (error) {
      logger.error('Failed to connect to Redis for message queue:', error);
    }
  }

  async queueMessage(message: ChatMessage): Promise<string> {
    try {
      const queuedMessage: QueuedMessage = {
        id: this.generateQueueId(),
        sessionId: message.sessionId,
        message,
        attempts: 0,
        createdAt: new Date(),
      };

      await this.redis.lPush(this.queues.pending, JSON.stringify(queuedMessage));
      logger.info(`Message queued: ${queuedMessage.id}`);
      return queuedMessage.id;
    } catch (error) {
      logger.error('Error queuing message:', error);
      throw new Error('Failed to queue message');
    }
  }

  async processQueuedMessages(): Promise<void> {
    try {
      while (true) {
        // Move message from pending to processing
        const messageData = await this.redis.brPop(
          this.queues.pending, 
          5 // 5 second timeout
        );

        if (!messageData) {
          continue; // No messages to process
        }

        const queuedMessage: QueuedMessage = JSON.parse(messageData.element);
        
        try {
          // Move to processing queue
          await this.redis.lPush(this.queues.processing, JSON.stringify(queuedMessage));
          
          // Process the message
          await this.processMessage(queuedMessage);
          
          // Remove from processing queue on success
          await this.redis.lRem(this.queues.processing, 1, JSON.stringify(queuedMessage));
          
          logger.info(`Message processed successfully: ${queuedMessage.id}`);
        } catch (error) {
          logger.error(`Error processing message ${queuedMessage.id}:`, error);
          
          // Remove from processing queue
          await this.redis.lRem(this.queues.processing, 1, JSON.stringify(queuedMessage));
          
          // Handle retry logic
          await this.handleFailedMessage(queuedMessage);
        }
      }
    } catch (error) {
      logger.error('Error in message queue processing:', error);
      // Restart processing after a delay
      setTimeout(() => this.processQueuedMessages(), 5000);
    }
  }

  private async processMessage(queuedMessage: QueuedMessage): Promise<void> {
    // This is where you would actually deliver the message
    // For now, we'll simulate processing
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Simulated delivery failure'));
        }
      }, 100);
    });
  }

  private async handleFailedMessage(queuedMessage: QueuedMessage): Promise<void> {
    queuedMessage.attempts++;
    
    if (queuedMessage.attempts >= this.maxRetries) {
      // Move to failed queue
      await this.redis.lPush(this.queues.failed, JSON.stringify(queuedMessage));
      logger.error(`Message permanently failed: ${queuedMessage.id}`);
    } else {
      // Schedule retry
      const delay = this.retryDelay * Math.pow(2, queuedMessage.attempts - 1); // Exponential backoff
      queuedMessage.nextRetry = new Date(Date.now() + delay);
      
      setTimeout(async () => {
        await this.redis.lPush(this.queues.pending, JSON.stringify(queuedMessage));
        logger.info(`Message requeued for retry: ${queuedMessage.id}, attempt ${queuedMessage.attempts}`);
      }, delay);
    }
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
  }> {
    try {
      const [pending, processing, failed] = await Promise.all([
        this.redis.lLen(this.queues.pending),
        this.redis.lLen(this.queues.processing),
        this.redis.lLen(this.queues.failed),
      ]);

      return { pending, processing, failed };
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      return { pending: 0, processing: 0, failed: 0 };
    }
  }

  async retryFailedMessages(): Promise<number> {
    try {
      let retriedCount = 0;
      const failedMessages = await this.redis.lRange(this.queues.failed, 0, -1);
      
      for (const messageData of failedMessages) {
        const queuedMessage: QueuedMessage = JSON.parse(messageData);
        
        // Reset attempts and requeue
        queuedMessage.attempts = 0;
        await this.redis.lPush(this.queues.pending, JSON.stringify(queuedMessage));
        await this.redis.lRem(this.queues.failed, 1, messageData);
        
        retriedCount++;
      }
      
      logger.info(`Retried ${retriedCount} failed messages`);
      return retriedCount;
    } catch (error) {
      logger.error('Error retrying failed messages:', error);
      return 0;
    }
  }

  async clearQueue(queueName: keyof MessageQueue): Promise<number> {
    try {
      const count = await this.redis.lLen(this.queues[queueName]);
      await this.redis.del(this.queues[queueName]);
      logger.info(`Cleared ${count} messages from ${queueName} queue`);
      return count;
    } catch (error) {
      logger.error(`Error clearing ${queueName} queue:`, error);
      return 0;
    }
  }

  async getSessionOfflineMessages(sessionId: string): Promise<QueuedMessage[]> {
    try {
      const allQueues = [this.queues.pending, this.queues.processing, this.queues.failed];
      const sessionMessages: QueuedMessage[] = [];
      
      for (const queueName of allQueues) {
        const messages = await this.redis.lRange(queueName, 0, -1);
        
        for (const messageData of messages) {
          const queuedMessage: QueuedMessage = JSON.parse(messageData);
          if (queuedMessage.sessionId === sessionId) {
            sessionMessages.push(queuedMessage);
          }
        }
      }
      
      return sessionMessages;
    } catch (error) {
      logger.error('Error getting session offline messages:', error);
      return [];
    }
  }

  private generateQueueId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Message queue Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting message queue Redis client:', error);
    }
  }
}

export const messageQueueService = new MessageQueueService();

// Start processing messages
messageQueueService.processQueuedMessages().catch(error => {
  logger.error('Message queue processing failed:', error);
});