import { Component } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

// Brand panel beside the sign-in/sign-up forms (large screens only)
@Component({
  selector: 'app-auth-aside',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="aside">
      <p class="aside__eyebrow">Designed by people. Organised by community.</p>
      <h2 class="aside__title">Your event, in the hands of people you can trust.</h2>
      <ul class="aside__points">
        <li>
          <app-icon name="shield-check" [size]="20"></app-icon>
          <span><strong>Payments held until the job is done.</strong> Vendors are paid after you mark the booking complete.</span>
        </li>
        <li>
          <app-icon name="check-circle" [size]="20"></app-icon>
          <span><strong>Clear cancellations.</strong> Refunds follow a published policy, issued automatically.</span>
        </li>
        <li>
          <app-icon name="star" [size]="20"></app-icon>
          <span><strong>Honest reviews.</strong> Only people with a completed booking can leave one.</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    :host {
      display: none;
      background: $primary-900;
      color: $primary-100;

      @include lg {
        display: flex;
        align-items: center;
      }
    }

    .aside {
      max-width: 460px;
      padding: $spacing-16;
    }

    .aside__eyebrow {
      margin: 0 0 $spacing-4;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $primary-300;
    }

    .aside__title {
      font-family: $font-family-display;
      font-size: 2.25rem;
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -0.01em;
      color: $text-inverse;
    }

    .aside__points {
      display: grid;
      gap: $spacing-5;
      margin-top: $spacing-10;

      li {
        display: flex;
        gap: $spacing-3;
        font-size: $font-size-sm;
        line-height: $line-height-relaxed;
      }

      app-icon {
        margin-top: 2px;
        color: $primary-300;
      }

      strong {
        color: $text-inverse;
      }
    }
  `]
})
export class AuthAsideComponent {}
