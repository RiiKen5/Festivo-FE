import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

// Explains why a list is empty and what to do next.
// Put the next action (buttons/links) inside the element.
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="empty" [class.empty--compact]="compact">
      <span class="empty__icon"><app-icon [name]="icon" [size]="compact ? 20 : 24"></app-icon></span>
      <h3 class="empty__title">{{ title }}</h3>
      @if (description) {
        <p class="empty__text">{{ description }}</p>
      }
      <div class="empty__actions"><ng-content></ng-content></div>
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: $spacing-12 $spacing-6;

      &--compact {
        padding: $spacing-8 $spacing-4;
      }
    }

    .empty__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      margin-bottom: $spacing-4;
      border-radius: $radius-full;
      background: $primary-50;
      color: $primary-600;

      .empty--compact & {
        width: 40px;
        height: 40px;
        margin-bottom: $spacing-3;
      }
    }

    .empty__title {
      margin: 0;
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
    }

    .empty__text {
      margin: $spacing-1 0 0;
      max-width: 380px;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .empty__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: $spacing-2;
      margin-top: $spacing-4;

      &:empty {
        display: none;
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() compact = false;
}
