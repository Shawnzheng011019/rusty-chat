import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Message, Chat, TypingIndicator, SendMessageRequest } from '../types';
import { apiClient } from '../services/api';
import { wsService } from '../services/websocket';
import { useAuth } from './AuthContext';

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  typingUsers: TypingIndicator[];
  isLoading: boolean;
  setCurrentChat: (chat: Chat | null) => void;
  sendMessage: (message: SendMessageRequest) => Promise<void>;
  loadMessages: (chatId: string, page?: number) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChatState] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setupWebSocketListeners();
      refreshChats();
    }

    return () => {
      cleanupWebSocketListeners();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.id);
      wsService.joinChat(currentChat.id);
    }

    return () => {
      if (currentChat) {
        wsService.leaveChat(currentChat.id);
      }
    };
  }, [currentChat]);

  const setupWebSocketListeners = () => {
    wsService.on('new_message', handleNewMessage);
    wsService.on('typing_indicator', handleTypingIndicator);
    wsService.on('user_online', handleUserOnline);
    wsService.on('user_offline', handleUserOffline);
  };

  const cleanupWebSocketListeners = () => {
    wsService.off('new_message', handleNewMessage);
    wsService.off('typing_indicator', handleTypingIndicator);
    wsService.off('user_online', handleUserOnline);
    wsService.off('user_offline', handleUserOffline);
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => {
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });

    setChats(prev => prev.map(chat => {
      if (chat.id === message.chat_id) {
        return {
          ...chat,
          last_message: message,
          unread_count: currentChat?.id === chat.id ? 0 : chat.unread_count + 1
        };
      }
      return chat;
    }));
  };

  const handleTypingIndicator = (indicator: TypingIndicator) => {
    if (indicator.user_id === user?.id) return;

    setTypingUsers(prev => {
      const filtered = prev.filter(t => 
        t.user_id !== indicator.user_id || t.chat_id !== indicator.chat_id
      );

      if (indicator.is_typing) {
        return [...filtered, indicator];
      }
      return filtered;
    });

    if (indicator.is_typing) {
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(t => 
          t.user_id !== indicator.user_id || t.chat_id !== indicator.chat_id
        ));
      }, 3000);
    }
  };

  const handleUserOnline = (data: { user_id: string }) => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      participants: chat.participants.map(participant => 
        participant.id === data.user_id 
          ? { ...participant, is_online: true }
          : participant
      )
    })));
  };

  const handleUserOffline = (data: { user_id: string }) => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      participants: chat.participants.map(participant => 
        participant.id === data.user_id 
          ? { ...participant, is_online: false }
          : participant
      )
    })));
  };

  const setCurrentChat = (chat: Chat | null) => {
    if (currentChat) {
      wsService.leaveChat(currentChat.id);
    }
    
    setCurrentChatState(chat);
    setMessages([]);
    setTypingUsers([]);

    if (chat) {
      wsService.joinChat(chat.id);
      setChats(prev => prev.map(c => 
        c.id === chat.id ? { ...c, unread_count: 0 } : c
      ));
    }
  };

  const sendMessage = async (messageData: SendMessageRequest) => {
    try {
      const message = await apiClient.sendMessage(messageData);
      wsService.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const loadMessages = async (chatId: string, page: number = 1) => {
    try {
      setIsLoading(true);
      const newMessages = await apiClient.getMessages(chatId, page);
      
      if (page === 1) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTypingIndicator = (isTyping: boolean) => {
    if (currentChat) {
      wsService.sendTypingIndicator(currentChat.id, isTyping);
    }
  };

  const refreshChats = async () => {
    try {
      setIsLoading(true);
      const [friends, groups] = await Promise.all([
        apiClient.getFriends(),
        apiClient.getGroups()
      ]);

      const friendChats: Chat[] = friends
        .filter(friend => friend.status === 'accepted')
        .map(friend => ({
          id: friend.user.id,
          name: friend.user.username,
          type: 'direct' as const,
          avatar_url: friend.user.avatar_url,
          participants: [{
            ...friend.user,
            created_at: new Date().toISOString() // Add missing created_at field
          }],
          unread_count: 0,
        }));

      const groupChats: Chat[] = groups.map(group => ({
        id: group.id,
        name: group.name,
        type: 'group' as const,
        avatar_url: group.avatar_url,
        participants: [],
        unread_count: 0,
      }));

      setChats([...friendChats, ...groupChats]);
    } catch (error) {
      console.error('Failed to refresh chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: ChatContextType = {
    chats,
    currentChat,
    messages,
    typingUsers,
    isLoading,
    setCurrentChat,
    sendMessage,
    loadMessages,
    sendTypingIndicator,
    refreshChats,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
