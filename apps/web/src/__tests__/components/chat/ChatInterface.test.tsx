import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../../../components/chat/ChatInterface';
import { useChatStore } from '../../../stores/chatStore';
import { ChatMessage } from '../../../hooks/useSocket';

// Mock the chat store
jest.mock('../../../stores/chatStore');

const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>;

describe('ChatInterface', () => {
  const mockChatStore = {
    isConnected: true,
    isReconnecting: false,
    getMessagesBySession: jest.fn(),
    getTypingUsers: jest.fn(),
  };

  beforeEach(() => {
    mockUseChatStore.mockReturnValue(mockChatStore as any);
    mockChatStore.getMessagesBySession.mockReturnValue([]);
    mockChatStore.getTypingUsers.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render chat interface with title', () => {
    render(<ChatInterface sessionId="test-session" title="Test Chat" />);
    
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    render(<ChatInterface sessionId="test-session" />);
    
    expect(screen.getByText('Start a conversation to begin your IT support session')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('should display messages', () => {
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg1',
        sessionId: 'test-session',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      },
      {
        id: 'msg2',
        sessionId: 'test-session',
        senderType: 'ai',
        content: 'Hi there!',
        timestamp: new Date(),
        metadata: {}
      }
    ];

    mockChatStore.getMessagesBySession.mockReturnValue(mockMessages);

    render(<ChatInterface sessionId="test-session" />);
    
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should show typing indicator', () => {
    const mockTypingUsers = [
      { socketId: 'socket1', isTyping: true, timestamp: new Date() }
    ];

    mockChatStore.getTypingUsers.mockReturnValue(mockTypingUsers);

    render(<ChatInterface sessionId="test-session" />);
    
    expect(screen.getByText('IT Support Agent is typing...')).toBeInTheDocument();
  });

  it('should show reconnecting status', () => {
    mockChatStore.isConnected = false;
    mockChatStore.isReconnecting = true;

    render(<ChatInterface sessionId="test-session" />);
    
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('should show disconnected status', () => {
    mockChatStore.isConnected = false;
    mockChatStore.isReconnecting = false;

    render(<ChatInterface sessionId="test-session" />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should call onSendMessage when message is sent', () => {
    const mockOnSendMessage = jest.fn();

    render(
      <ChatInterface 
        sessionId="test-session" 
        onSendMessage={mockOnSendMessage}
      />
    );
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('should call onStartTyping when typing starts', () => {
    const mockOnStartTyping = jest.fn();

    render(
      <ChatInterface 
        sessionId="test-session" 
        onStartTyping={mockOnStartTyping}
      />
    );
    
    const input = screen.getByPlaceholderText('Type your message...');

    fireEvent.change(input, { target: { value: 'T' } });

    expect(mockOnStartTyping).toHaveBeenCalled();
  });

  it('should disable input when not connected', () => {
    mockChatStore.isConnected = false;

    render(<ChatInterface sessionId="test-session" />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should scroll to bottom when new messages arrive', async () => {
    const mockScrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    const { rerender } = render(<ChatInterface sessionId="test-session" />);

    const newMessages: ChatMessage[] = [
      {
        id: 'msg1',
        sessionId: 'test-session',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      }
    ];

    mockChatStore.getMessagesBySession.mockReturnValue(newMessages);

    rerender(<ChatInterface sessionId="test-session" />);

    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  it('should handle message timestamps correctly', () => {
    const timestamp = new Date('2023-01-01T10:30:00Z');
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg1',
        sessionId: 'test-session',
        senderType: 'user',
        content: 'Hello!',
        timestamp,
        metadata: {}
      }
    ];

    mockChatStore.getMessagesBySession.mockReturnValue(mockMessages);

    render(<ChatInterface sessionId="test-session" />);
    
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it('should handle message metadata', () => {
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg1',
        sessionId: 'test-session',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: { delivered: true, read: true }
      }
    ];

    mockChatStore.getMessagesBySession.mockReturnValue(mockMessages);

    render(<ChatInterface sessionId="test-session" />);
    
    // Check for delivery/read indicators
    expect(screen.getByText('✓✓')).toBeInTheDocument();
  });

  it('should handle error metadata', () => {
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg1',
        sessionId: 'test-session',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: { error: 'Failed to send' }
      }
    ];

    mockChatStore.getMessagesBySession.mockReturnValue(mockMessages);

    render(<ChatInterface sessionId="test-session" />);
    
    // Check for error indicator
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});