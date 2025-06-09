import React, { useState, useEffect } from 'react';
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';
import type { Friend, User, FriendRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const FriendsList: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFriends = async () => {
    try {
      const friendsData = await apiClient.getFriends();
      setFriends(friendsData.filter(f => f.status === 'accepted'));
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const friendsData = await apiClient.getFriends();
      const requests = friendsData
        .filter(f => f.status === 'pending')
        .map(f => ({
          id: f.id,
          from_user: f.user,
          to_user: user!,
          status: f.status,
          created_at: f.created_at
        }));
      setFriendRequests(requests);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const users = await apiClient.searchUsers(searchQuery);
      const filteredUsers = users.filter(u => 
        u.id !== user?.id && 
        !friends.some(f => f.user.id === u.id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      await apiClient.sendFriendRequest(friendId);
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await apiClient.acceptFriendRequest(requestId);
      await loadFriends();
      await loadFriendRequests();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await apiClient.rejectFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      await apiClient.removeFriend(friendId);
      await loadFriends();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Friends</h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'friends'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'requests'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests ({friendRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'search'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Add Friends
          </button>
        </div>
      </div>

      {/* Search Bar (for search tab) */}
      {activeTab === 'search' && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'friends' && (
          <div className="divide-y divide-gray-200">
            {friends.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No friends yet</p>
                <p className="text-sm">Add some friends to start chatting!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {friend.user.avatar_url ? (
                          <img
                            src={friend.user.avatar_url}
                            alt={friend.user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {friend.user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {friend.user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{friend.user.username}</h3>
                        <p className="text-sm text-gray-500">
                          {friend.user.is_online ? 'Online' : `Last seen ${formatDate(friend.user.last_seen || friend.created_at)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Start chat"
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove friend"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="divide-y divide-gray-200">
            {friendRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No friend requests</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {request.from_user.avatar_url ? (
                        <img
                          src={request.from_user.avatar_url}
                          alt={request.from_user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {request.from_user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{request.from_user.username}</h3>
                        <p className="text-sm text-gray-500">{request.from_user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => acceptFriendRequest(request.id)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        title="Accept"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectFriendRequest(request.id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        title="Reject"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="p-8 text-center text-gray-500">
                <p>No users found</p>
              </div>
            ) : (
              searchResults.map((searchUser) => (
                <div key={searchUser.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {searchUser.avatar_url ? (
                        <img
                          src={searchUser.avatar_url}
                          alt={searchUser.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {searchUser.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{searchUser.username}</h3>
                        <p className="text-sm text-gray-500">{searchUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(searchUser.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      <span>Add Friend</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
