import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NOTIFICATION_ICONS, notificationLink } from '../../core/models/notification.model';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, IconComponent, EmptyStateComponent],
  template: `
    <main class="page">
      <div class="page__container">
        <header class="page-header">
          <div>
            <h1>Notifications</h1>
            <p class="page-header__subtitle">
              @if (notificationService.unreadCount() > 0) {
                {{ notificationService.unreadCount() }} unread
              } @else {
                Booking updates, payments, messages and RSVPs
              }
            </p>
          </div>
          @if (notifications().length > 0 && notificationService.unreadCount() > 0) {
            <app-button variant="secondary" size="sm" (onClick)="markAllAsRead()">
              <app-icon name="check" [size]="16"></app-icon>
              Mark all as read
            </app-button>
          }
        </header>

        <div class="segmented" role="tablist" aria-label="Filter notifications">
          <button type="button" role="tab" [attr.aria-selected]="activeFilter() === 'all'" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">All</button>
          <button type="button" role="tab" [attr.aria-selected]="activeFilter() === 'unread'" [class.active]="activeFilter() === 'unread'" (click)="setFilter('unread')">Unread</button>
        </div>

        <section class="panel" aria-live="polite">
          @if (isLoading()) {
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="row row--skeleton">
                <span class="skeleton skeleton--avatar"></span>
                <span class="row__body">
                  <span class="skeleton skeleton--title"></span>
                  <span class="skeleton skeleton--text"></span>
                </span>
              </div>
            }
          } @else if (filteredNotifications().length === 0) {
            @if (activeFilter() === 'unread') {
              <app-empty-state icon="check-circle" title="You're all caught up" description="Nothing unread. New booking requests, payments and messages will show up here."></app-empty-state>
            } @else {
              <app-empty-state icon="bell" title="No notifications yet" description="When vendors respond, payments come in or guests RSVP, you'll see it here.">
                <app-button variant="secondary" size="sm" routerLink="/services">Find vendors</app-button>
              </app-empty-state>
            }
          } @else {
            <ul class="list">
              @for (notification of filteredNotifications(); track notification._id) {
                <li class="row" [class.row--unread]="!notification.isRead">
                  <button type="button" class="row__main" (click)="handleNotificationClick(notification)">
                    <span class="row__icon">
                      <app-icon [name]="iconFor(notification)" [size]="18"></app-icon>
                    </span>
                    <span class="row__body">
                      <span class="row__title">
                        {{ notification.title }}
                        @if (!notification.isRead) {
                          <span class="row__dot"><span class="visually-hidden">Unread</span></span>
                        }
                      </span>
                      <span class="row__message">{{ notification.message }}</span>
                      <span class="row__time">{{ getTimeAgo(notification.createdAt) }}</span>
                    </span>
                  </button>
                  <span class="row__actions">
                    @if (!notification.isRead) {
                      <button type="button" class="icon-btn" aria-label="Mark as read" title="Mark as read" (click)="markAsRead(notification, $event)">
                        <app-icon name="check" [size]="16"></app-icon>
                      </button>
                    }
                    <button type="button" class="icon-btn icon-btn--danger" aria-label="Delete notification" title="Delete" (click)="deleteNotification(notification, $event)">
                      <app-icon name="trash" [size]="16"></app-icon>
                    </button>
                  </span>
                </li>
              }
            </ul>

            @if (hasMore()) {
              <div class="load-more">
                <app-button variant="secondary" size="sm" [loading]="isLoadingMore()" (onClick)="loadMore()">Load older notifications</app-button>
              </div>
            }
          }
        </section>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .page {
      padding: $spacing-8 0;
    }

    .page__container {
      @include container;
      max-width: 760px;
    }

    .segmented {
      display: inline-flex;
      padding: 3px;
      margin-bottom: $spacing-4;
      border-radius: $radius-default;
      background: $neutral-100;

      button {
        padding: $spacing-1 $spacing-4;
        border: none;
        border-radius: 6px;
        background: none;
        color: $text-secondary;
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        cursor: pointer;

        &.active {
          background: $bg-primary;
          color: $text-primary;
          box-shadow: $shadow-sm;
        }
      }
    }

    .panel {
      @include card;
      padding: 0;
      overflow: hidden;
    }

    .row {
      display: flex;
      align-items: flex-start;
      border-bottom: 1px solid $border-light;

      &:last-child {
        border-bottom: none;
      }

      &--unread {
        background: $primary-50;
      }

      &--skeleton {
        gap: $spacing-3;
        padding: $spacing-4 $spacing-5;

        .row__body {
          gap: $spacing-2;
        }

        .skeleton--title { width: 40%; height: 14px; }
        .skeleton--text { width: 80%; height: 12px; }
        .skeleton--avatar { width: 36px; height: 36px; }
      }
    }

    .row__main {
      flex: 1;
      display: flex;
      gap: $spacing-3;
      min-width: 0;
      padding: $spacing-4 $spacing-5;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: rgba(0, 0, 0, 0.02);
      }
    }

    .row__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      border-radius: $radius-full;
      background: $bg-primary;
      border: 1px solid $border-light;
      color: $primary-600;
    }

    .row__body {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .row__title {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $text-primary;
    }

    .row__dot {
      width: 7px;
      height: 7px;
      border-radius: $radius-full;
      background: $primary-600;
    }

    .row__message {
      margin-top: 2px;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .row__time {
      margin-top: $spacing-1;
      font-size: $font-size-xs;
      color: $text-tertiary;
    }

    .row__actions {
      display: flex;
      gap: $spacing-1;
      padding: $spacing-4 $spacing-4 0 0;
    }

    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: $radius-default;
      background: none;
      color: $text-tertiary;
      cursor: pointer;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }

      &--danger:hover {
        background: $error-light;
        color: $error-dark;
      }
    }

    .load-more {
      display: flex;
      justify-content: center;
      padding: $spacing-4;
      border-top: 1px solid $border-light;
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
    this.notificationService.refreshUnreadCount();
  }

  // The API returns { data, meta: { page, pages } }
  private morePagesAfter(response: any): boolean {
    const meta = response.meta || response.pagination;
    if (!meta) return false;
    return (meta.page ?? meta.current) < (meta.pages ?? meta.total);
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.currentPage.set(1);

    this.notificationService.getNotifications(1, 20).subscribe({
      next: (response) => {
        this.notifications.set(response.data);
        this.hasMore.set(this.morePagesAfter(response));
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
        this.hasMore.set(this.morePagesAfter(response));
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
    return this.activeFilter() === 'unread' ? all.filter(n => !n.isRead) : all;
  }

  iconFor(notification: Notification): string {
    return NOTIFICATION_ICONS[notification.type] || 'info';
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification._id).subscribe(() => {
      this.notifications.update(notifications =>
        notifications.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
      );
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.update(notifications => notifications.map(n => ({ ...n, isRead: true })));
    });
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification._id).subscribe(() => {
      this.notifications.update(notifications => notifications.filter(n => n._id !== notification._id));
    });
  }

  handleNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe();
      this.notifications.update(notifications =>
        notifications.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
      );
    }
    this.router.navigateByUrl(notificationLink(notification));
  }

  getTimeAgo(date: Date): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} h ago`;
    if (diffDays < 7) return `${diffDays} d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
