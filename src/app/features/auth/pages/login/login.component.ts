import { Component, inject, signal, OnInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { environment } from '../../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
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
            <h1 class="auth-title">Welcome back</h1>
            <p class="auth-subtitle">Sign in to continue planning amazing events</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
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
                type="password"
                label="Password"
                placeholder="Enter your password"
                formControlName="password"
                [error]="getError('password')"
                required
              ></app-input>
            </div>

            <div class="auth-options">
              <label class="auth-remember">
                <input type="checkbox" formControlName="rememberMe">
                <span>Remember me</span>
              </label>
              <a routerLink="/auth/forgot-password" class="auth-forgot">Forgot password?</a>
            </div>

            <app-button
              type="submit"
              [loading]="isLoading()"
              [disabled]="form.invalid"
              fullWidth
            >
              Sign In
            </app-button>
          </form>

          <div class="auth-divider">
            <span>or continue with</span>
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
            Don't have an account?
            <a routerLink="/auth/register">Create one</a>
          </p>
        </div>
      </div>

      <div class="auth-banner">
        <div class="auth-banner-content">
          <h2>Plan events that<br>people remember</h2>
          <p>Join thousands of organizers creating unforgettable experiences with Festivo</p>
          <div class="auth-stats">
            <div class="auth-stat">
              <span class="auth-stat-value">10K+</span>
              <span class="auth-stat-label">Events Created</span>
            </div>
            <div class="auth-stat">
              <span class="auth-stat-value">50K+</span>
              <span class="auth-stat-label">Happy Guests</span>
            </div>
            <div class="auth-stat">
              <span class="auth-stat-value">1K+</span>
              <span class="auth-stat-label">Vendors</span>
            </div>
          </div>
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
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: $spacing-8;
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

    .auth-options {
      @include flex-between;
      margin-bottom: $spacing-6;
    }

    .auth-remember {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-sm;
      color: $text-secondary;
      cursor: pointer;

      input {
        width: 16px;
        height: 16px;
        accent-color: $primary-600;
      }
    }

    .auth-forgot {
      font-size: $font-size-sm;
      color: $primary-600;
      font-weight: $font-weight-medium;

      &:hover {
        color: $primary-700;
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
        margin-bottom: $spacing-4;
      }

      p {
        font-size: $font-size-lg;
        opacity: 0.9;
        margin-bottom: $spacing-10;
      }
    }

    .auth-stats {
      display: flex;
      gap: $spacing-8;
    }

    .auth-stat {
      text-align: center;
    }

    .auth-stat-value {
      display: block;
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
    }

    .auth-stat-label {
      font-size: $font-size-sm;
      opacity: 0.8;
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
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  isLoading = signal(false);
  isGoogleLoading = signal(false);

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
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
          // For access token flow, send to backend
          this.ngZone.run(() => {
            this.auth.googleAuth({ credential: tokenResponse.access_token }).subscribe({
              next: () => {
                this.toast.success('Welcome!', 'You have been signed in with Google.');
                const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
                this.router.navigateByUrl(returnUrl);
              },
              error: (error) => {
                this.isGoogleLoading.set(false);
                const message = error.error?.message || 'Google Sign-In failed. Please try again.';
                this.toast.error('Sign-In Failed', message);
              }
            });
          });
        } else {
          this.ngZone.run(() => {
            this.isGoogleLoading.set(false);
          });
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
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigateByUrl(returnUrl);
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

  getError(field: string): string {
    const control = this.form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['minlength']) return `Password must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const { email, password } = this.form.value;

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.toast.success('Welcome back!', 'You have been logged in successfully');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = error.error?.message || 'Invalid email or password';
        this.toast.error('Login Failed', message);
      }
    });
  }
}
