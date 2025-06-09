import React from 'react';
import { 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  SpeakerWaveIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import type { Message, MessageType } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showSender: boolean;
  isConsecutive: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  showSender,
  isConsecutive,
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="w-4 h-4" />;
      case 'video':
        return <VideoCameraIcon className="w-4 h-4" />;
      case 'audio':
        return <SpeakerWaveIcon className="w-4 h-4" />;
      case 'voice':
        return <MicrophoneIcon className="w-4 h-4" />;
      case 'file':
        return <DocumentIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            {message.file && (
              <img
                src={message.file.url}
                alt={message.file.filename}
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.file?.url, '_blank')}
              />
            )}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            {message.file && (
              <video
                src={message.file.url}
                controls
                className="max-w-xs rounded-lg"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            )}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="space-y-2">
            {message.file && (
              <audio
                src={message.file.url}
                controls
                className="max-w-xs"
                preload="metadata"
              >
                Your browser does not support the audio tag.
              </audio>
            )}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );
      
      case 'voice':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
            <MicrophoneIcon className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              {message.file && (
                <audio
                  src={message.file.url}
                  controls
                  className="w-full"
                  preload="metadata"
                >
                  Your browser does not support the audio tag.
                </audio>
              )}
            </div>
          </div>
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            {message.file && (
              <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs cursor-pointer hover:bg-gray-200 transition-colors">
                <DocumentIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {message.file.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(message.file.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );
      
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="flex-shrink-0">
            {showAvatar ? (
              message.sender?.avatar_url ? (
                <img
                  src={message.sender.avatar_url}
                  alt={message.sender.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {message.sender?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender Name */}
          {!isOwn && showSender && (
            <span className="text-xs text-gray-500 mb-1 px-3">
              {message.sender?.username}
            </span>
          )}

          {/* Message Bubble */}
          <div
            className={`relative px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-900'
            } ${
              isConsecutive
                ? isOwn
                  ? 'rounded-br-md'
                  : 'rounded-bl-md'
                : ''
            }`}
          >
            {/* Message Type Icon */}
            {message.message_type !== 'text' && (
              <div className={`flex items-center space-x-1 mb-1 ${isOwn ? 'text-indigo-200' : 'text-gray-600'}`}>
                {getMessageIcon(message.message_type)}
                <span className="text-xs capitalize">{message.message_type}</span>
              </div>
            )}

            {/* Message Content */}
            {renderMessageContent()}

            {/* Timestamp */}
            <div className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
              {formatTime(message.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
