import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { Chat } from '../../types';
import { FriendsList } from '../friends/FriendsList';
import { GroupsList } from '../groups/GroupsList';

export const ChatSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { chats, currentChat, setCurrentChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'groups'>('chats');

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatSelect = (chat: Chat) => {
    setCurrentChat(chat);
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{user?.username}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'chats'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'friends'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'groups'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Groups
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <>
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No chats found' : 'No conversations yet'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      currentChat?.id === chat.id ? 'bg-indigo-50 border-r-2 border-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {chat.avatar_url ? (
                          <img
                            src={chat.avatar_url}
                            alt={chat.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            {chat.type === 'group' ? (
                              <UserGroupIcon className="w-6 h-6 text-gray-600" />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {chat.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}

                        {chat.type === 'direct' && chat.participants[0]?.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {chat.name}
                          </h3>
                          {chat.last_message && (
                            <span className="text-xs text-gray-500">
                              {formatLastSeen(chat.last_message.created_at)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate">
                            {chat.last_message?.content || 'No messages yet'}
                          </p>
                          {chat.unread_count > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem]">
                              {chat.unread_count > 99 ? '99+' : chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'friends' && <FriendsList />}
        {activeTab === 'groups' && <GroupsList />}
      </div>

      {/* Action Buttons - Only show for chats tab */}
      {activeTab === 'chats' && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('friends')}
              className="flex-1 flex items-center justify-center py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Add Friend
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className="flex-1 flex items-center justify-center py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <UserGroupIcon className="w-4 h-4 mr-2" />
              New Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
