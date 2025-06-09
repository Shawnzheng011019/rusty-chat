import React from 'react';
import { ChatLayout } from '../components/chat/ChatLayout';
import { ChatProvider } from '../contexts/ChatContext';

export const ChatPage: React.FC = () => {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
};
