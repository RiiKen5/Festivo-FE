import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';

// Landing page for vendor outreach (home bakers, decorators, photographers).
// Every claim here matches config/policies.js and the Terms; keep them in sync.
@Component({
  selector: 'app-for-vendors',
  standalone: true,
  imports: [RouterModule, ButtonComponent, IconComponent],
  template: `
    <section class="hero">
      <div class="container hero__inner">
        <p class="eyebrow">For bakers, decorators, photographers and DJs</p>
        <h1 class="hero__title">Customers who pay before the event, not after.</h1>
        <p class="hero__lead">
          Send customers your Festivo link instead of chasing advances on WhatsApp. They book and pay online,
          Festivo holds the money, and it is paid out to you once the job is done.
        </p>
        <div class="hero__actions">
          <app-button [routerLink]="ctaLink()" [queryParams]="ctaParams()" size="lg" (onClick)="cta('hero')">List your service, free</app-button>
          <app-button routerLink="/services" variant="secondary" size="lg">See vendors on Festivo</app-button>
        </div>
        <p class="hero__note">No signup fee, no monthly plan. A 15% commission only on bookings paid online.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__head">
          <h2>What changes for you</h2>
        </div>
        <ul class="benefits">
          <li class="benefit">
            <app-icon name="wallet" [size]="22"></app-icon>
            <h3>Paid upfront</h3>
            <p>Customers pay the full amount or a 30% advance by UPI or card when they book. No more "I'll pay on the day".</p>
          </li>
          <li class="benefit">
            <app-icon name="shield" [size]="22"></app-icon>
            <h3>Protected from last-minute cancellations</h3>
            <p>If a customer cancels within 48 hours of the event, the payment is not refunded and comes to you. Earlier cancellations follow a published refund policy.</p>
          </li>
          <li class="benefit">
            <app-icon name="store" [size]="22"></app-icon>
            <h3>A booking page that works with Instagram</h3>
            <p>Your photos, prices, areas and verified reviews on one page. Put the link in your bio and send it with your quotes.</p>
          </li>
          <li class="benefit">
            <app-icon name="users" [size]="22"></app-icon>
            <h3>New customers nearby</h3>
            <p>People planning birthdays, house parties and community events in your city can find and request you.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section section--muted">
      <div class="container">
        <div class="section__head">
          <h2>How it works</h2>
        </div>
        <ol class="steps">
          <li class="step"><span class="step__num">1</span><h3>List your service</h3><p>Add photos, a starting price and the areas you serve. Takes about 10 minutes.</p></li>
          <li class="step"><span class="step__num">2</span><h3>Confirm requests</h3><p>Customers send a request for their date. You confirm with your final quote, or decline.</p></li>
          <li class="step"><span class="step__num">3</span><h3>Customer pays</h3><p>They pay online. Festivo holds the money until the booking is completed.</p></li>
          <li class="step"><span class="step__num">4</span><h3>Get paid out</h3><p>After the event, your share is paid to your UPI ID or bank account.</p></li>
        </ol>
      </div>
    </section>

    <section class="section">
      <div class="container faq">
        <div class="section__head">
          <h2>Questions vendors ask</h2>
        </div>
        <details>
          <summary>What does it cost?</summary>
          <p>Listing is free. When a customer pays online, Festivo keeps a 15% commission and the rest is paid out to you. Example: on a ₹2,000 booking you receive ₹1,700.</p>
        </details>
        <details>
          <summary>Can I keep using Instagram and WhatsApp?</summary>
          <p>Yes. Keep showing your work there, and use your Festivo link when it is time to book and take payment. You can also chat with customers inside Festivo.</p>
        </details>
        <details>
          <summary>Who decides the price?</summary>
          <p>You do. Customers see your starting price and propose a budget; you confirm with your final quote.</p>
        </details>
        <details>
          <summary>What if I have to cancel?</summary>
          <p>The customer gets a full refund of what they paid. Please cancel only when you truly cannot do the job.</p>
        </details>
        <details>
          <summary>When do I receive the money?</summary>
          <p>After the booking is marked complete (by the customer, or automatically 3 days after the event date), the payout is released to the UPI ID or bank account in your profile.</p>
        </details>
      </div>
    </section>

    <section class="section section--muted">
      <div class="container closing">
        <h2>Start taking protected bookings</h2>
        <p>Create your free listing now. You can edit it any time.</p>
        <app-button [routerLink]="ctaLink()" [queryParams]="ctaParams()" size="lg" (onClick)="cta('footer')">List your service, free</app-button>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .eyebrow {
      margin: 0 0 $spacing-3;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $primary-700;
    }

    .hero {
      background: linear-gradient(180deg, $primary-50 0%, $bg-secondary 100%);
      border-bottom: 1px solid $border-light;
    }

    .hero__inner {
      padding-top: $spacing-16;
      padding-bottom: $spacing-16;
    }

    .hero__title {
      @include display;
      color: $neutral-900;
      max-width: 18ch;
    }

    .hero__lead {
      margin: $spacing-5 0 0;
      max-width: 38rem;
      font-size: $font-size-lg;
      color: $text-secondary;
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-3;
      margin-top: $spacing-8;
    }

    .hero__note {
      margin: $spacing-4 0 0;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .section {
      padding: $spacing-16 0;

      &--muted {
        background: $bg-primary;
        border-top: 1px solid $border-light;
        border-bottom: 1px solid $border-light;
      }
    }

    .section__head {
      margin-bottom: $spacing-8;

      h2 {
        font-size: $font-size-2xl;
        letter-spacing: -0.02em;
      }
    }

    .benefits,
    .steps {
      display: grid;
      gap: $spacing-4;

      @include md {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .steps {
      @include lg {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .benefit,
    .step {
      @include card;

      h3 {
        margin: $spacing-3 0 $spacing-1;
        font-size: $font-size-base;
      }

      p {
        margin: 0;
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }

    .benefit app-icon {
      color: $primary-600;
    }

    .step__num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: $radius-full;
      background: $primary-600;
      color: $text-inverse;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
    }

    .faq {
      max-width: 48rem;

      details {
        padding: $spacing-4 0;
        border-bottom: 1px solid $border-light;
      }

      summary {
        cursor: pointer;
        font-weight: $font-weight-semibold;
      }

      p {
        margin: $spacing-2 0 0;
        color: $text-secondary;
      }
    }

    .closing {
      text-align: center;

      h2 {
        font-size: $font-size-2xl;
      }

      p {
        margin: $spacing-2 0 $spacing-6;
        color: $text-secondary;
      }
    }
  `]
})
export class ForVendorsComponent {
  private auth = inject(AuthService);
  private analytics = inject(AnalyticsService);

  ctaLink(): string {
    return this.auth.isAuthenticated() ? '/services/create' : '/auth/register';
  }

  ctaParams(): Record<string, string> | null {
    return this.auth.isAuthenticated() ? null : { as: 'vendor' };
  }

  cta(placement: string): void {
    this.analytics.track('vendor_cta_clicked', { placement });
  }
}
