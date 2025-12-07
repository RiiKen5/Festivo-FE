import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationType } from '../../core/models/notification.model';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <div class="notifications">
      <div class="notifications__container">
        <!-- Header -->
        <div class="notifications__header">
          <div class="notifications__title-section">
            <h1 class="notifications__title">Notifications</h1>
            @if (notificationService.unreadCount() > 0) {
              <span class="notifications__unread-badge">
                {{ notificationService.unreadCount() }} unread
              </span>
            }
          </div>
          @if (notifications().length > 0 && notificationService.unreadCount() > 0) {
            <button class="notifications__mark-all" (click)="markAllAsRead()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Mark all as read
            </button>
          }
        </div>

        <!-- Filter Tabs -->
        <div class="notifications__tabs">
          <button
            class="notifications__tab"
            [class.notifications__tab--active]="activeFilter() === 'all'"
            (click)="setFilter('all')">
            All
          </button>
          <button
            class="notifications__tab"
            [class.notifications__tab--active]="activeFilter() === 'unread'"
            (click)="setFilter('unread')">
            Unread
          </button>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="notifications__loading">
            <div class="notifications__spinner"></div>
            <span>Loading notifications...</span>
          </div>
        }

        <!-- Empty State -->
        @else if (filteredNotifications().length === 0) {
          <div class="notifications__empty">
            <div class="notifications__empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <h3 class="notifications__empty-title">
              @if (activeFilter() === 'unread') {
                No unread notifications
              } @else {
                No notifications yet
              }
            </h3>
            <p class="notifications__empty-text">
              @if (activeFilter() === 'unread') {
                You're all caught up! Check back later for new updates.
              } @else {
                When you receive notifications about bookings, events, or messages, they'll appear here.
              }
            </p>
          </div>
        }

        <!-- Notifications List -->
        @else {
          <div class="notifications__list">
            @for (notification of filteredNotifications(); track notification._id) {
              <div
                class="notification-item"
                [class.notification-item--unread]="!notification.isRead"
                (click)="handleNotificationClick(notification)">
                <div class="notification-item__icon" [ngClass]="getIconClass(notification.type)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    @switch (notification.type) {
                      @case ('booking_request') {
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      }
                      @case ('booking_confirmed') {
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      }
                      @case ('booking_cancelled') {
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      }
                      @case ('booking_completed') {
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      }
                      @case ('payment_received') {
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                      }
                      @case ('review_received') {
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      }
                      @case ('event_reminder') {
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      }
                      @case ('rsvp_received') {
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      }
                      @case ('message_received') {
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      }
                      @default {
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      }
                    }
                  </svg>
                </div>

                <div class="notification-item__content">
                  <div class="notification-item__header">
                    <span class="notification-item__title">{{ notification.title }}</span>
                    @if (!notification.isRead) {
                      <span class="notification-item__unread-dot"></span>
                    }
                  </div>
                  <p class="notification-item__message">{{ notification.message }}</p>
                  <span class="notification-item__time">{{ getTimeAgo(notification.createdAt) }}</span>
                </div>

                <div class="notification-item__actions">
                  @if (!notification.isRead) {
                    <button
                      class="notification-item__action"
                      title="Mark as read"
                      (click)="markAsRead(notification, $event)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  }
                  <button
                    class="notification-item__action notification-item__action--delete"
                    title="Delete"
                    (click)="deleteNotification(notification, $event)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Load More -->
          @if (hasMore()) {
            <div class="notifications__load-more">
              <app-button
                variant="secondary"
                [loading]="isLoadingMore()"
                (click)="loadMore()">
                Load more
              </app-button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .notifications {
      min-height: calc(100vh - $navbar-height);
      background: $bg-secondary;
      padding: $spacing-6 0;
    }

    .notifications__container {
      @include container;
      max-width: 720px;
    }

    .notifications__header {
      @include flex-between;
      margin-bottom: $spacing-6;
      flex-wrap: wrap;
      gap: $spacing-4;
    }

    .notifications__title-section {
      display: flex;
      align-items: center;
      gap: $spacing-3;
    }

    .notifications__title {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: $text-primary;
      margin: 0;
    }

    .notifications__unread-badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-3;
      background: $primary-100;
      color: $primary-700;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      border-radius: $radius-full;
    }

    .notifications__mark-all {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-2 $spacing-4;
      background: none;
      border: 1px solid $border-default;
      border-radius: $radius-default;
      color: $text-secondary;
      font-weight: $font-weight-medium;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        background: $bg-primary;
        color: $text-primary;
        border-color: $primary-500;
      }
    }

    .notifications__tabs {
      display: flex;
      gap: $spacing-2;
      margin-bottom: $spacing-4;
      padding: $spacing-1;
      background: $bg-primary;
      border-radius: $radius-default;
      border: 1px solid $border-light;
    }

    .notifications__tab {
      flex: 1;
      padding: $spacing-2 $spacing-4;
      background: none;
      border: none;
      border-radius: $radius-default;
      color: $text-secondary;
      font-weight: $font-weight-medium;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        color: $text-primary;
      }

      &--active {
        background: $primary-50;
        color: $primary-700;
      }
    }

    .notifications__loading {
      @include flex-center;
      flex-direction: column;
      gap: $spacing-4;
      padding: $spacing-12;
      color: $text-muted;
    }

    .notifications__spinner {
      width: 32px;
      height: 32px;
      border: 3px solid $border-light;
      border-top-color: $primary-600;
      border-radius: $radius-full;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .notifications__empty {
      @include flex-center;
      flex-direction: column;
      padding: $spacing-12;
      text-align: center;
    }

    .notifications__empty-icon {
      @include flex-center;
      width: 100px;
      height: 100px;
      background: $neutral-100;
      border-radius: $radius-full;
      color: $text-muted;
      margin-bottom: $spacing-6;
    }

    .notifications__empty-title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      color: $text-primary;
      margin: 0 0 $spacing-2;
    }

    .notifications__empty-text {
      color: $text-secondary;
      margin: 0;
      max-width: 320px;
    }

    .notifications__list {
      background: $bg-primary;
      border-radius: $radius-lg;
      border: 1px solid $border-light;
      overflow: hidden;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: $spacing-4;
      padding: $spacing-4;
      border-bottom: 1px solid $border-light;
      cursor: pointer;
      transition: background $transition-fast;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: $neutral-50;

        .notification-item__actions {
          opacity: 1;
        }
      }

      &--unread {
        background: $primary-50;

        &:hover {
          background: $primary-100;
        }
      }
    }

    .notification-item__icon {
      @include flex-center;
      width: 44px;
      height: 44px;
      border-radius: $radius-full;
      flex-shrink: 0;

      &.icon--booking {
        background: $info-light;
        color: $info-dark;
      }

      &.icon--success {
        background: $success-light;
        color: $success-dark;
      }

      &.icon--cancelled {
        background: $error-light;
        color: $error-dark;
      }

      &.icon--payment {
        background: $warning-light;
        color: $warning-dark;
      }

      &.icon--review {
        background: #fef3c7;
        color: #d97706;
      }

      &.icon--message {
        background: $primary-50;
        color: $primary-600;
      }

      &.icon--default {
        background: $neutral-100;
        color: $text-secondary;
      }
    }

    .notification-item__content {
      flex: 1;
      min-width: 0;
    }

    .notification-item__header {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      margin-bottom: $spacing-1;
    }

    .notification-item__title {
      font-weight: $font-weight-semibold;
      color: $text-primary;
    }

    .notification-item__unread-dot {
      width: 8px;
      height: 8px;
      background: $primary-600;
      border-radius: $radius-full;
      flex-shrink: 0;
    }

    .notification-item__message {
      color: $text-secondary;
      font-size: $font-size-sm;
      line-height: 1.5;
      margin: 0 0 $spacing-2;
    }

    .notification-item__time {
      font-size: $font-size-xs;
      color: $text-muted;
    }

    .notification-item__actions {
      display: flex;
      gap: $spacing-1;
      opacity: 0;
      transition: opacity $transition-fast;
    }

    .notification-item__action {
      @include flex-center;
      width: 32px;
      height: 32px;
      background: none;
      border: none;
      border-radius: $radius-default;
      color: $text-muted;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }

      &--delete:hover {
        background: $error-light;
        color: $error;
      }
    }

    .notifications__load-more {
      @include flex-center;
      padding: $spacing-6;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications = signal<Notification[]>([]);
  isLoading = signal(true);
  isLoadingMore = signal(false);
  hasMore = signal(false);
  activeFilter = signal<'all' | 'unread'>('all');
  currentPage = signal(1);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.currentPage.set(1);

    this.notificationService.getNotifications(1, 20).subscribe({
      next: (response) => {
        this.notifications.set(response.data);
        this.hasMore.set(response.pagination ? response.pagination.current < response.pagination.total : false);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadMore(): void {
    const nextPage = this.currentPage() + 1;
    this.isLoadingMore.set(true);

    this.notificationService.getNotifications(nextPage, 20).subscribe({
      next: (response) => {
        this.notifications.update(current => [...current, ...response.data]);
        this.currentPage.set(nextPage);
        this.hasMore.set(response.pagination ? response.pagination.current < response.pagination.total : false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoadingMore.set(false);
      }
    });
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.activeFilter.set(filter);
  }

  filteredNotifications(): Notification[] {
    const all = this.notifications();
    if (this.activeFilter() === 'unread') {
      return all.filter(n => !n.isRead);
    }
    return all;
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification._id).subscribe(() => {
      this.notifications.update(notifications =>
        notifications.map(n =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.update(notifications =>
        notifications.map(n => ({ ...n, isRead: true }))
      );
    });
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification._id).subscribe(() => {
      this.notifications.update(notifications =>
        notifications.filter(n => n._id !== notification._id)
      );
    });
  }

  handleNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe();
      this.notifications.update(notifications =>
        notifications.map(n =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
    }

    const data = notification.data;
    const type = notification.type;

    // Route based on notification type and available data
    if (type === 'message_received' && data?.senderId) {
      this.router.navigate(['/messages', data.senderId]);
    } else if (data?.bookingId) {
      this.router.navigate(['/bookings', data.bookingId]);
    } else if (data?.eventId) {
      // For event-related notifications, check if it's a slug or ID
      this.router.navigate(['/events', data.eventId]);
    } else if (data?.serviceId) {
      this.router.navigate(['/services', data.serviceId]);
    } else if (data?.userId && type === 'rsvp_received') {
      // For RSVP notifications, go to the event
      if (data.eventId) {
        this.router.navigate(['/events', data.eventId]);
      }
    } else {
      // Fallback routing based on notification type
      switch (type) {
        case 'booking_request':
        case 'booking_confirmed':
        case 'booking_cancelled':
        case 'booking_completed':
        case 'payment_received':
          this.router.navigate(['/bookings']);
          break;
        case 'review_received':
          this.router.navigate(['/dashboard/my-services']);
          break;
        case 'event_reminder':
        case 'rsvp_received':
          this.router.navigate(['/dashboard/events']);
          break;
        case 'message_received':
          this.router.navigate(['/messages']);
          break;
        default:
          // Stay on notifications page if no specific route
          break;
      }
    }
  }

  getIconClass(type: NotificationType): string {
    const iconClasses: Record<string, string> = {
      'booking_request': 'icon--booking',
      'booking_confirmed': 'icon--success',
      'booking_cancelled': 'icon--cancelled',
      'booking_completed': 'icon--success',
      'payment_received': 'icon--payment',
      'review_received': 'icon--review',
      'event_reminder': 'icon--booking',
      'rsvp_received': 'icon--success',
      'message_received': 'icon--message',
      'system': 'icon--default'
    };
    return iconClasses[type] || 'icon--default';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  }
}
