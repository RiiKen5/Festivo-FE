import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <a routerLink="/" class="auth-logo">
              <span class="auth-logo-icon">🎉</span>
              <span class="auth-logo-text">Festivo</span>
            </a>
            <h1 class="auth-title">Create your account</h1>
            <p class="auth-subtitle">Start planning and attending amazing events</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
              <app-input
                type="text"
                label="Full Name"
                placeholder="Enter your full name"
                formControlName="name"
                [error]="getError('name')"
                required
              ></app-input>
            </div>

            <div class="form-group">
              <app-input
                type="email"
                label="Email"
                placeholder="Enter your email"
                formControlName="email"
                [error]="getError('email')"
                required
              ></app-input>
            </div>

            <div class="form-group">
              <app-input
                type="tel"
                label="Phone (Optional)"
                placeholder="Enter your phone number"
                formControlName="phone"
                [error]="getError('phone')"
              ></app-input>
            </div>

            <div class="form-group">
              <app-input
                type="password"
                label="Password"
                placeholder="Create a password"
                formControlName="password"
                [error]="getError('password')"
                required
              ></app-input>
            </div>

            <div class="form-group">
              <label class="form-label">I want to</label>
              <div class="user-type-grid">
                @for (type of userTypes; track type.value) {
                  <label
                    class="user-type-option"
                    [class.user-type-option--selected]="form.get('userType')?.value === type.value"
                  >
                    <input
                      type="radio"
                      formControlName="userType"
                      [value]="type.value"
                    >
                    <span class="user-type-icon">{{ type.icon }}</span>
                    <span class="user-type-label">{{ type.label }}</span>
                    <span class="user-type-desc">{{ type.description }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="auth-terms">
              <label class="auth-checkbox">
                <input type="checkbox" formControlName="acceptTerms">
                <span>
                  I agree to the
                  <a href="/terms" target="_blank">Terms of Service</a>
                  and
                  <a href="/privacy" target="_blank">Privacy Policy</a>
                </span>
              </label>
            </div>

            <app-button
              type="submit"
              [loading]="isLoading()"
              [disabled]="form.invalid"
              fullWidth
            >
              Create Account
            </app-button>
          </form>

          <div class="auth-divider">
            <span>or sign up with</span>
          </div>

          <div class="auth-social">
            <button class="auth-social-btn">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          <p class="auth-footer">
            Already have an account?
            <a routerLink="/auth/login">Sign in</a>
          </p>
        </div>
      </div>

      <div class="auth-banner">
        <div class="auth-banner-content">
          <h2>Your events,<br>your way</h2>
          <ul class="auth-features">
            <li>
              <span class="feature-icon">✨</span>
              <span class="feature-text">Create and manage events effortlessly</span>
            </li>
            <li>
              <span class="feature-icon">🤝</span>
              <span class="feature-text">Connect with verified vendors</span>
            </li>
            <li>
              <span class="feature-icon">📊</span>
              <span class="feature-text">Track budgets and bookings</span>
            </li>
            <li>
              <span class="feature-icon">🎫</span>
              <span class="feature-text">Easy RSVP and check-in system</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .auth-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr;

      @include lg {
        grid-template-columns: 1fr 1fr;
      }
    }

    .auth-container {
      @include flex-center;
      padding: $spacing-6;
      background: $bg-primary;
      overflow-y: auto;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: $spacing-6 0;
    }

    .auth-header {
      text-align: center;
      margin-bottom: $spacing-6;
    }

    .auth-logo {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      margin-bottom: $spacing-6;
      text-decoration: none;
    }

    .auth-logo-icon {
      font-size: 2rem;
    }

    .auth-logo-text {
      font-family: $font-family-heading;
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      background: $bg-gradient-hero;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .auth-title {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-2;
    }

    .auth-subtitle {
      color: $text-secondary;
    }

    .auth-form {
      margin-bottom: $spacing-6;
    }

    .form-group {
      margin-bottom: $spacing-5;
    }

    .form-label {
      @include form-label;
    }

    .user-type-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-3;
    }

    .user-type-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-4;
      border: 2px solid $border-light;
      border-radius: $radius-lg;
      cursor: pointer;
      transition: all $transition-fast;
      text-align: center;

      input {
        display: none;
      }

      &:hover {
        border-color: $primary-300;
        background: $primary-50;
      }

      &--selected {
        border-color: $primary-600;
        background: $primary-50;
      }
    }

    .user-type-icon {
      font-size: 1.5rem;
      margin-bottom: $spacing-2;
    }

    .user-type-label {
      font-weight: $font-weight-semibold;
      font-size: $font-size-sm;
      margin-bottom: $spacing-1;
    }

    .user-type-desc {
      font-size: $font-size-xs;
      color: $text-secondary;
    }

    .auth-terms {
      margin-bottom: $spacing-6;
    }

    .auth-checkbox {
      display: flex;
      align-items: flex-start;
      gap: $spacing-2;
      font-size: $font-size-sm;
      color: $text-secondary;
      cursor: pointer;

      input {
        width: 16px;
        height: 16px;
        margin-top: 2px;
        accent-color: $primary-600;
      }

      a {
        color: $primary-600;
        font-weight: $font-weight-medium;

        &:hover {
          color: $primary-700;
        }
      }
    }

    .auth-divider {
      position: relative;
      text-align: center;
      margin: $spacing-6 0;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 100%;
        height: 1px;
        background: $border-light;
      }

      span {
        position: relative;
        background: $bg-primary;
        padding: 0 $spacing-4;
        color: $text-muted;
        font-size: $font-size-sm;
      }
    }

    .auth-social {
      display: flex;
      gap: $spacing-3;
    }

    .auth-social-btn {
      flex: 1;
      @include flex-center;
      gap: $spacing-2;
      height: 44px;
      border: 1px solid $border-default;
      border-radius: $radius-default;
      background: $bg-primary;
      font-weight: $font-weight-medium;
      color: $text-primary;
      transition: all $transition-fast;
      cursor: pointer;

      &:hover {
        background: $neutral-50;
        border-color: $border-dark;
      }
    }

    .auth-footer {
      text-align: center;
      margin-top: $spacing-6;
      color: $text-secondary;

      a {
        color: $primary-600;
        font-weight: $font-weight-medium;

        &:hover {
          color: $primary-700;
        }
      }
    }

    .auth-banner {
      display: none;
      background: $bg-gradient-hero;
      padding: $spacing-12;

      @include lg {
        @include flex-center;
      }
    }

    .auth-banner-content {
      color: $text-inverse;
      max-width: 480px;

      h2 {
        font-size: $font-size-4xl;
        font-weight: $font-weight-bold;
        line-height: 1.2;
        margin-bottom: $spacing-8;
      }
    }

    .auth-features {
      list-style: none;

      li {
        display: flex;
        align-items: center;
        gap: $spacing-4;
        margin-bottom: $spacing-4;
        font-size: $font-size-lg;
      }
    }

    .feature-icon {
      font-size: 1.5rem;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  isLoading = signal(false);

  userTypes = [
    { value: 'organizer', label: 'Organize Events', description: 'Plan & host events', icon: '🎯' },
    { value: 'helper', label: 'Offer Services', description: 'Provide services', icon: '🛠️' },
    { value: 'attendee', label: 'Attend Events', description: 'Discover & join', icon: '🎉' },
    { value: 'all', label: 'Do Everything', description: 'All of the above', icon: '⭐' }
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    userType: ['all', Validators.required],
    acceptTerms: [false, Validators.requiredTrue]
  });

  getError(field: string): string {
    const control = this.form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['minlength']) {
        const minLength = control.errors['minlength'].requiredLength;
        return `Must be at least ${minLength} characters`;
      }
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const { name, email, phone, password, userType } = this.form.value;

    this.auth.register({ name, email, phone, password, userType }).subscribe({
      next: () => {
        this.toast.success('Account Created!', 'Welcome to Festivo. Let\'s get started!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = error.error?.message || 'Registration failed. Please try again.';
        this.toast.error('Registration Failed', message);
      }
    });
  }
}
