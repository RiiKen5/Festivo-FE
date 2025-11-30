import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'no-token';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <div class="verify-email-page">
      <div class="verify-card">
        @switch (status()) {
          @case ('verifying') {
            <div class="status-icon status-icon--loading">
              <div class="spinner"></div>
            </div>
            <h1>Verifying Your Email</h1>
            <p>Please wait while we verify your email address...</p>
          }

          @case ('success') {
            <div class="status-icon status-icon--success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1>Email Verified!</h1>
            <p>{{ successMessage() }}</p>
            <p class="redirect-text">Redirecting to dashboard in {{ countdown() }} seconds...</p>
            <app-button (onClick)="goToDashboard()" fullWidth>
              Go to Dashboard Now
            </app-button>
          }

          @case ('error') {
            <div class="status-icon status-icon--error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h1>Verification Failed</h1>
            <p class="error-message">{{ errorMessage() }}</p>
            <div class="action-buttons">
              <app-button variant="secondary" routerLink="/auth/login">
                Back to Login
              </app-button>
              <app-button (onClick)="resendVerification()">
                Resend Email
              </app-button>
            </div>
          }

          @case ('no-token') {
            <div class="status-icon status-icon--warning">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1>Invalid Link</h1>
            <p>No verification token found. Please check your email for the correct link.</p>
            <app-button routerLink="/auth/login" fullWidth>
              Back to Login
            </app-button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .verify-email-page {
      min-height: 100vh;
      @include flex-center;
      background: $bg-gradient-primary;
      padding: $spacing-4;
    }

    .verify-card {
      @include card;
      max-width: 440px;
      width: 100%;
      padding: $spacing-10;
      text-align: center;

      h1 {
        font-size: $font-size-2xl;
        font-weight: $font-weight-bold;
        margin-bottom: $spacing-3;
        color: $text-primary;
      }

      p {
        color: $text-secondary;
        margin-bottom: $spacing-6;
        line-height: 1.6;
      }
    }

    .status-icon {
      width: 80px;
      height: 80px;
      border-radius: $radius-full;
      @include flex-center;
      margin: 0 auto $spacing-6;

      &--loading {
        background: $primary-100;
      }

      &--success {
        background: $success-light;
        color: $success;
      }

      &--error {
        background: $error-light;
        color: $error;
      }

      &--warning {
        background: $warning-light;
        color: $warning;
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid $primary-200;
      border-top-color: $primary-600;
      border-radius: $radius-full;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .redirect-text {
      font-size: $font-size-sm;
      color: $text-muted;
      margin-bottom: $spacing-4;
    }

    .error-message {
      color: $error;
      background: $error-light;
      padding: $spacing-3 $spacing-4;
      border-radius: $radius-default;
      margin-bottom: $spacing-6;
    }

    .action-buttons {
      display: flex;
      gap: $spacing-3;

      app-button {
        flex: 1;
      }
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  status = signal<VerificationStatus>('verifying');
  errorMessage = signal<string>('');
  successMessage = signal<string>('Your email has been verified successfully. You are now logged in.');
  countdown = signal<number>(5);

  private countdownInterval: any;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status.set('no-token');
      return;
    }

    this.verifyEmail(token);
  }

  private verifyEmail(token: string): void {
    this.auth.verifyEmail(token).subscribe({
      next: (response) => {
        if (response.success) {
          this.status.set('success');
          this.successMessage.set(response.message || 'Your email has been verified successfully. You are now logged in.');
          this.startCountdown();
        } else {
          this.status.set('error');
          this.errorMessage.set(response.message || 'Verification failed. Please try again.');
        }
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(
          err.error?.message ||
          'The verification link is invalid or has expired. Please request a new one.'
        );
      }
    });
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        clearInterval(this.countdownInterval);
        this.goToDashboard();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  goToDashboard(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/dashboard']);
  }

  resendVerification(): void {
    // This would typically open a modal or navigate to request new verification
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
