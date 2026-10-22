import { Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  Message,
  MessageCreateData,
  MessagesResponse,
  MessageResponse,
  ConversationsResponse,
  UnreadMessagesCountResponse
} from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private endpoint = '/messages';

  // Reactive signal for unread count (can be used in navbar)
  unreadCount = signal(0);

  constructor(private api: ApiService) {}

  /**
   * Send a new message
   * POST /api/v1/messages
   */
  sendMessage(data: MessageCreateData): Observable<MessageResponse> {
    return this.api.post<MessageResponse>(this.endpoint, data);
  }

  /**
   * Get conversation with a specific user
   * GET /api/v1/messages/conversation/:userId
   */
  getConversation(userId: string, page: number = 1, limit: number = 50): Observable<MessagesResponse> {
    // The API returns { messages, otherUser } inside data
    return this.api.get<any>(`${this.endpoint}/conversation/${userId}`, { page, limit }).pipe(
      map(response => ({
        success: response.success,
        count: response.meta?.total ?? response.data.messages.length,
        data: response.data.messages as Message[]
      }))
    );
  }

  /**
   * Get all recent conversations
   * GET /api/v1/messages/conversations
   */
  getConversations(): Observable<ConversationsResponse> {
    // The API names the other participant `otherUser`
    return this.api.get<any>(`${this.endpoint}/conversations`).pipe(
      map(response => ({
        success: response.success,
        data: (response.data as any[])
          .filter(c => c.otherUser)
          .map(c => ({ user: c.otherUser, lastMessage: c.lastMessage, unreadCount: c.unreadCount }))
      }))
    );
  }

  /**
   * Get unread messages count
   * GET /api/v1/messages/unread-count
   */
  getUnreadCount(): Observable<UnreadMessagesCountResponse> {
    return this.api.get<UnreadMessagesCountResponse>(`${this.endpoint}/unread-count`).pipe(
      tap(response => {
        this.unreadCount.set(response.data.unreadCount);
      })
    );
  }

  /**
   * Mark messages in a conversation as read
   * PUT /api/v1/messages/read/:userId
   */
  markConversationAsRead(userId: string): Observable<{ success: boolean; message: string }> {
    return this.api.put<{ success: boolean; message: string }>(`${this.endpoint}/read/${userId}`, {});
  }

  /**
   * Refresh unread count (call this on app init or after actions)
   */
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }
}
