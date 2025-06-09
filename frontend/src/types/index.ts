export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface Message {
  id: string;
  sender: MessageSender;
  chat_id: string;
  content?: string;
  message_type: MessageType;
  file?: MessageFile;
  reply_to?: string;
  created_at: string;
}

export interface MessageSender {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface MessageFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  url: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'voice' | 'emoji';

export interface SendMessageRequest {
  chat_id: string;
  content?: string;
  message_type: MessageType;
  file_id?: string;
  reply_to?: string;
}

export interface Friend {
  id: string;
  user: FriendUser;
  status: FriendshipStatus;
  created_at: string;
}

export interface FriendUser {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen?: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface FriendRequest {
  id: string;
  from_user: FriendUser;
  to_user: FriendUser;
  status: FriendshipStatus;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  owner: GroupOwner;
  member_count: number;
  created_at: string;
}

export interface GroupOwner {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface GroupMember {
  id: string;
  user: GroupMemberUser;
  role: GroupRole;
  joined_at: string;
}

export interface GroupMemberUser {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_online: boolean;
}

export type GroupRole = 'owner' | 'admin' | 'member';

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface AddMemberRequest {
  user_email: string;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  url: string;
  created_at: string;
}

export interface WebSocketMessage {
  message_type: string;
  data: any;
}

export interface TypingIndicator {
  chat_id: string;
  user_id: string;
  username: string;
  is_typing: boolean;
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  avatar_url?: string;
  last_message?: Message;
  unread_count: number;
  participants: User[];
}
