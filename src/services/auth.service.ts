// Authentication Service
import { apiRequest, saveUser, clearUser, type UserData } from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserData;
  data: {
    vendor?: any;
    hubs?: any[];
    associate?: any;
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: 'customer' | 'associate' | 'vendor';
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
}

export interface UpdateUserByAdminRequest {
  user_id: number;
  username?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  password?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

class AuthService {
  /**
   * Login user
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>('login', {
      username,
      password,
    });

    if (response.status && response.user) {
      saveUser(response.user);
      return response as unknown as LoginResponse;
    }

    throw new Error(response.error || 'Login failed');
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<UserData> {
    const response = await apiRequest<{ user: UserData }>('register', data);

    if (response.status && response.user) {
      return response.user;
    }

    throw new Error(response.error || 'Registration failed');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserData> {
    const response = await apiRequest<{ user: UserData }>('updateProfile', data);

    if (response.status && response.user) {
      saveUser(response.user);
      return response.user;
    }

    throw new Error(response.error || 'Profile update failed');
  }

  /**
   * Update user by admin/vendor (can update username, email, etc.)
   */
  async updateUserByAdmin(data: UpdateUserByAdminRequest): Promise<UserData> {
    const response = await apiRequest<{ user: UserData }>('updateUserByAdmin', data);

    if (response.status && response.user) {
      return response.user;
    }

    throw new Error(response.error || 'User update failed');
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await apiRequest('changePassword', data);

    if (!response.status) {
      throw new Error(response.error || 'Password change failed');
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    clearUser();
  }
}

export const authService = new AuthService();
