import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <nav class="navbar">
      <div class="navbar__container">
        <!-- Logo -->
        <a routerLink="/" class="navbar__logo">
          <span class="navbar__logo-icon">🎉</span>
          <span class="navbar__logo-text">Festivo</span>
        </a>

        <!-- Desktop Navigation -->
        <div class="navbar__nav hide-mobile">
          <a routerLink="/events" routerLinkActive="active" class="navbar__link">Explore Events</a>
          <a routerLink="/services" routerLinkActive="active" class="navbar__link">Find Services</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" routerLinkActive="active" class="navbar__link">Dashboard</a>
          }
        </div>

        <!-- Auth Buttons -->
        <div class="navbar__actions">
          @if (auth.isAuthenticated()) {
            <!-- Notifications Bell -->
            <div class="navbar__notifications" (click)="toggleNotifications($event)">
              <div class="navbar__notification-bell">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                @if (notificationService.unreadCount() > 0) {
                  <span class="navbar__notification-badge">
                    {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
                  </span>
                }
              </div>

              @if (isNotificationsOpen()) {
                <div class="navbar__notification-dropdown" (click)="$event.stopPropagation()">
                  <div class="navbar__notification-header">
                    <span class="navbar__notification-title">Notifications</span>
                    @if (notificationService.unreadCount() > 0) {
                      <button class="navbar__mark-read" (click)="markAllAsRead()">Mark all read</button>
                    }
                  </div>

                  @if (isLoadingNotifications()) {
                    <div class="navbar__notification-loading">
                      <div class="navbar__notification-spinner"></div>
                    </div>
                  } @else if (notifications().length === 0) {
                    <div class="navbar__notification-empty">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 01-3.46 0"/>
                      </svg>
                      <span>No notifications yet</span>
                    </div>
                  } @else {
                    <div class="navbar__notification-list">
                      @for (notification of notifications(); track notification._id) {
                        <div
                          class="navbar__notification-item"
                          [class.navbar__notification-item--unread]="!notification.isRead"
                          (click)="handleNotificationClick(notification)">
                          <div class="navbar__notification-icon" [ngClass]="getNotificationIconClass(notification.type)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                                @case ('payment_received') {
                                  <line x1="12" y1="1" x2="12" y2="23"/>
                                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                                }
                                @case ('review_received') {
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                }
                                @case ('message_received') {
                                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                }
                                @case ('rsvp_received') {
                                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                  <circle cx="8.5" cy="7" r="4"/>
                                  <line x1="20" y1="8" x2="20" y2="14"/>
                                  <line x1="23" y1="11" x2="17" y2="11"/>
                                }
                                @default {
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="12" y1="16" x2="12" y2="12"/>
                                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                                }
                              }
                            </svg>
                          </div>
                          <div class="navbar__notification-content">
                            <div class="navbar__notification-text">{{ notification.title }}</div>
                            <div class="navbar__notification-time">{{ getTimeAgo(notification.createdAt) }}</div>
                          </div>
                          @if (!notification.isRead) {
                            <div class="navbar__notification-unread-dot"></div>
                          }
                        </div>
                      }
                    </div>
                  }

                  <a routerLink="/notifications" class="navbar__notification-footer" (click)="closeNotifications()">
                    View all notifications
                  </a>
                </div>
              }
            </div>

            <!-- User Menu -->
            <div class="navbar__user-menu" (click)="toggleUserMenu()">
              <div class="navbar__avatar">
                @if (auth.currentUser()?.profilePhoto) {
                  <img [src]="auth.currentUser()?.profilePhoto" [alt]="auth.currentUser()?.name">
                } @else {
                  <span>{{ auth.currentUser()?.name?.charAt(0)?.toUpperCase() }}</span>
                }
              </div>
              <div class="navbar__user-info hide-mobile">
                <span class="navbar__username">{{ auth.currentUser()?.name }}</span>
                <span class="navbar__role-badge" [ngClass]="getUserRoleClass()">{{ getUserRoleLabel() }}</span>
              </div>
              <svg class="navbar__chevron" [class.navbar__chevron--open]="isUserMenuOpen()" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 5.646a.5.5 0 01.708 0L8 8.293l2.646-2.647a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 010-.708z"/>
              </svg>

              @if (isUserMenuOpen()) {
                <div class="navbar__dropdown">
                  <a routerLink="/profile" class="navbar__dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    My Profile
                  </a>
                  <a routerLink="/dashboard/events" class="navbar__dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    My Events
                  </a>
                  <a routerLink="/bookings" class="navbar__dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/>
                    </svg>
                    My Bookings
                  </a>
                  @if (canProvideServices()) {
                    <a routerLink="/dashboard/my-services" class="navbar__dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                      </svg>
                      My Services
                    </a>
                  }
                  <a routerLink="/messages" class="navbar__dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    Messages
                  </a>
                  <div class="navbar__dropdown-divider"></div>
                  <button class="navbar__dropdown-item navbar__dropdown-item--danger" (click)="logout()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/auth/login" class="navbar__link hide-mobile">Login</a>
            <app-button routerLink="/auth/register" size="sm">Get Started</app-button>
          }

          <!-- Mobile Menu Toggle -->
          <button class="navbar__mobile-toggle hide-desktop" (click)="toggleMobileMenu()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (isMobileMenuOpen()) {
                <path d="M18 6L6 18M6 6l12 12"/>
              } @else {
                <path d="M3 12h18M3 6h18M3 18h18"/>
              }
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (isMobileMenuOpen()) {
        <div class="navbar__mobile-menu">
          <a routerLink="/events" routerLinkActive="active" class="navbar__mobile-link" (click)="closeMobileMenu()">
            Explore Events
          </a>
          <a routerLink="/services" routerLinkActive="active" class="navbar__mobile-link" (click)="closeMobileMenu()">
            Find Services
          </a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" routerLinkActive="active" class="navbar__mobile-link" (click)="closeMobileMenu()">
              Dashboard
            </a>
            <a routerLink="/bookings" routerLinkActive="active" class="navbar__mobile-link" (click)="closeMobileMenu()">
              My Bookings
            </a>
            @if (canProvideServices()) {
              <a routerLink="/dashboard/my-services" routerLinkActive="active" class="navbar__mobile-link" (click)="closeMobileMenu()">
                My Services
              </a>
            }
            <a routerLink="/messages" routerLinkActive="active" class="navbar__mobile-link" (click)="closeMobileMenu()">
              Messages
            </a>
            <a routerLink="/profile" routerLinkActive="active" class="navbar__mobile-link" (click)="closeMobileMenu()">
              Profile
            </a>
            <button class="navbar__mobile-link navbar__mobile-link--danger" (click)="logout()">
              Logout
            </button>
          } @else {
            <a routerLink="/auth/login" class="navbar__mobile-link" (click)="closeMobileMenu()">Login</a>
            <a routerLink="/auth/register" class="navbar__mobile-link navbar__mobile-link--primary" (click)="closeMobileMenu()">
              Get Started
            </a>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .navbar {
      position: sticky;
      top: 0;
      background: $bg-primary;
      border-bottom: 1px solid $border-light;
      z-index: $z-sticky;
    }

    .navbar__container {
      @include container;
      height: $navbar-height;
      @include flex-between;
    }

    .navbar__logo {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      text-decoration: none;
    }

    .navbar__logo-icon {
      font-size: 1.5rem;
    }

    .navbar__logo-text {
      font-family: $font-family-heading;
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      background: $bg-gradient-hero;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .navbar__nav {
      display: flex;
      align-items: center;
      gap: $spacing-1;
    }

    .navbar__link {
      padding: $spacing-2 $spacing-4;
      color: $text-secondary;
      font-weight: $font-weight-medium;
      border-radius: $radius-default;
      transition: all $transition-fast;
      text-decoration: none;

      &:hover {
        color: $text-primary;
        background: $neutral-100;
      }

      &.active {
        color: $primary-600;
        background: $primary-50;
      }
    }

    .navbar__actions {
      display: flex;
      align-items: center;
      gap: $spacing-3;
    }

    .navbar__user-menu {
      position: relative;
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-2;
      border-radius: $radius-default;
      cursor: pointer;
      transition: background $transition-fast;

      &:hover {
        background: $neutral-100;
      }
    }

    .navbar__avatar {
      @include avatar(36px);
      @include flex-center;
      background: $bg-gradient-primary;
      color: $text-inverse;
      font-weight: $font-weight-semibold;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }
    }

    .navbar__user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .navbar__username {
      font-weight: $font-weight-medium;
      color: $text-primary;
      font-size: $font-size-sm;
      line-height: 1.2;
    }

    .navbar__role-badge {
      display: inline-block;
      padding: 1px 6px;
      font-size: 10px;
      font-weight: $font-weight-semibold;
      border-radius: $radius-full;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.role--organizer {
        background: $info-light;
        color: $info-dark;
      }

      &.role--vendor {
        background: $success-light;
        color: $success-dark;
      }

      &.role--attendee {
        background: $neutral-100;
        color: $text-secondary;
      }

      &.role--pro {
        background: linear-gradient(135deg, $primary-500, $secondary-500);
        color: white;
      }
    }

    .navbar__chevron {
      color: $text-muted;
      transition: transform $transition-fast;

      &--open {
        transform: rotate(180deg);
      }
    }

    .navbar__dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: $spacing-2;
      min-width: 200px;
      background: $bg-primary;
      border-radius: $radius-lg;
      box-shadow: $shadow-lg;
      padding: $spacing-2;
      z-index: $z-dropdown;
    }

    .navbar__dropdown-item {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-3 $spacing-4;
      border-radius: $radius-default;
      color: $text-primary;
      font-weight: $font-weight-medium;
      text-decoration: none;
      transition: background $transition-fast;
      cursor: pointer;
      width: 100%;
      border: none;
      background: none;
      text-align: left;

      &:hover {
        background: $neutral-100;
      }

      &--danger {
        color: $error;

        &:hover {
          background: $error-light;
        }
      }

      svg {
        color: $text-secondary;
      }
    }

    .navbar__dropdown-divider {
      height: 1px;
      background: $border-light;
      margin: $spacing-2 0;
    }

    // Notifications Styles
    .navbar__notifications {
      position: relative;
    }

    .navbar__notification-bell {
      position: relative;
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-full;
      cursor: pointer;
      transition: background $transition-fast;
      color: $text-secondary;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }
    }

    .navbar__notification-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: $error;
      color: white;
      font-size: 10px;
      font-weight: $font-weight-bold;
      border-radius: $radius-full;
      @include flex-center;
    }

    .navbar__notification-dropdown {
      position: absolute;
      top: calc(100% + $spacing-2);
      right: 0;
      width: 360px;
      max-height: 480px;
      background: $bg-primary;
      border-radius: $radius-lg;
      box-shadow: $shadow-xl;
      overflow: hidden;
      z-index: $z-dropdown;

      @include max-md {
        position: fixed;
        top: $navbar-height;
        right: 0;
        left: 0;
        width: 100%;
        max-height: calc(100vh - $navbar-height);
        border-radius: 0;
      }
    }

    .navbar__notification-header {
      @include flex-between;
      padding: $spacing-4;
      border-bottom: 1px solid $border-light;
    }

    .navbar__notification-title {
      font-weight: $font-weight-semibold;
      color: $text-primary;
    }

    .navbar__mark-read {
      background: none;
      border: none;
      color: $primary-600;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      cursor: pointer;
      padding: 0;

      &:hover {
        text-decoration: underline;
      }
    }

    .navbar__notification-loading {
      @include flex-center;
      padding: $spacing-8;
    }

    .navbar__notification-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid $border-light;
      border-top-color: $primary-600;
      border-radius: $radius-full;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .navbar__notification-empty {
      @include flex-center;
      flex-direction: column;
      gap: $spacing-3;
      padding: $spacing-8;
      color: $text-muted;

      svg {
        opacity: 0.5;
      }
    }

    .navbar__notification-list {
      max-height: 340px;
      overflow-y: auto;
    }

    .navbar__notification-item {
      display: flex;
      align-items: flex-start;
      gap: $spacing-3;
      padding: $spacing-3 $spacing-4;
      cursor: pointer;
      transition: background $transition-fast;
      position: relative;

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
      @include flex-center;
      width: 36px;
      height: 36px;
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

    .navbar__notification-content {
      flex: 1;
      min-width: 0;
    }

    .navbar__notification-text {
      font-size: $font-size-sm;
      color: $text-primary;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .navbar__notification-time {
      font-size: $font-size-xs;
      color: $text-muted;
      margin-top: 2px;
    }

    .navbar__notification-unread-dot {
      width: 8px;
      height: 8px;
      background: $primary-600;
      border-radius: $radius-full;
      flex-shrink: 0;
      margin-top: 6px;
    }

    .navbar__notification-footer {
      display: block;
      padding: $spacing-3 $spacing-4;
      text-align: center;
      color: $primary-600;
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
      text-decoration: none;
      border-top: 1px solid $border-light;
      transition: background $transition-fast;

      &:hover {
        background: $neutral-50;
      }
    }

    .navbar__mobile-toggle {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-default;
      color: $text-primary;
      transition: background $transition-fast;

      &:hover {
        background: $neutral-100;
      }
    }

    .navbar__mobile-menu {
      display: flex;
      flex-direction: column;
      padding: $spacing-4;
      border-top: 1px solid $border-light;
      background: $bg-primary;
    }

    .navbar__mobile-link {
      display: block;
      padding: $spacing-3 $spacing-4;
      color: $text-primary;
      font-weight: $font-weight-medium;
      border-radius: $radius-default;
      text-decoration: none;
      transition: background $transition-fast;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      width: 100%;

      &:hover {
        background: $neutral-100;
      }

      &.active {
        color: $primary-600;
        background: $primary-50;
      }

      &--primary {
        color: $primary-600;
        background: $primary-50;

        &:hover {
          background: $primary-100;
        }
      }

      &--danger {
        color: $error;

        &:hover {
          background: $error-light;
        }
      }
    }

    @include max-md {
      .hide-mobile {
        display: none !important;
      }
    }

    @include md {
      .hide-desktop {
        display: none !important;
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  notificationService = inject(NotificationService);
  private router = inject(Router);

  isUserMenuOpen = signal(false);
  isMobileMenuOpen = signal(false);
  isNotificationsOpen = signal(false);
  isLoadingNotifications = signal(false);
  notifications = signal<Notification[]>([]);

  private documentClickListener: ((event: Event) => void) | null = null;
  private notificationCountLoaded = false;

  constructor() {
    // Use effect to watch for auth state changes and load notification count
    effect(() => {
      const isAuthenticated = this.auth.isAuthenticated();
      const isLoading = this.auth.isLoading();

      // Only load notifications when auth is done loading and user is authenticated
      if (!isLoading && isAuthenticated && !this.notificationCountLoaded) {
        this.notificationCountLoaded = true;
        this.notificationService.refreshUnreadCount();
      }

      // Reset flag when user logs out
      if (!isAuthenticated) {
        this.notificationCountLoaded = false;
      }
    });
  }

  ngOnInit(): void {
    // Close dropdowns when clicking outside
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.navbar__notifications') && !target.closest('.navbar__user-menu')) {
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

  toggleUserMenu(): void {
    this.isNotificationsOpen.set(false);
    this.isUserMenuOpen.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen.set(false);

    if (!this.isNotificationsOpen()) {
      this.loadNotifications();
    }
    this.isNotificationsOpen.update(v => !v);
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
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
    // Mark as read if not already
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe();
      this.notifications.update(notifications =>
        notifications.map(n =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
    }

    // Navigate based on notification type
    this.closeNotifications();
    const data = notification.data;

    if (data?.bookingId) {
      this.router.navigate(['/bookings', data.bookingId]);
    } else if (data?.eventId) {
      this.router.navigate(['/events', data.eventId]);
    } else if (data?.serviceId) {
      this.router.navigate(['/services', data.serviceId]);
    } else {
      this.router.navigate(['/notifications']);
    }
  }

  getNotificationIconClass(type: string): string {
    const iconClasses: Record<string, string> = {
      'booking_request': 'icon--booking',
      'booking_confirmed': 'icon--success',
      'booking_cancelled': 'icon--default',
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  }

  logout(): void {
    this.isUserMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.isNotificationsOpen.set(false);
    this.auth.logout().subscribe();
  }

  /**
   * Check if user can provide services (helper or all)
   */
  canProvideServices(): boolean {
    const userType = this.auth.currentUser()?.userType;
    return userType === 'helper' || userType === 'all';
  }

  /**
   * Get user role display label
   */
  getUserRoleLabel(): string {
    const userType = this.auth.currentUser()?.userType;
    const roleLabels: Record<string, string> = {
      'organizer': 'Organizer',
      'helper': 'Vendor',
      'attendee': 'Attendee',
      'all': 'Pro'
    };
    return roleLabels[userType || ''] || 'User';
  }

  /**
   * Get role badge color class
   */
  getUserRoleClass(): string {
    const userType = this.auth.currentUser()?.userType;
    const roleClasses: Record<string, string> = {
      'organizer': 'role--organizer',
      'helper': 'role--vendor',
      'attendee': 'role--attendee',
      'all': 'role--pro'
    };
    return roleClasses[userType || ''] || '';
  }
}
