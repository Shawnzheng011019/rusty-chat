import React, { useEffect, useRef } from 'react';
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  InformationCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const { currentChat, typingUsers } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  if (!currentChat) {
    return null;
  }

  const chatTypingUsers = typingUsers.filter(
    t => t.chat_id === currentChat.id && t.user_id !== user?.id
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {currentChat.avatar_url ? (
              <img
                src={currentChat.avatar_url}
                alt={currentChat.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {currentChat.type === 'group' ? (
                  <UserGroupIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {currentChat.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
            
            {currentChat.type === 'direct' && currentChat.participants[0]?.is_online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            )}
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-900">{currentChat.name}</h2>
            <p className="text-sm text-gray-500">
              {currentChat.type === 'group' 
                ? `${currentChat.participants.length} members`
                : currentChat.participants[0]?.is_online 
                  ? 'Online' 
                  : 'Offline'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Voice call"
          >
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Video call"
          >
            <VideoCameraIcon className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Chat info"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <MessageList />
        
        {/* Typing Indicator */}
        {chatTypingUsers.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-500">
                {chatTypingUsers.length === 1
                  ? `${chatTypingUsers[0].username} is typing...`
                  : `${chatTypingUsers.length} people are typing...`
                }
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  );
};
