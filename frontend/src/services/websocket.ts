import { WebSocketMessage, Message, TypingIndicator } from '../types';

export type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.warn('No access token found, cannot connect to WebSocket');
      this.isConnecting = false;
      return;
    }

    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3000').replace('http', 'ws') + '/ws';

    this.socket = new WebSocket(wsUrl);
    this.setupEventListeners();
    this.isConnecting = false;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', null);

      // Authenticate after connection
      const token = localStorage.getItem('access_token');
      if (token) {
        this.authenticate(token);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.emit('disconnected', { code: event.code, reason: event.reason });

      if (event.code !== 1000) { // Not a normal closure
        this.handleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleReconnect();
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.message_type) {
      case 'new_message':
        this.emit('new_message', message.data);
        break;
      case 'typing_indicator':
        this.emit('typing_indicator', message.data);
        break;
      case 'user_online':
        this.emit('user_online', message.data);
        break;
      case 'user_offline':
        this.emit('user_offline', message.data);
        break;
      case 'friend_request':
        this.emit('friend_request', message.data);
        break;
      case 'friend_request_accepted':
        this.emit('friend_request_accepted', message.data);
        break;
      case 'group_invitation':
        this.emit('group_invitation', message.data);
        break;
      case 'group_member_added':
        this.emit('group_member_added', message.data);
        break;
      case 'group_member_removed':
        this.emit('group_member_removed', message.data);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.message_type);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached', null);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  public on(event: string, handler: WebSocketEventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: WebSocketEventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  private sendWebSocketMessage(type: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        message_type: type,
        data: data
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  public sendMessage(message: any) {
    this.sendWebSocketMessage('send_message', message);
  }

  public sendTypingIndicator(chatId: string, isTyping: boolean) {
    this.sendWebSocketMessage('typing_indicator', {
      chat_id: chatId,
      is_typing: isTyping
    });
  }

  public joinChat(chatId: string) {
    this.sendWebSocketMessage('join_chat', { chat_id: chatId });
  }

  public leaveChat(chatId: string) {
    this.sendWebSocketMessage('leave_chat', { chat_id: chatId });
  }

  public authenticate(token: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage('authenticate', { token });
    } else {
      localStorage.setItem('access_token', token);
      this.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN || false;
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

export const wsService = new WebSocketService();
export default wsService;
