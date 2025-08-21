import { Server } from 'socket.io';
import { createServer } from 'http';
import { Socket as ClientSocket, io as Client } from 'socket.io-client';
import { setupChatHandlers } from '../../sockets/chatHandler';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/authService';

// Mock dependencies
jest.mock('../../services/chatService');
jest.mock('../../services/authService');

const mockedChatService = chatService as jest.Mocked<typeof chatService>;
const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('Chat Handler', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: ClientSocket;
  let httpServer: any;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    
    // Setup chat handlers
    setupChatHandlers(io);
    
    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach((done) => {
    // Mock auth service to return valid user
    mockedAuthService.validateToken.mockResolvedValue({
      userId: 'test-user-id',
      email: 'test@example.com'
    });

    // Create client socket
    clientSocket = Client(`http://localhost:${port}`, {
      auth: {
        token: 'valid-token'
      }
    });

    // Get server socket
    io.on('connection', (socket) => {
      serverSocket = socket;
    });

    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.close();
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate valid token', (done) => {
      expect(mockedAuthService.validateToken).toHaveBeenCalledWith('valid-token');
      done();
    });

    it('should reject invalid token', (done) => {
      const invalidClient = Client(`http://localhost:${port}`, {
        auth: {
          token: 'invalid-token'
        }
      });

      mockedAuthService.validateToken.mockRejectedValue(new Error('Invalid token'));

      invalidClient.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication failed');
        invalidClient.close();
        done();
      });
    });

    it('should reject connection without token', (done) => {
      const noTokenClient = Client(`http://localhost:${port}`);

      noTokenClient.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication required');
        noTokenClient.close();
        done();
      });
    });
  });

  describe('Session Management', () => {
    it('should join session successfully', (done) => {
      const sessionId = 'test-session-id';
      
      // Mock message history
      mockedChatService.getRecentMessages.mockResolvedValue([
        {
          id: 'msg1',
          sessionId,
          senderType: 'ai',
          content: 'Welcome!',
          timestamp: new Date(),
          metadata: {}
        }
      ]);

      clientSocket.emit('join_session', { sessionId });

      clientSocket.on('session_joined', (data) => {
        expect(data.sessionId).toBe(sessionId);
        done();
      });
    });

    it('should load message history on join', (done) => {
      const sessionId = 'test-session-id';
      const mockMessages = [
        {
          id: 'msg1',
          sessionId,
          senderType: 'ai',
          content: 'Welcome!',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      mockedChatService.getRecentMessages.mockResolvedValue(mockMessages);

      clientSocket.emit('join_session', { sessionId });

      clientSocket.on('message_history', (messages) => {
        expect(messages).toEqual(mockMessages);
        expect(mockedChatService.getRecentMessages).toHaveBeenCalledWith(sessionId, 50);
        done();
      });
    });

    it('should handle join session errors', (done) => {
      clientSocket.emit('join_session', { sessionId: '' });

      clientSocket.on('error', (error) => {
        expect(error.message).toBe('Session ID is required');
        done();
      });
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      // Join session first
      clientSocket.emit('join_session', { sessionId: 'test-session' });
    });

    it('should send message successfully', (done) => {
      const mockMessage = {
        id: 'msg1',
        sessionId: 'test-session',
        senderType: 'user' as const,
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      mockedChatService.saveMessage.mockResolvedValue(mockMessage);

      clientSocket.emit('send_message', {
        sessionId: 'test-session',
        senderType: 'user',
        content: 'Hello!'
      });

      clientSocket.on('message_sent', (data) => {
        expect(data.id).toBe('msg1');
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    it('should broadcast message to session', (done) => {
      const mockMessage = {
        id: 'msg1',
        sessionId: 'test-session',
        senderType: 'user' as const,
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      mockedChatService.saveMessage.mockResolvedValue(mockMessage);

      // Create second client in same session
      const secondClient = Client(`http://localhost:${port}`, {
        auth: { token: 'valid-token' }
      });

      secondClient.on('connect', () => {
        secondClient.emit('join_session', { sessionId: 'test-session' });
        
        secondClient.on('message_received', (message) => {
          expect(message.content).toBe('Hello!');
          secondClient.close();
          done();
        });

        // Send message from first client
        clientSocket.emit('send_message', {
          sessionId: 'test-session',
          senderType: 'user',
          content: 'Hello!'
        });
      });
    });

    it('should handle message sending errors', (done) => {
      clientSocket.emit('send_message', {
        sessionId: 'test-session',
        senderType: 'user',
        content: '' // Empty content
      });

      clientSocket.on('error', (error) => {
        expect(error.message).toBe('Session ID and content are required');
        done();
      });
    });

    it('should require authentication for message sending', (done) => {
      // Clear authentication data
      serverSocket.data.userId = null;

      clientSocket.emit('send_message', {
        sessionId: 'test-session',
        senderType: 'user',
        content: 'Hello!'
      });

      clientSocket.on('error', (error) => {
        expect(error.message).toBe('User not authenticated');
        done();
      });
    });
  });

  describe('Typing Indicators', () => {
    beforeEach(() => {
      clientSocket.emit('join_session', { sessionId: 'test-session' });
    });

    it('should broadcast typing status', (done) => {
      const secondClient = Client(`http://localhost:${port}`, {
        auth: { token: 'valid-token' }
      });

      secondClient.on('connect', () => {
        secondClient.emit('join_session', { sessionId: 'test-session' });
        
        secondClient.on('typing_status', (data) => {
          expect(data.isTyping).toBe(true);
          secondClient.close();
          done();
        });

        // Send typing indicator from first client
        clientSocket.emit('typing', {
          sessionId: 'test-session',
          isTyping: true
        });
      });
    });

    it('should handle typing errors', (done) => {
      clientSocket.emit('typing', {
        sessionId: '', // Empty session ID
        isTyping: true
      });

      clientSocket.on('error', (error) => {
        expect(error.message).toBe('Session ID is required');
        done();
      });
    });
  });

  describe('Message History', () => {
    beforeEach(() => {
      clientSocket.emit('join_session', { sessionId: 'test-session' });
    });

    it('should load message history', (done) => {
      const mockMessages = [
        {
          id: 'msg1',
          sessionId: 'test-session',
          senderType: 'user' as const,
          content: 'Hello!',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      mockedChatService.loadMessageHistory.mockResolvedValue(mockMessages);

      clientSocket.emit('load_message_history', {
        sessionId: 'test-session',
        limit: 20
      });

      clientSocket.on('message_history_loaded', (data) => {
        expect(data.messages).toEqual(mockMessages);
        expect(data.hasMore).toBe(false);
        done();
      });
    });

    it('should search messages', (done) => {
      const mockMessages = [
        {
          id: 'msg1',
          sessionId: 'test-session',
          senderType: 'user' as const,
          content: 'Hello world!',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      mockedChatService.searchMessages.mockResolvedValue(mockMessages);

      clientSocket.emit('search_messages', {
        sessionId: 'test-session',
        query: 'hello'
      });

      clientSocket.on('message_search_results', (data) => {
        expect(data.messages).toEqual(mockMessages);
        expect(data.query).toBe('hello');
        done();
      });
    });
  });

  describe('Message Status', () => {
    beforeEach(() => {
      clientSocket.emit('join_session', { sessionId: 'test-session' });
    });

    it('should mark message as delivered', (done) => {
      mockedChatService.markMessageAsDelivered.mockResolvedValue(true);

      clientSocket.emit('mark_message_delivered', {
        messageId: 'msg1'
      });

      clientSocket.on('message_delivery_confirmed', (data) => {
        expect(data.messageId).toBe('msg1');
        done();
      });
    });

    it('should mark message as read', (done) => {
      mockedChatService.markMessageAsRead.mockResolvedValue(true);

      clientSocket.emit('mark_message_read', {
        messageId: 'msg1'
      });

      clientSocket.on('message_read_confirmed', (data) => {
        expect(data.messageId).toBe('msg1');
        done();
      });
    });
  });

  describe('Connection Management', () => {
    it('should handle user joined event', (done) => {
      const secondClient = Client(`http://localhost:${port}`, {
        auth: { token: 'valid-token' }
      });

      clientSocket.emit('join_session', { sessionId: 'test-session' });

      clientSocket.on('user_joined', (data) => {
        expect(data.socketId).toBeDefined();
        secondClient.close();
        done();
      });

      secondClient.on('connect', () => {
        secondClient.emit('join_session', { sessionId: 'test-session' });
      });
    });

    it('should handle user disconnected event', (done) => {
      const secondClient = Client(`http://localhost:${port}`, {
        auth: { token: 'valid-token' }
      });

      clientSocket.emit('join_session', { sessionId: 'test-session' });

      clientSocket.on('user_disconnected', (data) => {
        expect(data.socketId).toBeDefined();
        done();
      });

      secondClient.on('connect', () => {
        secondClient.emit('join_session', { sessionId: 'test-session' });
        setTimeout(() => {
          secondClient.close();
        }, 100);
      });
    });
  });
});