import request from 'supertest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { Socket as ClientSocket, io as Client } from 'socket.io-client';
import app from '../../app';
import { PrismaClient } from '@prisma/client';
import { setupChatHandlers } from '../../sockets/chatHandler';
import { authService } from '../../services/authService';

const prisma = new PrismaClient();

describe('Chat Integration Tests', () => {
  let server: any;
  let io: Server;
  let clientSocket: ClientSocket;
  let authToken: string;
  let userId: string;
  let sessionId: string;
  let port: number;

  beforeAll(async () => {
    // Start server
    server = createServer(app);
    io = new Server(server);
    setupChatHandlers(io);
    
    server.listen(() => {
      port = server.address().port;
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
      },
    });

    userId = user.id;

    // Create test session
    const session = await prisma.userSession.create({
      data: {
        userId,
        scenarioId: 'test-scenario',
        status: 'active',
      },
    });

    sessionId = session.id;

    // Generate auth token
    authToken = await authService.generateToken(userId);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.chatMessage.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
    
    if (clientSocket) {
      clientSocket.close();
    }
    io.close();
    server.close();
  });

  beforeEach((done) => {
    // Create client socket
    clientSocket = Client(`http://localhost:${port}`, {
      auth: {
        token: authToken,
      },
    });

    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.close();
    }
  });

  describe('End-to-End Chat Flow', () => {
    it('should complete full chat flow', async () => {
      // Step 1: Join session
      return new Promise<void>((resolve, reject) => {
        clientSocket.emit('join_session', { sessionId });

        clientSocket.on('session_joined', (data) => {
          expect(data.sessionId).toBe(sessionId);
          
          // Step 2: Send a message
          clientSocket.emit('send_message', {
            sessionId,
            senderType: 'user',
            content: 'Hello, I need help with my computer!',
          });
        });

        clientSocket.on('message_sent', (data) => {
          expect(data.id).toBeDefined();
          expect(data.timestamp).toBeDefined();
          
          // Step 3: Verify message was received
          clientSocket.on('message_received', (message) => {
            expect(message.content).toBe('Hello, I need help with my computer!');
            expect(message.senderType).toBe('user');
            expect(message.sessionId).toBe(sessionId);
            resolve();
          });
        });

        clientSocket.on('error', reject);
      });
    });

    it('should persist messages in database', async () => {
      return new Promise<void>((resolve, reject) => {
        clientSocket.emit('join_session', { sessionId });

        clientSocket.on('session_joined', () => {
          clientSocket.emit('send_message', {
            sessionId,
            senderType: 'user',
            content: 'Test message for persistence',
          });
        });

        clientSocket.on('message_sent', async (data) => {
          try {
            // Verify message was saved to database
            const savedMessage = await prisma.chatMessage.findUnique({
              where: { id: data.id },
            });

            expect(savedMessage).toBeTruthy();
            expect(savedMessage?.messageContent).toBe('Test message for persistence');
            expect(savedMessage?.senderType).toBe('user');
            expect(savedMessage?.sessionId).toBe(sessionId);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        clientSocket.on('error', reject);
      });
    });

    it('should handle multiple clients in same session', async () => {
      return new Promise<void>((resolve, reject) => {
        const secondClient = Client(`http://localhost:${port}`, {
          auth: { token: authToken },
        });

        let messagesReceived = 0;

        const checkComplete = () => {
          messagesReceived++;
          if (messagesReceived === 2) {
            secondClient.close();
            resolve();
          }
        };

        // Both clients join the same session
        clientSocket.emit('join_session', { sessionId });
        secondClient.emit('join_session', { sessionId });

        // Set up message receivers
        clientSocket.on('message_received', (message) => {
          if (message.content === 'Message from first client') {
            checkComplete();
          }
        });

        secondClient.on('message_received', (message) => {
          if (message.content === 'Message from first client') {
            checkComplete();
          }
        });

        // Send message from first client
        clientSocket.on('session_joined', () => {
          clientSocket.emit('send_message', {
            sessionId,
            senderType: 'user',
            content: 'Message from first client',
          });
        });

        setTimeout(() => {
          reject(new Error('Test timeout'));
        }, 5000);
      });
    });

    it('should handle typing indicators', async () => {
      return new Promise<void>((resolve, reject) => {
        const secondClient = Client(`http://localhost:${port}`, {
          auth: { token: authToken },
        });

        clientSocket.emit('join_session', { sessionId });
        secondClient.emit('join_session', { sessionId });

        secondClient.on('typing_status', (data) => {
          expect(data.isTyping).toBe(true);
          secondClient.close();
          resolve();
        });

        clientSocket.on('session_joined', () => {
          clientSocket.emit('typing', {
            sessionId,
            isTyping: true,
          });
        });

        setTimeout(() => {
          reject(new Error('Test timeout'));
        }, 5000);
      });
    });
  });

  describe('REST API Integration', () => {
    it('should retrieve session messages via API', async () => {
      // First send a message via socket
      await new Promise<void>((resolve, reject) => {
        clientSocket.emit('join_session', { sessionId });

        clientSocket.on('session_joined', () => {
          clientSocket.emit('send_message', {
            sessionId,
            senderType: 'user',
            content: 'API test message',
          });
        });

        clientSocket.on('message_sent', () => {
          resolve();
        });

        clientSocket.on('error', reject);
      });

      // Then retrieve via API
      const response = await request(app)
        .get(`/api/v1/chat/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].content).toBe('API test message');
    });

    it('should send message via API', async () => {
      const response = await request(app)
        .post(`/api/v1/chat/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Message sent via API',
          senderType: 'user',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message.content).toBe('Message sent via API');
    });

    it('should search messages via API', async () => {
      // First send a message
      await request(app)
        .post(`/api/v1/chat/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a searchable message',
          senderType: 'user',
        });

      // Then search
      const response = await request(app)
        .get(`/api/v1/chat/sessions/${sessionId}/messages/search`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'searchable' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].content).toBe('This is a searchable message');
    });

    it('should get session stats via API', async () => {
      // Send a few messages first
      await request(app)
        .post(`/api/v1/chat/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'User message 1',
          senderType: 'user',
        });

      await request(app)
        .post(`/api/v1/chat/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'AI response 1',
          senderType: 'ai',
        });

      const response = await request(app)
        .get(`/api/v1/chat/sessions/${sessionId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats.totalMessages).toBeGreaterThan(0);
      expect(response.body.stats.userMessages).toBeGreaterThan(0);
      expect(response.body.stats.aiMessages).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const response = await request(app)
        .get(`/api/v1/chat/sessions/${sessionId}/messages`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should handle invalid session ID', async () => {
      const response = await request(app)
        .get(`/api/v1/chat/sessions/invalid-session-id/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle socket authentication errors', (done) => {
      const unauthenticatedClient = Client(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' },
      });

      unauthenticatedClient.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication failed');
        unauthenticatedClient.close();
        done();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid message sending', async () => {
      const messageCount = 10;
      const messages: any[] = [];

      return new Promise<void>((resolve, reject) => {
        clientSocket.emit('join_session', { sessionId });

        clientSocket.on('session_joined', () => {
          // Send multiple messages rapidly
          for (let i = 0; i < messageCount; i++) {
            clientSocket.emit('send_message', {
              sessionId,
              senderType: 'user',
              content: `Rapid message ${i}`,
            });
          }
        });

        clientSocket.on('message_received', (message) => {
          messages.push(message);
          if (messages.length === messageCount) {
            // Verify all messages were received
            for (let i = 0; i < messageCount; i++) {
              expect(messages[i].content).toBe(`Rapid message ${i}`);
            }
            resolve();
          }
        });

        setTimeout(() => {
          reject(new Error('Performance test timeout'));
        }, 10000);
      });
    }, 15000);

    it('should handle concurrent connections', async () => {
      const clientCount = 5;
      const clients: ClientSocket[] = [];
      const messagesReceived: any[] = [];

      return new Promise<void>((resolve, reject) => {
        // Create multiple clients
        for (let i = 0; i < clientCount; i++) {
          const client = Client(`http://localhost:${port}`, {
            auth: { token: authToken },
          });

          clients.push(client);

          client.on('connect', () => {
            client.emit('join_session', { sessionId });
          });

          client.on('message_received', (message) => {
            messagesReceived.push(message);
            if (messagesReceived.length === clientCount) {
              // Cleanup
              clients.forEach(c => c.close());
              resolve();
            }
          });
        }

        // Send a message from the first client
        setTimeout(() => {
          clients[0].emit('send_message', {
            sessionId,
            senderType: 'user',
            content: 'Concurrent test message',
          });
        }, 1000);

        setTimeout(() => {
          clients.forEach(c => c.close());
          reject(new Error('Concurrent connections test timeout'));
        }, 10000);
      });
    }, 15000);
  });
});