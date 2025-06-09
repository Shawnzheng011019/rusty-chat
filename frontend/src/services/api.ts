import axios from 'axios';
import type {
  AxiosInstance,
  AxiosResponse
} from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Message,
  SendMessageRequest,
  Friend,
  Group,
  CreateGroupRequest,
  AddMemberRequest,
  GroupMember,
  FileUploadResponse
} from '../types/index';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 10000,
    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.accessToken) {
          try {
            await this.refreshToken();
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client.request(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private loadTokenFromStorage() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.accessToken = token;
    }
  }

  private saveTokenToStorage(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    this.accessToken = accessToken;
  }

  private clearTokenFromStorage() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.accessToken = null;
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/api/auth/login', credentials);
    this.saveTokenToStorage(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/api/auth/register', userData);
    this.saveTokenToStorage(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response: AxiosResponse<{ access_token: string }> = await this.client.post('/api/auth/refresh', {
      refresh_token: refreshToken
    });
    
    this.accessToken = response.data.access_token;
    localStorage.setItem('access_token', response.data.access_token);
  }

  logout() {
    this.clearTokenFromStorage();
  }

  // User methods
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.client.get('/api/users/me');
    return response.data;
  }

  async searchUsers(query: string): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.client.get(`/api/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Message methods
  async getMessages(chatId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    const response: AxiosResponse<Message[]> = await this.client.get(`/api/messages/${chatId}?page=${page}&limit=${limit}`);
    return response.data;
  }

  async sendMessage(message: SendMessageRequest): Promise<Message> {
    const response: AxiosResponse<Message> = await this.client.post('/api/messages', message);
    return response.data;
  }

  // Friend methods
  async getFriends(): Promise<Friend[]> {
    const response: AxiosResponse<Friend[]> = await this.client.get('/api/friends');
    return response.data;
  }

  async sendFriendRequest(friendId: string): Promise<void> {
    await this.client.post('/api/friends/requests', { friend_id: friendId });
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    await this.client.post(`/api/friends/requests/${requestId}/accept`);
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    await this.client.post(`/api/friends/requests/${requestId}/reject`);
  }

  async removeFriend(friendId: string): Promise<void> {
    await this.client.delete(`/api/friends/${friendId}`);
  }

  // Group methods
  async getGroups(): Promise<Group[]> {
    const response: AxiosResponse<Group[]> = await this.client.get('/api/groups');
    return response.data;
  }

  async createGroup(groupData: CreateGroupRequest): Promise<Group> {
    const response: AxiosResponse<Group> = await this.client.post('/api/groups', groupData);
    return response.data;
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const response: AxiosResponse<GroupMember[]> = await this.client.get(`/api/groups/${groupId}/members`);
    return response.data;
  }

  async addGroupMember(groupId: string, memberData: AddMemberRequest): Promise<void> {
    await this.client.post(`/api/groups/${groupId}/members`, memberData);
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await this.client.delete(`/api/groups/${groupId}/members/${userId}`);
  }

  // File methods
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<FileUploadResponse> = await this.client.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.get(`/api/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  getFileUrl(fileId: string): string {
    return `${this.client.defaults.baseURL}/api/files/${fileId}`;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
