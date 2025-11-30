import { Component, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="card"
      [class.card--hoverable]="hoverable"
      [class.card--clickable]="clickable"
      [class.card--bordered]="bordered"
      [class.card--flat]="flat"
      (click)="clickable && onCardClick.emit($event)"
    >
      @if (image) {
        <div class="card__image" [style.background-image]="'url(' + image + ')'">
          @if (badge) {
            <span class="card__badge" [class]="'card__badge--' + badgeType">{{ badge }}</span>
          }
        </div>
      }
      <div class="card__content" [class.card__content--no-image]="!image">
        @if (title || subtitle) {
          <div class="card__header">
            @if (title) {
              <h3 class="card__title">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="card__subtitle">{{ subtitle }}</p>
            }
          </div>
        }
        <div class="card__body">
          <ng-content></ng-content>
        </div>
        @if (hasFooter) {
          <div class="card__footer">
            <ng-content select="[card-footer]"></ng-content>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .card {
      @include card;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &--hoverable {
        @include card-hover;
      }

      &--clickable {
        cursor: pointer;
      }

      &--bordered {
        border: 1px solid $border-light;
        box-shadow: none;
      }

      &--flat {
        box-shadow: none;
        background: transparent;
      }
    }

    .card__image {
      position: relative;
      height: 200px;
      background-size: cover;
      background-position: center;
      background-color: $neutral-200;
    }

    .card__badge {
      position: absolute;
      top: $spacing-3;
      right: $spacing-3;
      @include badge;

      &--primary { @include badge-primary; }
      &--success { @include badge-success; }
      &--warning { @include badge-warning; }
      &--error { @include badge-error; }
    }

    .card__content {
      padding: $card-padding;
      flex: 1;
      display: flex;
      flex-direction: column;

      &--no-image {
        padding-top: $card-padding;
      }
    }

    .card__header {
      margin-bottom: $spacing-3;
    }

    .card__title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      color: $text-primary;
      margin: 0;
      @include line-clamp(2);
    }

    .card__subtitle {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin: $spacing-1 0 0;
    }

    .card__body {
      flex: 1;
    }

    .card__footer {
      margin-top: $spacing-4;
      padding-top: $spacing-4;
      border-top: 1px solid $border-light;
    }
  `]
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() image?: string;
  @Input() badge?: string;
  @Input() badgeType: 'primary' | 'success' | 'warning' | 'error' = 'primary';
  @Input({ transform: booleanAttribute }) hoverable = false;
  @Input({ transform: booleanAttribute }) clickable = false;
  @Input({ transform: booleanAttribute }) bordered = false;
  @Input({ transform: booleanAttribute }) flat = false;
  @Input({ transform: booleanAttribute }) hasFooter = false;

  @Output() onCardClick = new EventEmitter<MouseEvent>();
}
