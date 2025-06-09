import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  Cog6ToothIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';
import type { Group, GroupMember, CreateGroupRequest, AddMemberRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupDetailsModal } from './GroupDetailsModal';

export const GroupsList: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const groupsData = await apiClient.getGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const members = await apiClient.getGroupMembers(groupId);
      setGroupMembers(members);
    } catch (error) {
      console.error('Failed to load group members:', error);
    }
  };

  const createGroup = async (groupData: CreateGroupRequest) => {
    try {
      await apiClient.createGroup(groupData);
      await loadGroups();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  };

  const addMember = async (groupId: string, memberData: AddMemberRequest) => {
    try {
      await apiClient.addGroupMember(groupId, memberData);
      await loadGroupMembers(groupId);
    } catch (error) {
      console.error('Failed to add member:', error);
      throw error;
    }
  };

  const removeMember = async (groupId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await apiClient.removeGroupMember(groupId, userId);
      await loadGroupMembers(groupId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const openGroupDetails = async (group: Group) => {
    setSelectedGroup(group);
    await loadGroupMembers(group.id);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isGroupOwner = (group: Group) => {
    return group.owner.id === user?.id;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Groups</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No groups yet</p>
            <p className="text-sm">Create a group to start collaborating!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groups.map((group) => (
              <div key={group.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      {group.avatar_url ? (
                        <img
                          src={group.avatar_url}
                          alt={group.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <UserGroupIcon className="w-6 h-6 text-indigo-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">
                        {group.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          {group.member_count} members
                        </span>
                        <span className="text-xs text-gray-400">
                          Created {formatDate(group.created_at)}
                        </span>
                        {isGroupOwner(group) && (
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Start group chat"
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openGroupDetails(group)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Group settings"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createGroup}
        />
      )}

      {/* Group Details Modal */}
      {showDetailsModal && selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          members={groupMembers}
          isOwner={isGroupOwner(selectedGroup)}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedGroup(null);
            setGroupMembers([]);
          }}
          onAddMember={(memberData) => addMember(selectedGroup.id, memberData)}
          onRemoveMember={(userId) => removeMember(selectedGroup.id, userId)}
        />
      )}
    </div>
  );
};
