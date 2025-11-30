import { Component, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [class]="buttonClasses"
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
    >
      @if (loading) {
        <span class="btn__spinner"></span>
      }
      @if (icon && iconPosition === 'left' && !loading) {
        <span class="btn__icon btn__icon--left">{{ icon }}</span>
      }
      <span class="btn__text">
        <ng-content></ng-content>
      </span>
      @if (icon && iconPosition === 'right' && !loading) {
        <span class="btn__icon btn__icon--right">{{ icon }}</span>
      }
    </button>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    button {
      @include button-base;
      position: relative;

      &.btn--primary {
        @include button-primary;
      }

      &.btn--secondary {
        @include button-secondary;
      }

      &.btn--ghost {
        @include button-ghost;
      }

      &.btn--danger {
        background: linear-gradient(135deg, $error 0%, $error-dark 100%);
        color: $text-inverse;
        box-shadow: 0 10px 40px -10px rgba($error, 0.4);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 44px -10px rgba($error, 0.5);
        }
      }

      &.btn--success {
        background: linear-gradient(135deg, $success 0%, $success-dark 100%);
        color: $text-inverse;
        box-shadow: 0 10px 40px -10px rgba($success, 0.4);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 44px -10px rgba($success, 0.5);
        }
      }

      &.btn--sm {
        @include button-sm;
      }

      &.btn--md {
        @include button-md;
      }

      &.btn--lg {
        @include button-lg;
      }

      &.btn--full {
        width: 100%;
      }

      &.btn--icon-only {
        padding: 0;
        aspect-ratio: 1;
      }
    }

    .btn__spinner {
      width: 18px;
      height: 18px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .btn__icon {
      display: flex;
      align-items: center;

      &--left {
        margin-right: $spacing-2;
      }

      &--right {
        margin-left: $spacing-2;
      }
    }

    .btn__text {
      display: flex;
      align-items: center;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() iconOnly = false;

  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const classes = [
      'btn',
      `btn--${this.variant}`,
      `btn--${this.size}`
    ];

    if (this.fullWidth) classes.push('btn--full');
    if (this.iconOnly) classes.push('btn--icon-only');

    return classes.join(' ');
  }
}
