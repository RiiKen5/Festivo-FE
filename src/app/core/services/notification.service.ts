import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  Notification,
  NotificationsResponse,
  NotificationResponse,
  UnreadCountResponse
} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private endpoint = '/notifications';

  // Reactive signal for unread count (can be used in navbar)
  unreadCount = signal(0);

  constructor(private api: ApiService) {}

  /**
   * Get user notifications
   * GET /api/v1/notifications
   */
  getNotifications(page: number = 1, limit: number = 20): Observable<NotificationsResponse> {
    return this.api.get<NotificationsResponse>(this.endpoint, { page, limit });
  }

  /**
   * Get unread notifications count
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount(): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/unread-count`).pipe(
      tap(response => {
        // Handle different response formats:
        // { success: true, data: { count: 5 } }
        // { success: true, count: 5 }
        // { success: true, data: 5 }
        let count = 0;
        if (response.data?.unreadCount !== undefined) {
          count = response.data.unreadCount;
        } else if (response.unreadCount !== undefined) {
          count = response.unreadCount;
        } else if (typeof response.data === 'number') {
          count = response.data;
        }
        this.unreadCount.set(count);
      })
    );
  }

  /**
   * Mark a single notification as read
   * PUT /api/v1/notifications/:notificationId/read
   */
  markAsRead(notificationId: string): Observable<NotificationResponse> {
    return this.api.put<NotificationResponse>(`${this.endpoint}/${notificationId}/read`, {}).pipe(
      tap(() => {
        this.unreadCount.update(count => Math.max(0, count - 1));
      })
    );
  }

  /**
   * Mark all notifications as read
   * PUT /api/v1/notifications/read-all
   */
  markAllAsRead(): Observable<{ success: boolean; message: string }> {
    return this.api.put<{ success: boolean; message: string }>(`${this.endpoint}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCount.set(0);
      })
    );
  }

  /**
   * Delete a notification
   * DELETE /api/v1/notifications/:notificationId
   */
  deleteNotification(notificationId: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`${this.endpoint}/${notificationId}`);
  }

  /**
   * Refresh unread count (call this on app init or after actions)
   */
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      error: (err) => {
        console.error('Failed to fetch notification count:', err);
        // Don't crash, just set count to 0
        this.unreadCount.set(0);
      }
    });
  }
}
