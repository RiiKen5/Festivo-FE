import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="error-state" [class.error-state--compact]="compact">
      <div class="error-state__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          @switch (type) {
            @case ('network') {
              <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
            }
            @case ('server') {
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/>
              <line x1="6" y1="18" x2="6.01" y2="18"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            }
            @case ('not-found') {
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            }
            @default {
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            }
          }
        </svg>
      </div>

      <h3 class="error-state__title">{{ title || getDefaultTitle() }}</h3>
      <p class="error-state__message">{{ message || getDefaultMessage() }}</p>

      @if (showRetry) {
        <div class="error-state__actions">
          <app-button
            variant="primary"
            [loading]="isRetrying"
            (onClick)="onRetry.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            Try Again
          </app-button>
        </div>
      }
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .error-state {
      @include flex-center;
      flex-direction: column;
      padding: $spacing-12;
      text-align: center;

      &--compact {
        padding: $spacing-6;

        .error-state__icon {
          width: 64px;
          height: 64px;

          svg {
            width: 32px;
            height: 32px;
          }
        }

        .error-state__title {
          font-size: $font-size-base;
        }

        .error-state__message {
          font-size: $font-size-sm;
        }
      }
    }

    .error-state__icon {
      @include flex-center;
      width: 100px;
      height: 100px;
      background: $error-light;
      border-radius: $radius-full;
      color: $error;
      margin-bottom: $spacing-6;
    }

    .error-state__title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      color: $text-primary;
      margin: 0 0 $spacing-2;
    }

    .error-state__message {
      color: $text-secondary;
      margin: 0 0 $spacing-6;
      max-width: 400px;
    }

    .error-state__actions {
      display: flex;
      gap: $spacing-3;

      app-button {
        display: flex;
        align-items: center;
        gap: $spacing-2;
      }
    }
  `]
})
export class ErrorStateComponent {
  @Input() type: 'generic' | 'network' | 'server' | 'not-found' = 'generic';
  @Input() title = '';
  @Input() message = '';
  @Input() showRetry = true;
  @Input() isRetrying = false;
  @Input() compact = false;

  @Output() onRetry = new EventEmitter<void>();

  getDefaultTitle(): string {
    switch (this.type) {
      case 'network':
        return 'No Internet Connection';
      case 'server':
        return 'Server Error';
      case 'not-found':
        return 'Not Found';
      default:
        return 'Something Went Wrong';
    }
  }

  getDefaultMessage(): string {
    switch (this.type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'server':
        return 'We\'re having trouble connecting to our servers. Please try again later.';
      case 'not-found':
        return 'The content you\'re looking for doesn\'t exist or has been removed.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
