import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
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
            <!-- User Menu -->
            <div class="navbar__user-menu" (click)="toggleUserMenu()">
              <div class="navbar__avatar">
                @if (auth.currentUser()?.profilePhoto) {
                  <img [src]="auth.currentUser()?.profilePhoto" [alt]="auth.currentUser()?.name">
                } @else {
                  <span>{{ auth.currentUser()?.name?.charAt(0)?.toUpperCase() }}</span>
                }
              </div>
              <span class="navbar__username hide-mobile">{{ auth.currentUser()?.name }}</span>
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
                  <a routerLink="/dashboard/bookings" class="navbar__dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/>
                    </svg>
                    My Bookings
                  </a>
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

    .navbar__username {
      font-weight: $font-weight-medium;
      color: $text-primary;
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
export class NavbarComponent {
  auth = inject(AuthService);

  isUserMenuOpen = signal(false);
  isMobileMenuOpen = signal(false);

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  logout(): void {
    this.isUserMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.auth.logout().subscribe();
  }
}
