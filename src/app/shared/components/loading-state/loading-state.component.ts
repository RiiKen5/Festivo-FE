import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-state" [class.loading-state--fullscreen]="fullscreen">
      <div class="loading-state__spinner" [class.loading-state__spinner--sm]="size === 'sm'" [class.loading-state__spinner--lg]="size === 'lg'"></div>
      @if (message) {
        <p class="loading-state__message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .loading-state {
      @include flex-center;
      flex-direction: column;
      gap: $spacing-4;
      padding: $spacing-8;

      &--fullscreen {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.9);
        z-index: 1000;
      }
    }

    .loading-state__spinner {
      width: 40px;
      height: 40px;
      border: 3px solid $border-light;
      border-top-color: $primary-600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;

      &--sm {
        width: 24px;
        height: 24px;
        border-width: 2px;
      }

      &--lg {
        width: 56px;
        height: 56px;
        border-width: 4px;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state__message {
      color: $text-secondary;
      font-size: $font-size-sm;
      margin: 0;
    }
  `]
})
export class LoadingStateComponent {
  @Input() message = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullscreen = false;
}
