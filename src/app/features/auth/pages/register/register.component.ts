import { Component, inject, signal, OnInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { environment } from '../../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <!-- Email Verification Pending State -->
          @if (showVerificationMessage()) {
            <div class="verification-pending">
              <div class="verification-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h1 class="verification-title">Check Your Email</h1>
              <p class="verification-subtitle">
                We've sent a verification link to<br>
                <strong>{{ registeredEmail() }}</strong>
              </p>
              <div class="verification-steps">
                <div class="step">
                  <span class="step-number">1</span>
                  <span class="step-text">Open your email inbox</span>
                </div>
                <div class="step">
                  <span class="step-number">2</span>
                  <span class="step-text">Click the verification link</span>
                </div>
                <div class="step">
                  <span class="step-number">3</span>
                  <span class="step-text">Start using Festivo!</span>
                </div>
              </div>
              <p class="verification-note">
                Didn't receive the email? Check your spam folder or
                <button class="resend-btn" (click)="resendEmail()" [disabled]="isResending()">
                  {{ isResending() ? 'Sending...' : 'resend it' }}
                </button>
              </p>
              <div class="verification-actions">
                <app-button variant="secondary" (onClick)="backToRegister()">
                  Back to Register
                </app-button>
                <app-button routerLink="/auth/login">
                  Go to Login
                </app-button>
              </div>
            </div>
          } @else {
            <!-- Normal Registration Form -->
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
                type="text"
                label="City"
                placeholder="Enter your City"
                formControlName="city"
                [error]="getError('city')"
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
              <button type="button" class="auth-social-btn" (click)="signInWithGoogle()" [disabled]="isGoogleLoading()">
                @if (isGoogleLoading()) {
                  <div class="btn-spinner"></div>
                  Connecting...
                } @else {
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                }
              </button>
            </div>

            <p class="auth-footer">
              Already have an account?
              <a routerLink="/auth/login">Sign in</a>
            </p>
          }
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

    // Verification pending styles
    .verification-pending {
      text-align: center;
      padding: $spacing-4 0;
    }

    .verification-icon {
      width: 100px;
      height: 100px;
      margin: 0 auto $spacing-6;
      background: linear-gradient(135deg, $primary-100 0%, $secondary-100 100%);
      border-radius: $radius-full;
      @include flex-center;
      color: $primary-600;
    }

    .verification-title {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-3;
      color: $text-primary;
    }

    .verification-subtitle {
      color: $text-secondary;
      margin-bottom: $spacing-6;
      line-height: 1.6;

      strong {
        color: $primary-600;
        font-weight: $font-weight-semibold;
      }
    }

    .verification-steps {
      background: $neutral-50;
      border-radius: $radius-lg;
      padding: $spacing-5;
      margin-bottom: $spacing-6;
      text-align: left;
    }

    .step {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-2 0;

      &:not(:last-child) {
        border-bottom: 1px solid $border-light;
        margin-bottom: $spacing-2;
      }
    }

    .step-number {
      width: 28px;
      height: 28px;
      background: $primary-600;
      color: $text-inverse;
      border-radius: $radius-full;
      @include flex-center;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      flex-shrink: 0;
    }

    .step-text {
      font-size: $font-size-sm;
      color: $text-primary;
    }

    .verification-note {
      font-size: $font-size-sm;
      color: $text-muted;
      margin-bottom: $spacing-6;
    }

    .resend-btn {
      background: none;
      border: none;
      color: $primary-600;
      font-weight: $font-weight-medium;
      cursor: pointer;
      text-decoration: underline;

      &:hover {
        color: $primary-700;
      }

      &:disabled {
        color: $text-muted;
        cursor: not-allowed;
      }
    }

    .verification-actions {
      display: flex;
      gap: $spacing-3;

      app-button {
        flex: 1;
      }
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid $neutral-300;
      border-top-color: $primary-600;
      border-radius: $radius-full;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  isLoading = signal(false);
  isGoogleLoading = signal(false);
  showVerificationMessage = signal(false);
  registeredEmail = signal('');
  isResending = signal(false);

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

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
    city: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    userType: ['all', Validators.required],
    acceptTerms: [false, Validators.requiredTrue]
  });

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadGoogleScript();
    }
  }

  private loadGoogleScript(): void {
    // Check if script already exists
    if (document.getElementById('google-gsi-script')) {
      this.initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initializeGoogle();
    document.body.appendChild(script);
  }

  private initializeGoogle(): void {
    if (typeof google === 'undefined' || !google.accounts) {
      // Retry after a short delay if Google hasn't loaded yet
      setTimeout(() => this.initializeGoogle(), 100);
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleCallback(response),
      auto_select: false,
      cancel_on_tap_outside: true
    });
  }

  signInWithGoogle(): void {
    if (typeof google === 'undefined' || !google.accounts) {
      this.toast.error('Error', 'Google Sign-In is not available. Please try again.');
      return;
    }

    this.isGoogleLoading.set(true);

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to popup
        google.accounts.id.renderButton(
          document.createElement('div'),
          { theme: 'outline', size: 'large' }
        );
        // Try the One Tap prompt again or show manual popup
        this.showGooglePopup();
      }
    });
  }

  private showGooglePopup(): void {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: environment.googleClientId,
      scope: 'email profile',
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          this.handleGoogleTokenCallback(tokenResponse.access_token);
        } else {
          this.isGoogleLoading.set(false);
        }
      },
      error_callback: () => {
        this.ngZone.run(() => {
          this.isGoogleLoading.set(false);
          this.toast.error('Error', 'Google Sign-In was cancelled.');
        });
      }
    });
    client.requestAccessToken();
  }

  private handleGoogleCallback(response: any): void {
    if (response.credential) {
      this.ngZone.run(() => {
        this.isGoogleLoading.set(true);
        this.auth.googleAuth({ credential: response.credential }).subscribe({
          next: () => {
            this.toast.success('Welcome!', 'You have been signed in with Google.');
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.isGoogleLoading.set(false);
            const message = error.error?.message || 'Google Sign-In failed. Please try again.';
            this.toast.error('Sign-In Failed', message);
          }
        });
      });
    }
  }

  private handleGoogleTokenCallback(accessToken: string): void {
    // For token-based flow, you'd typically exchange this with your backend
    // For now, we'll use the credential flow which is more secure
    this.ngZone.run(() => {
      this.isGoogleLoading.set(false);
      this.toast.info('Info', 'Please use the Google One Tap prompt to sign in.');
    });
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['city']) return 'Please enter a valid city';
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
    const { name, email, phone, password, userType, city } = this.form.value;

    this.auth.register({ name, email, phone, password, userType, city }).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        // Check if email verification is required
        if (response.success && response.data?.emailSent) {
          // Show verification pending state
          this.registeredEmail.set(response.data.email || email);
          this.showVerificationMessage.set(true);
          this.toast.success('Almost There!', 'Please check your email to verify your account.');
        } else if (response.data?.tokens) {
          // Direct login (email verification disabled)
          this.toast.success('Account Created!', 'Welcome to Festivo. Let\'s get started!');
          this.router.navigate(['/dashboard']);
        } else {
          // Fallback - show verification message
          this.registeredEmail.set(email);
          this.showVerificationMessage.set(true);
          this.toast.success('Registration Successful!', response.message || 'Please check your email.');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = error.error?.message || 'Registration failed. Please try again.';
        this.toast.error('Registration Failed', message);
      }
    });
  }

  resendEmail(): void {
    this.isResending.set(true);
    // You would call an API endpoint here to resend the verification email
    // For now, we'll simulate it
    setTimeout(() => {
      this.isResending.set(false);
      this.toast.success('Email Sent!', 'A new verification email has been sent.');
    }, 2000);
  }

  backToRegister(): void {
    this.showVerificationMessage.set(false);
    this.registeredEmail.set('');
  }
}
