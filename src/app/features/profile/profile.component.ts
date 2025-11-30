import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NavbarComponent, ButtonComponent, InputComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="profile-page">
      <div class="container">
        <div class="profile-layout">
          <!-- Sidebar -->
          <aside class="profile-sidebar">
            <div class="profile-card">
              <div class="avatar-section">
                <div class="avatar-large">
                  @if (auth.currentUser()?.profilePhoto) {
                    <img [src]="auth.currentUser()?.profilePhoto" [alt]="auth.currentUser()?.name">
                  } @else {
                    <span>{{ auth.currentUser()?.name?.charAt(0)?.toUpperCase() }}</span>
                  }
                </div>
                <button class="avatar-edit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
              </div>
              <h2>{{ auth.currentUser()?.name }}</h2>
              <p class="user-email">{{ auth.currentUser()?.email }}</p>
              <div class="user-badges">
                <span class="badge badge--level">{{ auth.currentUser()?.level }}</span>
                @if (auth.currentUser()?.isVerified) {
                  <span class="badge badge--verified">Verified</span>
                }
              </div>
              <div class="user-stats">
                <div class="stat">
                  <span class="stat-value">{{ auth.currentUser()?.eventsOrganized || 0 }}</span>
                  <span class="stat-label">Events</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ auth.currentUser()?.eventsAttended || 0 }}</span>
                  <span class="stat-label">Attended</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ auth.currentUser()?.xpPoints || 0 }}</span>
                  <span class="stat-label">XP Points</span>
                </div>
              </div>
            </div>

            <nav class="profile-nav">
              <button
                class="nav-item"
                [class.active]="activeSection() === 'profile'"
                (click)="setSection('profile')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile Information
              </button>
              <button
                class="nav-item"
                [class.active]="activeSection() === 'security'"
                (click)="setSection('security')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Security
              </button>
              <button
                class="nav-item"
                [class.active]="activeSection() === 'notifications'"
                (click)="setSection('notifications')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                Notifications
              </button>
            </nav>
          </aside>

          <!-- Main Content -->
          <div class="profile-main">
            @switch (activeSection()) {
              @case ('profile') {
                <section class="settings-section">
                  <h2>Profile Information</h2>
                  <p class="section-desc">Update your personal information</p>

                  <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="settings-form">
                    <div class="form-row">
                      <div class="form-group">
                        <app-input
                          label="Full Name"
                          formControlName="name"
                          [error]="getError('name')"
                        ></app-input>
                      </div>
                      <div class="form-group">
                        <app-input
                          type="email"
                          label="Email"
                          formControlName="email"
                          [error]="getError('email')"
                          [disabled]="true"
                        ></app-input>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <app-input
                          type="tel"
                          label="Phone"
                          formControlName="phone"
                        ></app-input>
                      </div>
                      <div class="form-group">
                        <label class="form-label">User Type</label>
                        <select class="form-select" formControlName="userType">
                          <option value="organizer">Event Organizer</option>
                          <option value="helper">Service Provider</option>
                          <option value="attendee">Attendee</option>
                          <option value="all">All of the above</option>
                        </select>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Bio</label>
                      <textarea
                        class="form-textarea"
                        formControlName="bio"
                        placeholder="Tell us about yourself..."
                        rows="4"
                      ></textarea>
                    </div>

                    <div class="form-group">
                      <app-input
                        label="City"
                        formControlName="city"
                        placeholder="Your city"
                      ></app-input>
                    </div>

                    <div class="form-actions">
                      <app-button type="submit" [loading]="isSaving()">Save Changes</app-button>
                    </div>
                  </form>
                </section>
              }

              @case ('security') {
                <section class="settings-section">
                  <h2>Security Settings</h2>
                  <p class="section-desc">Manage your password and security preferences</p>

                  <form [formGroup]="securityForm" (ngSubmit)="changePassword()" class="settings-form">
                    <div class="form-group">
                      <app-input
                        type="password"
                        label="Current Password"
                        formControlName="currentPassword"
                      ></app-input>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <app-input
                          type="password"
                          label="New Password"
                          formControlName="newPassword"
                        ></app-input>
                      </div>
                      <div class="form-group">
                        <app-input
                          type="password"
                          label="Confirm New Password"
                          formControlName="confirmPassword"
                        ></app-input>
                      </div>
                    </div>

                    <div class="form-actions">
                      <app-button type="submit" [loading]="isChangingPassword()">Update Password</app-button>
                    </div>
                  </form>

                  <div class="security-options">
                    <div class="option-card">
                      <div class="option-info">
                        <h4>Two-Factor Authentication</h4>
                        <p>Add an extra layer of security to your account</p>
                      </div>
                      <label class="toggle">
                        <input type="checkbox" [checked]="auth.currentUser()?.twoFactorEnabled">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>

                    <div class="option-card">
                      <div class="option-info">
                        <h4>Email Verified</h4>
                        <p>{{ auth.currentUser()?.email }}</p>
                      </div>
                      @if (auth.currentUser()?.emailVerified) {
                        <span class="verified-text">✓ Verified</span>
                      } @else {
                        <app-button size="sm" variant="secondary">Verify</app-button>
                      }
                    </div>
                  </div>
                </section>
              }

              @case ('notifications') {
                <section class="settings-section">
                  <h2>Notification Preferences</h2>
                  <p class="section-desc">Choose how you want to be notified</p>

                  <div class="notification-options">
                    <div class="option-card">
                      <div class="option-info">
                        <h4>Email Notifications</h4>
                        <p>Receive updates via email</p>
                      </div>
                      <label class="toggle">
                        <input type="checkbox" [checked]="auth.currentUser()?.notifications?.email">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>

                    <div class="option-card">
                      <div class="option-info">
                        <h4>SMS Notifications</h4>
                        <p>Receive text messages for important updates</p>
                      </div>
                      <label class="toggle">
                        <input type="checkbox" [checked]="auth.currentUser()?.notifications?.sms">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>

                    <div class="option-card">
                      <div class="option-info">
                        <h4>Push Notifications</h4>
                        <p>Receive real-time notifications in browser</p>
                      </div>
                      <label class="toggle">
                        <input type="checkbox" [checked]="auth.currentUser()?.notifications?.push">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </section>
              }
            }
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .profile-page {
      min-height: calc(100vh - $navbar-height);
      background: $bg-secondary;
      padding: $spacing-8 0;
    }

    .profile-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-8;

      @include lg {
        grid-template-columns: 320px 1fr;
      }
    }

    .profile-sidebar {
      display: flex;
      flex-direction: column;
      gap: $spacing-6;
    }

    .profile-card {
      @include card;
      text-align: center;
    }

    .avatar-section {
      position: relative;
      display: inline-block;
      margin-bottom: $spacing-4;
    }

    .avatar-large {
      @include avatar(100px);
      @include flex-center;
      background: $bg-gradient-primary;
      color: $text-inverse;
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }
    }

    .avatar-edit {
      position: absolute;
      bottom: 0;
      right: 0;
      @include flex-center;
      width: 32px;
      height: 32px;
      background: $bg-primary;
      border: 2px solid $bg-primary;
      border-radius: $radius-full;
      box-shadow: $shadow-sm;
      cursor: pointer;
      color: $text-secondary;
      transition: all $transition-fast;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }
    }

    .user-email {
      color: $text-secondary;
      font-size: $font-size-sm;
      margin-bottom: $spacing-3;
    }

    .user-badges {
      display: flex;
      justify-content: center;
      gap: $spacing-2;
      margin-bottom: $spacing-6;
    }

    .badge {
      @include badge;

      &--level {
        background: $warning-light;
        color: $warning-dark;
      }

      &--verified {
        background: $success-light;
        color: $success-dark;
      }
    }

    .user-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-4;
      padding-top: $spacing-4;
      border-top: 1px solid $border-light;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $primary-600;
    }

    .stat-label {
      font-size: $font-size-xs;
      color: $text-secondary;
    }

    .profile-nav {
      @include card;
      padding: $spacing-2;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      width: 100%;
      padding: $spacing-3 $spacing-4;
      border-radius: $radius-default;
      font-weight: $font-weight-medium;
      color: $text-secondary;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: all $transition-fast;

      &:hover {
        background: $neutral-50;
        color: $text-primary;
      }

      &.active {
        background: $primary-50;
        color: $primary-600;
      }
    }

    .profile-main {
      min-width: 0;
    }

    .settings-section {
      @include card;

      h2 {
        font-size: $font-size-xl;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }
    }

    .section-desc {
      color: $text-secondary;
      margin-bottom: $spacing-6;
    }

    .settings-form {
      max-width: 600px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-5;

      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .form-group {
      margin-bottom: $spacing-5;
    }

    .form-label {
      @include form-label;
    }

    .form-select {
      @include input-base;
      @include input-md;
      cursor: pointer;
    }

    .form-textarea {
      @include input-base;
      padding: $spacing-4;
      resize: vertical;
    }

    .form-actions {
      padding-top: $spacing-4;
    }

    .security-options,
    .notification-options {
      margin-top: $spacing-8;
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .option-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-4;
      background: $neutral-50;
      border-radius: $radius-default;
    }

    .option-info {
      h4 {
        font-weight: $font-weight-medium;
        margin-bottom: $spacing-1;
      }

      p {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;

      input {
        opacity: 0;
        width: 0;
        height: 0;

        &:checked + .toggle-slider {
          background: $primary-600;
        }

        &:checked + .toggle-slider::before {
          transform: translateX(24px);
        }
      }
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: $neutral-300;
      border-radius: $radius-full;
      transition: background $transition-fast;

      &::before {
        content: '';
        position: absolute;
        height: 20px;
        width: 20px;
        left: 2px;
        bottom: 2px;
        background: white;
        border-radius: $radius-full;
        transition: transform $transition-fast;
      }
    }

    .verified-text {
      color: $success;
      font-weight: $font-weight-medium;
    }
  `]
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  activeSection = signal<'profile' | 'security' | 'notifications'>('profile');
  isSaving = signal(false);
  isChangingPassword = signal(false);

  profileForm: FormGroup = this.fb.group({
    name: [this.auth.currentUser()?.name || '', Validators.required],
    email: [{ value: this.auth.currentUser()?.email || '', disabled: true }],
    phone: [this.auth.currentUser()?.phone || ''],
    userType: [this.auth.currentUser()?.userType || 'all'],
    bio: [this.auth.currentUser()?.bio || ''],
    city: [this.auth.currentUser()?.city || '']
  });

  securityForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  setSection(section: 'profile' | 'security' | 'notifications'): void {
    this.activeSection.set(section);
  }

  getError(field: string): string {
    const control = this.profileForm.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
    }
    return '';
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);
    this.auth.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Profile Updated', 'Your profile has been updated successfully.');
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  changePassword(): void {
    if (this.securityForm.invalid) return;

    const { newPassword, confirmPassword } = this.securityForm.value;
    if (newPassword !== confirmPassword) {
      this.toast.error('Error', 'Passwords do not match');
      return;
    }

    this.isChangingPassword.set(true);
    this.auth.changePassword(this.securityForm.value.currentPassword, newPassword).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.securityForm.reset();
        this.toast.success('Password Changed', 'Your password has been updated successfully.');
      },
      error: () => {
        this.isChangingPassword.set(false);
      }
    });
  }
}
