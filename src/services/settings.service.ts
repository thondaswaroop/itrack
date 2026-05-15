// Settings Service
import { apiRequest } from './api';

export interface UserPreferences {
  // Notification settings
  email_notifications?: boolean;
  sms_notifications?: boolean;
  shipment_updates?: boolean;
  delivery_alerts?: boolean;
  system_alerts?: boolean;
  
  // System preferences
  language?: string;
  timezone?: string;
  date_format?: string;
  currency?: string;
  theme?: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

class SettingsService {
  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    const response = await apiRequest<{ data: UserPreferences }>('getUserPreferences');
    
    if (response.status && response.data) {
      return response.data.data || {};
    }
    
    return {};
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: UserPreferences): Promise<void> {
    const response = await apiRequest<{ message: string }>('updateUserPreferences', {
      preferences,
    });
    
    if (!response.status) {
      throw new Error(response.error || 'Failed to update preferences');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(data: UpdateProfileRequest): Promise<void> {
    const response = await apiRequest<{ message: string }>('updateUserProfile', data);
    
    if (!response.status) {
      throw new Error(response.error || 'Failed to update profile');
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await apiRequest<{ message: string }>('changePassword', data);
    
    if (!response.status) {
      throw new Error(response.error || 'Failed to change password');
    }
  }
}

export const settingsService = new SettingsService();
