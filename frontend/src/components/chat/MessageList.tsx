import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { MessageBubble } from './MessageBubble';

export const MessageList: React.FC = () => {
  const { user } = useAuth();
  const { messages, currentChat, loadMessages, isLoading } = useChat();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (currentChat) {
      setPage(1);
      setHasMore(true);
    }
  }, [currentChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container || !currentChat || isLoadingMore || !hasMore) return;

    if (container.scrollTop === 0) {
      setIsLoadingMore(true);
      const prevScrollHeight = container.scrollHeight;
      
      try {
        const nextPage = page + 1;
        await loadMessages(currentChat.id, nextPage);
        
        if (messages.length === 0) {
          setHasMore(false);
        } else {
          setPage(nextPage);
          
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
          }, 100);
        }
      } catch (error) {
        console.error('Failed to load more messages:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const groupMessagesByDate = () => {
    const grouped: { [key: string]: typeof messages } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    return grouped;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const groupedMessages = groupMessagesByDate();

  if (!currentChat) {
    return null;
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={handleScroll}
    >
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      )}
      
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date Header */}
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
              {formatDateHeader(date)}
            </span>
          </div>
          
          {/* Messages for this date */}
          <div className="space-y-2">
            {dateMessages.map((message, index) => {
              const isOwn = message.sender.id === user?.id;
              const prevMessage = index > 0 ? dateMessages[index - 1] : null;
              const nextMessage = index < dateMessages.length - 1 ? dateMessages[index + 1] : null;

              const showAvatar = !isOwn && (
                !nextMessage ||
                nextMessage.sender.id !== message.sender.id ||
                new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 300000 // 5 minutes
              );

              const showSender = !isOwn && (
                !prevMessage ||
                prevMessage.sender.id !== message.sender.id ||
                new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000 // 5 minutes
              );

              const isConsecutive = prevMessage &&
                prevMessage.sender.id === message.sender.id &&
                new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 300000; // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showSender={showSender}
                  isConsecutive={!!isConsecutive}
                />
              );
            })}
          </div>
        </div>
      ))}
      
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="w-16 h-16 mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-center">
            No messages yet. Start the conversation!
          </p>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
