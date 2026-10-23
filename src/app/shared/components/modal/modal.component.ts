import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { IconComponent } from '../icon/icon.component';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

let nextId = 0;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" @fadeIn (click)="closeOnBackdrop && close()">
        <div
          class="modal"
          [class]="'modal--' + size"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="showHeader && title ? titleId : null"
          [attr.aria-label]="!showHeader || !title ? 'Dialog' : null"
          @slideIn
          (click)="$event.stopPropagation()"
          (keydown.tab)="trapFocus($event)"
          (keydown.shift.tab)="trapFocus($event)"
        >
          @if (showHeader) {
            <div class="modal__header">
              <h2 class="modal__title" [id]="titleId">{{ title }}</h2>
              @if (showCloseButton) {
                <button type="button" class="modal__close" (click)="close()" aria-label="Close">
                  <app-icon name="x" [size]="20"></app-icon>
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
      background: rgba(24, 24, 27, 0.5);
      z-index: $z-modal-backdrop;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $spacing-4;

      // Bottom sheet on phones
      @include max-sm {
        align-items: flex-end;
        padding: 0;
      }
    }

    .modal {
      background: $bg-primary;
      border-radius: $radius-xl;
      box-shadow: $shadow-lg;
      max-height: calc(100vh - #{$spacing-8});
      display: flex;
      flex-direction: column;
      z-index: $z-modal;
      width: 100%;

      &--sm { max-width: 420px; }
      &--md { max-width: 560px; }
      &--lg { max-width: 720px; }
      &--xl { max-width: 960px; }

      &--full {
        width: calc(100vw - #{$spacing-8});
        height: calc(100vh - #{$spacing-8});
        max-width: none;
        max-height: none;
      }

      @include max-sm {
        max-width: none;
        max-height: 92vh;
        border-radius: $radius-xl $radius-xl 0 0;
      }
    }

    .modal__header {
      @include flex-between;
      gap: $spacing-4;
      padding: $spacing-4 $spacing-5;
      border-bottom: 1px solid $border-light;
    }

    .modal__title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      margin: 0;
      color: $text-primary;
    }

    .modal__close {
      @include flex-center;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      border: none;
      background: none;
      border-radius: $radius-default;
      color: $text-tertiary;
      cursor: pointer;
      transition: background-color $transition-fast, color $transition-fast;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }
    }

    .modal__body {
      padding: $spacing-5;
      overflow-y: auto;
      flex: 1;
      @include scrollbar-custom;

      &--no-header {
        padding-top: $spacing-6;
      }
    }

    .modal__footer {
      padding: $spacing-3 $spacing-5;
      border-top: 1px solid $border-light;
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: $spacing-2;
    }
  `]
})
export class ModalComponent implements OnChanges {
  private host = inject(ElementRef<HTMLElement>);

  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Input() showHeader = true;
  @Input() showFooter = false;
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;

  @Output() onClose = new EventEmitter<void>();

  titleId = `modal-title-${++nextId}`;
  private returnFocusTo: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen']) return;
    if (this.isOpen) {
      // Remember what opened the dialog, then move focus inside it
      this.returnFocusTo = document.activeElement as HTMLElement;
      setTimeout(() => {
        const dialog = this.host.nativeElement.querySelector('.modal') as HTMLElement | null;
        const body = dialog?.querySelector('.modal__body');
        const target = (body?.querySelector(FOCUSABLE) || dialog?.querySelector(FOCUSABLE)) as HTMLElement | null;
        target?.focus();
      });
    } else if (changes['isOpen'].previousValue) {
      this.returnFocusTo?.focus?.();
      this.returnFocusTo = null;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.closeOnEscape) {
      this.close();
    }
  }

  // Keep Tab within the dialog while it's open
  trapFocus(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    const dialog = this.host.nativeElement.querySelector('.modal') as HTMLElement;
    const items = Array.from(dialog.querySelectorAll(FOCUSABLE)) as HTMLElement[];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (keyboardEvent.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }

  close(): void {
    this.onClose.emit();
  }
}
