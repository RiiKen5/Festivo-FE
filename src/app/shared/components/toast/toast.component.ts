import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class]="'toast--' + toast.type"
          @toastAnimation
        >
          <div class="toast__icon">
            @switch (toast.type) {
              @case ('success') {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
              }
              @case ('error') {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                </svg>
              }
              @case ('warning') {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/>
                </svg>
              }
              @case ('info') {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                </svg>
              }
            }
          </div>
          <div class="toast__content">
            <p class="toast__title">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="toast__message">{{ toast.message }}</p>
            }
          </div>
          <button class="toast__close" (click)="toastService.dismiss(toast.id)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;

    .toast-container {
      position: fixed;
      top: $spacing-4;
      right: $spacing-4;
      z-index: $z-toast;
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      max-width: 400px;
      width: 100%;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: $spacing-3;
      padding: $spacing-4;
      background: $bg-primary;
      border-radius: $radius-lg;
      box-shadow: $shadow-lg;

      &--success {
        border-left: 4px solid $success;

        .toast__icon {
          color: $success;
        }
      }

      &--error {
        border-left: 4px solid $error;

        .toast__icon {
          color: $error;
        }
      }

      &--warning {
        border-left: 4px solid $warning;

        .toast__icon {
          color: $warning;
        }
      }

      &--info {
        border-left: 4px solid $info;

        .toast__icon {
          color: $info;
        }
      }
    }

    .toast__icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .toast__content {
      flex: 1;
      min-width: 0;
    }

    .toast__title {
      font-weight: $font-weight-medium;
      color: $text-primary;
      margin: 0;
    }

    .toast__message {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin: $spacing-1 0 0;
    }

    .toast__close {
      flex-shrink: 0;
      padding: $spacing-1;
      color: $text-muted;
      transition: color $transition-fast;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        color: $text-primary;
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
