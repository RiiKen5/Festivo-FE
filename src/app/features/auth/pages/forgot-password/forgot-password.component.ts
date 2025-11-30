import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <a routerLink="/" class="auth-logo">
            <span class="auth-logo-icon">🎉</span>
            <span class="auth-logo-text">Festivo</span>
          </a>

          @if (!emailSent()) {
            <div class="auth-header">
              <h1 class="auth-title">Forgot password?</h1>
              <p class="auth-subtitle">No worries, we'll send you reset instructions.</p>
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

              <app-button
                type="submit"
                [loading]="isLoading()"
                [disabled]="form.invalid"
                fullWidth
              >
                Reset Password
              </app-button>
            </form>
          } @else {
            <div class="auth-success">
              <div class="auth-success-icon">📧</div>
              <h1 class="auth-title">Check your email</h1>
              <p class="auth-subtitle">
                We sent a password reset link to<br>
                <strong>{{ form.value.email }}</strong>
              </p>
              <p class="auth-hint">
                Didn't receive the email?
                <button class="auth-link" (click)="resendEmail()">Click to resend</button>
              </p>
            </div>
          }

          <a routerLink="/auth/login" class="auth-back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 12L6 8l4-4"/>
            </svg>
            Back to login
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .auth-page {
      min-height: 100vh;
      background: $bg-secondary;
    }

    .auth-container {
      @include flex-center;
      min-height: 100vh;
      padding: $spacing-6;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      background: $bg-primary;
      border-radius: $radius-xl;
      padding: $spacing-8;
      box-shadow: $shadow-lg;
      text-align: center;
    }

    .auth-logo {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      margin-bottom: $spacing-8;
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

    .auth-header {
      margin-bottom: $spacing-6;
    }

    .auth-title {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-2;
    }

    .auth-subtitle {
      color: $text-secondary;
    }

    .auth-form {
      text-align: left;
    }

    .form-group {
      margin-bottom: $spacing-5;
    }

    .auth-success {
      margin-bottom: $spacing-6;
    }

    .auth-success-icon {
      font-size: 3rem;
      margin-bottom: $spacing-4;
    }

    .auth-hint {
      margin-top: $spacing-4;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .auth-link {
      color: $primary-600;
      font-weight: $font-weight-medium;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        color: $primary-700;
      }
    }

    .auth-back {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      margin-top: $spacing-6;
      color: $text-secondary;
      font-weight: $font-weight-medium;

      &:hover {
        color: $text-primary;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  isLoading = signal(false);
  emailSent = signal(false);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  getError(field: string): string {
    const control = this.form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Please enter a valid email';
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const { email } = this.form.value;

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.emailSent.set(true);
      },
      error: (error) => {
        this.isLoading.set(false);
        // Still show success to prevent email enumeration
        this.emailSent.set(true);
      }
    });
  }

  resendEmail(): void {
    this.emailSent.set(false);
    setTimeout(() => this.onSubmit(), 100);
  }
}
