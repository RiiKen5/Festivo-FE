import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { MessageService } from './message.service';
import { NotificationService } from './notification.service';
import { Message } from '../models/message.model';
import { Notification } from '../models/notification.model';

/**
 * One live connection to the API while the user is signed in. Pushes new
 * messages, read receipts, typing and presence to whichever screen listens,
 * and keeps the navbar's unread badges current on every page.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private auth = inject(AuthService);
  private storage = inject(StorageService);
  private messages = inject(MessageService);
  private notifications = inject(NotificationService);

  private socket: Socket | null = null;

  readonly connected = signal(false);
  readonly newMessage$ = new Subject<Message>();
  readonly messagesRead$ = new Subject<{ readerId: string; at: string }>();
  readonly typing$ = new Subject<{ userId: string; typing: boolean }>();
  readonly presence$ = new Subject<{ userId: string; online: boolean }>();
  readonly notification$ = new Subject<Notification>();

  /** The conversation open on screen, so its messages don't count as unread. */
  activeChatUserId: string | null = null;

  constructor() {
    effect(() => {
      const signedIn = this.auth.isAuthenticated() && !this.auth.isLoading();
      // Connecting and disconnecting update other signals; keep those writes
      // outside the effect's tracking (Angular refuses writes inside it)
      untracked(() => {
        if (signedIn && !this.socket) this.connect();
        if (!signedIn && this.socket) this.disconnect();
      });
    });
  }

  presence(userIds: string[]): Promise<Record<string, boolean>> {
    return new Promise(resolve => {
      if (!this.socket?.connected || !userIds.length) return resolve({});
      this.socket.timeout(5000).emit('presence', userIds, (err: unknown, result: Record<string, boolean>) =>
        resolve(err ? {} : result));
    });
  }

  typing(receiverId: string, isTyping: boolean): void {
    this.socket?.emit(isTyping ? 'typing_start' : 'typing_stop', { receiverId });
  }

  private connect(): void {
    this.messages.refreshUnreadCount();
    this.notifications.refreshUnreadCount();

    this.socket = io(environment.socketUrl, {
      // Read the token on every (re)connect, so refreshed tokens are used
      auth: cb => cb({ token: this.storage.getAccessToken() }),
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => this.connected.set(true));
    // Rejected by the server (usually an expired token): socket.io won't
    // retry this on its own, so try again once the token has been refreshed
    this.socket.on('connect_error', () => {
      if (this.socket && !this.socket.active) {
        setTimeout(() => this.socket?.connect(), 5000);
      }
    });
    this.socket.on('disconnect', () => this.connected.set(false));
    // A connection that comes back may have missed updates
    this.socket.io.on('reconnect', () => {
      this.messages.refreshUnreadCount();
      this.notifications.refreshUnreadCount();
    });

    this.socket.on('new_message', (message: Message) => {
      const me = this.auth.currentUser()?._id;
      const sender = typeof message.sender === 'string' ? message.sender : message.sender?._id;
      if (sender !== me && sender !== this.activeChatUserId) {
        this.messages.unreadCount.update(n => n + 1);
      }
      this.newMessage$.next(message);
    });
    this.socket.on('messages_read', data => this.messagesRead$.next(data));
    this.socket.on('user_typing', ({ userId }) => this.typing$.next({ userId, typing: true }));
    this.socket.on('user_stopped_typing', ({ userId }) => this.typing$.next({ userId, typing: false }));
    this.socket.on('user_status_change', ({ userId, status }) =>
      this.presence$.next({ userId, online: status === 'online' }));
    this.socket.on('new_notification', (notification: Notification) => {
      this.notifications.unreadCount.update(n => n + 1);
      this.notification$.next(notification);
    });
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
    this.activeChatUserId = null;
  }
}
