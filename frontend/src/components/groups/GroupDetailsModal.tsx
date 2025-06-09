import React, { useState } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  StarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import type { Group, GroupMember, AddMemberRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface GroupDetailsModalProps {
  group: Group;
  members: GroupMember[];
  isOwner: boolean;
  onClose: () => void;
  onAddMember: (memberData: AddMemberRequest) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  group,
  members,
  isOwner,
  onClose,
  onAddMember,
  onRemoveMember,
}) => {
  const { user } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onAddMember({ user_email: newMemberEmail });
      setNewMemberEmail('');
      setShowAddMember(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await onRemoveMember(userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <StarIcon className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <ShieldCheckIcon className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              {group.avatar_url ? (
                <img
                  src={group.avatar_url}
                  alt={group.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-indigo-600 font-medium text-lg">
                  {group.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
              <p className="text-sm text-gray-500">{members.length} members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Group Info */}
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">About</h4>
            <p className="text-gray-600">
              {group.description || 'No description provided'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Created on {formatDate(group.created_at)}
            </p>
          </div>

          {/* Members Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Members ({members.length})</h4>
              {isOwner && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <form onSubmit={handleAddMember}>
                  {error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                      {error}
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="Enter user email"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMember(false);
                        setNewMemberEmail('');
                        setError(null);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {member.user?.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt={member.user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {member.user?.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {member.user?.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{member.user?.username}</h5>
                        {getRoleIcon(member.role)}
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full capitalize">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{member.user?.email}</p>
                      <p className="text-xs text-gray-400">
                        Joined {formatDate(member.joined_at)}
                      </p>
                    </div>
                  </div>
                  
                  {isOwner && member.user?.id !== user?.id && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.user!.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove member"
                    >
                      <UserMinusIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
