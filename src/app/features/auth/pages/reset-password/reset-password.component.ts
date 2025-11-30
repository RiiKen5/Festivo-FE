import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-reset-password',
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

          @if (!resetSuccess()) {
            <div class="auth-header">
              <h1 class="auth-title">Set new password</h1>
              <p class="auth-subtitle">Your new password must be different from previous passwords.</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
              <div class="form-group">
                <app-input
                  type="password"
                  label="New Password"
                  placeholder="Enter new password"
                  formControlName="password"
                  [error]="getError('password')"
                  required
                ></app-input>
              </div>

              <div class="form-group">
                <app-input
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  formControlName="confirmPassword"
                  [error]="getError('confirmPassword')"
                  required
                ></app-input>
              </div>

              <div class="password-requirements">
                <p class="requirements-title">Password must contain:</p>
                <ul class="requirements-list">
                  <li [class.valid]="hasMinLength()">At least 8 characters</li>
                  <li [class.valid]="hasUppercase()">One uppercase letter</li>
                  <li [class.valid]="hasNumber()">One number</li>
                </ul>
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
              <div class="auth-success-icon">✅</div>
              <h1 class="auth-title">Password reset successful</h1>
              <p class="auth-subtitle">
                Your password has been successfully reset.<br>
                You can now sign in with your new password.
              </p>
              <app-button routerLink="/auth/login" fullWidth>
                Continue to Login
              </app-button>
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

    .password-requirements {
      margin-bottom: $spacing-6;
      padding: $spacing-4;
      background: $neutral-50;
      border-radius: $radius-default;
    }

    .requirements-title {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: $text-secondary;
      margin-bottom: $spacing-2;
    }

    .requirements-list {
      font-size: $font-size-sm;
      color: $text-muted;

      li {
        display: flex;
        align-items: center;
        gap: $spacing-2;
        margin-bottom: $spacing-1;

        &::before {
          content: '○';
          color: $text-muted;
        }

        &.valid {
          color: $success;

          &::before {
            content: '✓';
            color: $success;
          }
        }
      }
    }

    .auth-success {
      margin-bottom: $spacing-6;
    }

    .auth-success-icon {
      font-size: 3rem;
      margin-bottom: $spacing-4;
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
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  resetSuccess = signal(false);
  private token = '';

  form: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      this.toast.error('Invalid Link', 'This password reset link is invalid or expired.');
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['minlength']) return 'Password must be at least 8 characters';
    }
    if (field === 'confirmPassword' && this.form.errors?.['passwordMismatch'] && control?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  hasMinLength(): boolean {
    return this.form.get('password')?.value?.length >= 8;
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.form.get('password')?.value || '');
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.form.get('password')?.value || '');
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const { password } = this.form.value;

    this.auth.resetPassword(this.token, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.resetSuccess.set(true);
        this.toast.success('Password Reset', 'Your password has been reset successfully.');
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = error.error?.message || 'Failed to reset password. The link may have expired.';
        this.toast.error('Reset Failed', message);
      }
    });
  }
}
