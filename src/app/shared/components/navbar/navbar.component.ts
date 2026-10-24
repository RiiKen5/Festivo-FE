import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MessageService } from '../../../core/services/message.service';
import { Notification, NOTIFICATION_ICONS, notificationLink } from '../../../core/models/notification.model';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, IconComponent, LogoComponent],
  template: `
    <header class="navbar">
      <div class="navbar__container">
        <a routerLink="/" class="navbar__logo" aria-label="Festivo home">
          <app-logo [size]="30"></app-logo>
        </a>

        <nav class="navbar__nav" aria-label="Main">
          <a routerLink="/events" routerLinkActive="active" class="navbar__link">Events</a>
          <a routerLink="/services" routerLinkActive="active" class="navbar__link">Vendors</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" routerLinkActive="active" class="navbar__link">Dashboard</a>
            <a routerLink="/messages" routerLinkActive="active" class="navbar__link"
               [attr.aria-label]="'Messages' + (messageService.unreadCount() ? ', ' + messageService.unreadCount() + ' unread' : '')">
              Messages
              @if (messageService.unreadCount() > 0) {
                <span class="navbar__count" aria-hidden="true">{{ messageService.unreadCount() > 99 ? '99+' : messageService.unreadCount() }}</span>
              }
            </a>
          }
        </nav>

        <div class="navbar__actions">
          @if (auth.isAuthenticated()) {
            <!-- Notifications -->
            <div class="navbar__menu navbar__notifications">
              <button
                type="button"
                class="navbar__icon-btn"
                [attr.aria-expanded]="isNotificationsOpen()"
                aria-haspopup="true"
                [attr.aria-label]="'Notifications' + (notificationService.unreadCount() ? ', ' + notificationService.unreadCount() + ' unread' : '')"
                (click)="toggleNotifications($event)"
              >
                <app-icon name="bell" [size]="20"></app-icon>
                @if (notificationService.unreadCount() > 0) {
                  <span class="navbar__badge" aria-hidden="true">
                    {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
                  </span>
                }
              </button>

              @if (isNotificationsOpen()) {
                <div class="navbar__panel navbar__panel--notifications" role="dialog" aria-label="Notifications">
                  <div class="navbar__panel-header">
                    <span class="navbar__panel-title">Notifications</span>
                    @if (notificationService.unreadCount() > 0) {
                      <button type="button" class="navbar__text-btn" (click)="markAllAsRead()">Mark all read</button>
                    }
                  </div>

                  @if (isLoadingNotifications()) {
                    <div class="navbar__panel-state">
                      <div class="navbar__spinner" aria-label="Loading"></div>
                    </div>
                  } @else if (notifications().length === 0) {
                    <div class="navbar__panel-state">
                      <app-icon name="bell" [size]="28"></app-icon>
                      <p>You're all caught up. Booking updates and messages will show here.</p>
                    </div>
                  } @else {
                    <ul class="navbar__notification-list">
                      @for (notification of notifications(); track notification._id) {
                        <li>
                          <button
                            type="button"
                            class="navbar__notification"
                            [class.navbar__notification--unread]="!notification.isRead"
                            (click)="handleNotificationClick(notification)"
                          >
                            <span class="navbar__notification-icon">
                              <app-icon [name]="iconFor(notification)" [size]="16"></app-icon>
                            </span>
                            <span class="navbar__notification-body">
                              <span class="navbar__notification-title">{{ notification.title }}</span>
                              <span class="navbar__notification-time">{{ getTimeAgo(notification.createdAt) }}</span>
                            </span>
                            @if (!notification.isRead) {
                              <span class="navbar__unread-dot"><span class="visually-hidden">Unread</span></span>
                            }
                          </button>
                        </li>
                      }
                    </ul>
                  }

                  <a routerLink="/notifications" class="navbar__panel-footer" (click)="closeMenus()">View all notifications</a>
                </div>
              }
            </div>

            <!-- Account menu -->
            <div class="navbar__menu navbar__user-menu">
              <button
                type="button"
                class="navbar__account"
                [attr.aria-expanded]="isUserMenuOpen()"
                aria-haspopup="true"
                (click)="toggleUserMenu($event)"
              >
                <span class="navbar__avatar">
                  @if (auth.currentUser()?.profilePhoto) {
                    <img [src]="auth.currentUser()?.profilePhoto" alt="">
                  } @else {
                    {{ initial() }}
                  }
                </span>
                <span class="navbar__account-name">{{ firstName() }}</span>
                <app-icon name="chevron-down" [size]="16" class="navbar__chevron" [class.navbar__chevron--open]="isUserMenuOpen()"></app-icon>
              </button>

              @if (isUserMenuOpen()) {
                <div class="navbar__panel navbar__panel--account" role="menu">
                  <div class="navbar__account-summary">
                    <span class="navbar__account-fullname">{{ auth.currentUser()?.name }}</span>
                    <span class="navbar__account-meta">{{ auth.currentUser()?.email }}</span>
                    <span class="navbar__role">{{ getUserRoleLabel() }}</span>
                  </div>
                  <div class="navbar__menu-group">
                    <a role="menuitem" routerLink="/dashboard" class="navbar__menu-item" (click)="closeMenus()"><app-icon name="home" [size]="16"></app-icon>Dashboard</a>
                    <a role="menuitem" routerLink="/bookings" class="navbar__menu-item" (click)="closeMenus()"><app-icon name="calendar" [size]="16"></app-icon>Bookings</a>
                    <a role="menuitem" routerLink="/dashboard/events" class="navbar__menu-item" (click)="closeMenus()"><app-icon name="party" [size]="16"></app-icon>My events</a>
                    @if (canProvideServices()) {
                      <a role="menuitem" routerLink="/dashboard/my-services" class="navbar__menu-item" (click)="closeMenus()"><app-icon name="store" [size]="16"></app-icon>My services</a>
                    }
                    <a role="menuitem" routerLink="/dashboard/earnings" class="navbar__menu-item" (click)="closeMenus()"><app-icon name="wallet" [size]="16"></app-icon>Earnings &amp; payouts</a>
                    @if (isAdmin()) {
                      <a role="menuitem" routerLink="/admin" class="navbar__menu-item" (click)="closeMenus()"><app-icon name="shield" [size]="16"></app-icon>Admin</a>
                    }
                  </div>
                  <div class="navbar__menu-group">
                    <a role="menuitem" routerLink="/profile" class="navbar__menu-item" (click)="closeMenus()"><app-icon name="settings" [size]="16"></app-icon>Profile &amp; settings</a>
                    <button role="menuitem" type="button" class="navbar__menu-item" (click)="logout()"><app-icon name="log-out" [size]="16"></app-icon>Log out</button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/auth/login" class="navbar__link navbar__login">Log in</a>
            <app-button routerLink="/auth/register" size="sm">Sign up</app-button>
          }

          <button
            type="button"
            class="navbar__icon-btn navbar__mobile-toggle"
            [attr.aria-expanded]="isMobileMenuOpen()"
            aria-controls="mobile-menu"
            [attr.aria-label]="isMobileMenuOpen() ? 'Close menu' : 'Open menu'"
            (click)="toggleMobileMenu()"
          >
            <app-icon [name]="isMobileMenuOpen() ? 'x' : 'menu'" [size]="22"></app-icon>
            @if (!isMobileMenuOpen() && messageService.unreadCount() > 0) {
              <span class="navbar__dot" aria-hidden="true"></span>
            }
          </button>
        </div>
      </div>

      @if (isMobileMenuOpen()) {
        <nav id="mobile-menu" class="navbar__mobile" aria-label="Mobile">
          <a routerLink="/events" routerLinkActive="active" class="navbar__mobile-link"><app-icon name="party"></app-icon>Events</a>
          <a routerLink="/services" routerLinkActive="active" class="navbar__mobile-link"><app-icon name="store"></app-icon>Vendors</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="navbar__mobile-link"><app-icon name="home"></app-icon>Dashboard</a>
            <a routerLink="/bookings" routerLinkActive="active" class="navbar__mobile-link"><app-icon name="calendar"></app-icon>Bookings</a>
            <a routerLink="/messages" routerLinkActive="active" class="navbar__mobile-link"><app-icon name="message"></app-icon>Messages
              @if (messageService.unreadCount() > 0) {
                <span class="navbar__count">{{ messageService.unreadCount() > 99 ? '99+' : messageService.unreadCount() }}<span class="visually-hidden"> unread</span></span>
              }
            </a>
            @if (canProvideServices()) {
              <a routerLink="/dashboard/my-services" routerLinkActive="active" class="navbar__mobile-link"><app-icon name="store"></app-icon>My services</a>
            }
            <a routerLink="/dashboard/earnings" routerLinkActive="active" class="navbar__mobile-link"><app-icon name="wallet"></app-icon>Earnings &amp; payouts</a>
            @if (isAdmin()) {
              <a routerLink="/admin" routerLinkActive="active" class="navbar__mobile-link"><app-icon name="shield"></app-icon>Admin</a>
            }
            <a routerLink="/profile" routerLinkActive="active" class="navbar__mobile-link"><app-icon name="settings"></app-icon>Profile &amp; settings</a>
            <button type="button" class="navbar__mobile-link" (click)="logout()"><app-icon name="log-out"></app-icon>Log out</button>
          } @else {
            <a routerLink="/auth/login" class="navbar__mobile-link"><app-icon name="user"></app-icon>Log in</a>
          }
        </nav>
      }
    </header>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .navbar {
      position: sticky;
      top: 0;
      z-index: $z-sticky;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: saturate(180%) blur(8px);
      border-bottom: 1px solid $border-light;
    }

    .navbar__container {
      @include container;
      height: $navbar-height;
      display: flex;
      align-items: center;
      gap: $spacing-8;
    }

    .navbar__logo {
      display: inline-flex;
      border-radius: $radius-default;
    }

    .navbar__nav {
      display: none;
      gap: $spacing-1;

      @include md {
        display: flex;
      }
    }

    .navbar__link {
      padding: $spacing-2 $spacing-3;
      border-radius: $radius-default;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: $text-secondary;
      transition: color $transition-fast, background-color $transition-fast;

      &:hover {
        color: $text-primary;
        background: $neutral-100;
      }

      &.active {
        color: $primary-700;
        background: $primary-50;
      }
    }

    .navbar__login {
      display: none;

      @include sm {
        display: inline-flex;
      }
    }

    .navbar__actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: $spacing-2;
    }

    .navbar__menu {
      position: relative;
    }

    .navbar__icon-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: $radius-default;
      background: transparent;
      color: $text-secondary;
      cursor: pointer;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }
    }

    .navbar__count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      margin-left: $spacing-1;
      padding: 0 5px;
      border-radius: $radius-full;
      background: $primary-600;
      color: $text-inverse;
      font-size: 11px;
      font-weight: $font-weight-semibold;
      line-height: 1;
    }

    .navbar__dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 9px;
      height: 9px;
      border-radius: $radius-full;
      border: 2px solid $bg-primary;
      background: $primary-600;
    }

    .navbar__badge {
      position: absolute;
      top: 4px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: $radius-full;
      border: 2px solid $bg-primary;
      background: $primary-600;
      color: $text-inverse;
      font-size: 10px;
      font-weight: $font-weight-semibold;
      line-height: 14px;
      text-align: center;
    }

    .navbar__account {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      height: 40px;
      padding: 0 $spacing-2 0 $spacing-1;
      border: none;
      border-radius: $radius-full;
      background: transparent;
      color: $text-primary;
      cursor: pointer;

      &:hover {
        background: $neutral-100;
      }
    }

    .navbar__avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: $radius-full;
      overflow: hidden;
      background: $primary-100;
      color: $primary-800;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .navbar__account-name {
      display: none;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;

      @include md {
        display: inline;
      }
    }

    .navbar__chevron {
      display: none;
      color: $text-tertiary;
      transition: transform $transition-fast;

      &--open {
        transform: rotate(180deg);
      }

      @include md {
        display: inline-flex;
      }
    }

    .navbar__panel {
      position: absolute;
      top: calc(100% + #{$spacing-2});
      right: 0;
      z-index: $z-dropdown;
      background: $bg-primary;
      border: 1px solid $border-light;
      border-radius: $radius-lg;
      box-shadow: $shadow-md;
      animation: panel-in 120ms ease-out;
      overflow: hidden;

      &--notifications {
        width: min(380px, calc(100vw - #{$spacing-8}));
        right: -48px;

        @include sm {
          right: 0;
        }
      }

      &--account {
        width: 260px;
      }
    }

    @keyframes panel-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .navbar__panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-3 $spacing-4;
      border-bottom: 1px solid $border-light;
    }

    .navbar__panel-title {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
    }

    .navbar__text-btn {
      border: none;
      background: none;
      color: $primary-600;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      cursor: pointer;
      border-radius: $radius-sm;

      &:hover {
        color: $primary-800;
      }
    }

    .navbar__panel-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-8 $spacing-6;
      color: $text-tertiary;
      text-align: center;

      p {
        margin: 0;
        font-size: $font-size-sm;
      }
    }

    .navbar__spinner {
      width: 22px;
      height: 22px;
      border: 2px solid $neutral-200;
      border-top-color: $primary-600;
      border-radius: $radius-full;
      animation: spin 0.8s linear infinite;
    }

    .navbar__notification-list {
      max-height: 360px;
      overflow-y: auto;
    }

    .navbar__notification {
      display: flex;
      align-items: flex-start;
      gap: $spacing-3;
      width: 100%;
      padding: $spacing-3 $spacing-4;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: $neutral-50;
      }

      &--unread {
        background: $primary-50;

        &:hover {
          background: $primary-100;
        }
      }
    }

    .navbar__notification-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      border-radius: $radius-full;
      background: $neutral-100;
      color: $text-secondary;
    }

    .navbar__notification-body {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .navbar__notification-title {
      font-size: $font-size-sm;
      color: $text-primary;
    }

    .navbar__notification-time {
      font-size: $font-size-xs;
      color: $text-tertiary;
    }

    .navbar__unread-dot {
      width: 8px;
      height: 8px;
      margin-top: 6px;
      border-radius: $radius-full;
      background: $primary-600;
      flex-shrink: 0;
    }

    .navbar__panel-footer {
      display: block;
      padding: $spacing-3;
      border-top: 1px solid $border-light;
      text-align: center;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }

    .navbar__account-summary {
      display: flex;
      flex-direction: column;
      padding: $spacing-3 $spacing-4;
      border-bottom: 1px solid $border-light;
    }

    .navbar__account-fullname {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
    }

    .navbar__account-meta {
      font-size: $font-size-xs;
      color: $text-tertiary;
      @include truncate;
    }

    .navbar__role {
      align-self: flex-start;
      margin-top: $spacing-2;
      @include badge;
      background: $neutral-100;
      color: $text-secondary;
    }

    .navbar__menu-group {
      padding: $spacing-1;

      & + & {
        border-top: 1px solid $border-light;
      }
    }

    .navbar__menu-item {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      width: 100%;
      padding: $spacing-2 $spacing-3;
      border: none;
      border-radius: $radius-default;
      background: none;
      color: $text-primary;
      font-size: $font-size-sm;
      text-align: left;
      cursor: pointer;

      app-icon {
        color: $text-tertiary;
      }

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }
    }

    .navbar__mobile-toggle {
      @include md {
        display: none;
      }
    }

    .navbar__mobile {
      display: flex;
      flex-direction: column;
      padding: $spacing-2 $spacing-4 $spacing-4;
      border-top: 1px solid $border-light;
      background: $bg-primary;

      @include md {
        display: none;
      }
    }

    .navbar__mobile-link {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      min-height: 48px;
      padding: 0 $spacing-3;
      border: none;
      border-radius: $radius-default;
      background: none;
      color: $text-primary;
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      text-align: left;
      cursor: pointer;

      app-icon {
        color: $text-tertiary;
      }

      &.active {
        background: $primary-50;
        color: $primary-700;

        app-icon {
          color: $primary-600;
        }
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  notificationService = inject(NotificationService);
  messageService = inject(MessageService);
  private router = inject(Router);

  isUserMenuOpen = signal(false);
  isMobileMenuOpen = signal(false);
  isNotificationsOpen = signal(false);
  isLoadingNotifications = signal(false);
  notifications = signal<Notification[]>([]);

  private documentClickListener: ((event: Event) => void) | null = null;

  constructor() {
    // Navigating anywhere closes open menus
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.closeMenus());
  }

  ngOnInit(): void {
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.navbar__menu')) {
        this.isNotificationsOpen.set(false);
        this.isUserMenuOpen.set(false);
      }
    };
    document.addEventListener('click', this.documentClickListener);
  }

  ngOnDestroy(): void {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }

  initial(): string {
    return this.auth.currentUser()?.name?.charAt(0)?.toUpperCase() || '?';
  }

  firstName(): string {
    return this.auth.currentUser()?.name?.split(' ')[0] || '';
  }

  closeMenus(): void {
    this.isUserMenuOpen.set(false);
    this.isNotificationsOpen.set(false);
    this.isMobileMenuOpen.set(false);
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen.set(false);
    this.isUserMenuOpen.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen.set(false);
    if (!this.isNotificationsOpen()) {
      this.loadNotifications();
    }
    this.isNotificationsOpen.update(v => !v);
  }

  loadNotifications(): void {
    this.isLoadingNotifications.set(true);
    this.notificationService.getNotifications(1, 10).subscribe({
      next: (response) => {
        this.notifications.set(response.data);
        this.isLoadingNotifications.set(false);
      },
      error: () => {
        this.isLoadingNotifications.set(false);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.update(notifications =>
        notifications.map(n => ({ ...n, isRead: true }))
      );
    });
  }

  handleNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe();
      this.notifications.update(notifications =>
        notifications.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
      );
    }
    this.closeMenus();
    this.router.navigateByUrl(notificationLink(notification));
  }

  iconFor(notification: Notification): string {
    return NOTIFICATION_ICONS[notification.type] || 'info';
  }

  getTimeAgo(date: Date): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  logout(): void {
    this.closeMenus();
    this.auth.logout().subscribe();
  }

  isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'admin';
  }

  canProvideServices(): boolean {
    const userType = this.auth.currentUser()?.userType;
    return userType === 'helper' || userType === 'all';
  }

  getUserRoleLabel(): string {
    if (this.isAdmin()) return 'Admin';
    const labels: Record<string, string> = {
      organizer: 'Organizer',
      helper: 'Vendor',
      attendee: 'Attendee',
      all: 'Organizer & vendor'
    };
    return labels[this.auth.currentUser()?.userType || ''] || 'Member';
  }
}
