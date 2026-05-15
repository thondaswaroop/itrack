// Dashboard Service
import { apiRequest } from './api';

export interface DashboardStats {
  total_shipments: number;
  today_shipments: number;
  by_status: Array<{
    current_status: string;
    count: number;
  }>;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: 'info' | 'warning' | 'success' | 'error';
  related_shipment_id?: number;
  is_read: boolean;
  created_at: string;
}

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(hubId?: number): Promise<DashboardStats> {
    const response = await apiRequest<DashboardStats>('getDashboardStats', {
      hub_id: hubId,
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    return {
      total_shipments: 0,
      today_shipments: 0,
      by_status: [],
    };
  }

  /**
   * Get notifications
   */
  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    const response = await apiRequest<Notification[]>('getNotifications', {
      unread_only: unreadOnly,
    });
    
    return response.data || [];
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: number): Promise<void> {
    await apiRequest('markNotificationRead', {
      notification_id: notificationId,
    });
  }
}

export const dashboardService = new DashboardService();
