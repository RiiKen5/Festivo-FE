import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px) scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px) scale(0.98)' }))
      ])
    ])
  ],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" @fadeIn (click)="closeOnBackdrop && close()">
        <div
          class="modal"
          [class]="'modal--' + size"
          @slideIn
          (click)="$event.stopPropagation()"
        >
          @if (showHeader) {
            <div class="modal__header">
              <h2 class="modal__title">{{ title }}</h2>
              @if (showCloseButton) {
                <button class="modal__close" (click)="close()" aria-label="Close">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>
          }
          <div class="modal__body" [class.modal__body--no-header]="!showHeader">
            <ng-content></ng-content>
          </div>
          @if (showFooter) {
            <div class="modal__footer">
              <ng-content select="[modal-footer]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: $z-modal-backdrop;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $spacing-4;
    }

    .modal {
      background: $bg-primary;
      border-radius: $radius-xl;
      box-shadow: $shadow-xl;
      max-height: calc(100vh - #{$spacing-8});
      display: flex;
      flex-direction: column;
      z-index: $z-modal;

      &--sm {
        width: 100%;
        max-width: 400px;
      }

      &--md {
        width: 100%;
        max-width: 560px;
      }

      &--lg {
        width: 100%;
        max-width: 720px;
      }

      &--xl {
        width: 100%;
        max-width: 960px;
      }

      &--full {
        width: calc(100vw - #{$spacing-8});
        height: calc(100vh - #{$spacing-8});
        max-width: none;
        max-height: none;
      }
    }

    .modal__header {
      @include flex-between;
      padding: $spacing-5 $spacing-6;
      border-bottom: 1px solid $border-light;
    }

    .modal__title {
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
      margin: 0;
      color: $text-primary;
    }

    .modal__close {
      @include flex-center;
      width: 36px;
      height: 36px;
      border-radius: $radius-default;
      color: $text-secondary;
      transition: all $transition-fast;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }
    }

    .modal__body {
      padding: $spacing-6;
      overflow-y: auto;
      flex: 1;
      @include scrollbar-custom;

      &--no-header {
        padding-top: $spacing-8;
      }
    }

    .modal__footer {
      padding: $spacing-4 $spacing-6;
      border-top: 1px solid $border-light;
      display: flex;
      justify-content: flex-end;
      gap: $spacing-3;
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Input() showHeader = true;
  @Input() showFooter = false;
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;

  @Output() onClose = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.closeOnEscape) {
      this.close();
    }
  }

  close(): void {
    this.onClose.emit();
  }
}
