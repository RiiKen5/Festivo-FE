import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EventCardComponent } from '../../shared/components/listing-cards/event-card.component';
import { VendorCardComponent } from '../../shared/components/listing-cards/vendor-card.component';
import { EventService } from '../../core/services/event.service';
import { ServiceService } from '../../core/services/service.service';
import { AuthService } from '../../core/services/auth.service';
import { Event } from '../../core/models/event.model';
import { Service } from '../../core/models/service.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, IconComponent, EventCardComponent, VendorCardComponent],
  template: `
    <section class="hero">
      <div class="container hero__inner">
        <div class="hero__copy">
          <p class="eyebrow">Designed by people. Organised by community.</p>
          <h1 class="hero__title">Plan the event. Book the people who make it happen.</h1>
          <p class="hero__lead">
            Find local bakers, decorators, photographers and more. Pay through Festivo and your money is held
            until the job is done.
          </p>
          <div class="hero__actions">
            <app-button routerLink="/services" size="lg">Find vendors</app-button>
            <app-button [routerLink]="auth.isAuthenticated() ? '/events/create' : '/auth/register'" variant="secondary" size="lg">Plan an event</app-button>
          </div>
          <ul class="hero__trust">
            <li><app-icon name="shield-check" [size]="18"></app-icon>Payments held until completion</li>
            <li><app-icon name="check-circle" [size]="18"></app-icon>Clear refund policy</li>
            <li><app-icon name="ticket" [size]="18"></app-icon>Tickets &amp; guest check-in</li>
          </ul>
        </div>

        <!-- Illustration of how a booking looks; not real data -->
        <div class="hero__visual" aria-hidden="true">
          <div class="preview">
            <div class="preview__head">
              <span class="preview__avatar"><app-icon name="cake" [size]="20"></app-icon></span>
              <div>
                <p class="preview__title">Custom birthday cake</p>
                <p class="preview__sub">Booked for Sat, 6:30 pm</p>
              </div>
              <span class="preview__status">Confirmed</span>
            </div>
            <div class="preview__row"><span>Vendor's quote</span><strong>₹2,000</strong></div>
            <div class="preview__row"><span>Advance paid</span><strong>₹600</strong></div>
            <div class="preview__note">
              <app-icon name="shield-check" [size]="16"></app-icon>
              Held by Festivo until you mark it delivered
            </div>
          </div>
          <div class="preview preview--small">
            <span class="preview__avatar preview__avatar--soft"><app-icon name="users" [size]="18"></app-icon></span>
            <div>
              <p class="preview__title">Guest list</p>
              <p class="preview__sub">18 going · 6 checked in</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__head">
          <h2>How booking works</h2>
          <p>No advance cash to strangers, no chasing refunds.</p>
        </div>
        <ol class="steps">
          <li class="step">
            <span class="step__num">1</span>
            <h3>Request a vendor</h3>
            <p>Pick your event and tell the vendor what you need. They confirm with their final price.</p>
          </li>
          <li class="step">
            <span class="step__num">2</span>
            <h3>Pay securely</h3>
            <p>Pay the full amount or a 30% advance by UPI or card. Festivo holds it for you.</p>
          </li>
          <li class="step">
            <span class="step__num">3</span>
            <h3>Celebrate</h3>
            <p>After the event, mark the booking complete and the vendor is paid. Then leave a review.</p>
          </li>
        </ol>
      </div>
    </section>

    @if (isLoadingEvents() || upcomingEvents().length) {
      <section class="section section--muted">
        <div class="container">
          <div class="section__head section__head--row">
            <div>
              <h2>Upcoming events</h2>
              <p>Public events you can join or buy tickets for.</p>
            </div>
            <a routerLink="/events" class="section__link">See all events <app-icon name="arrow-right" [size]="16"></app-icon></a>
          </div>
          <div class="grid">
            @if (isLoadingEvents()) {
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="skeleton-card"><div class="skeleton skeleton--image"></div><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div></div>
              }
            } @else {
              @for (event of upcomingEvents(); track event._id) {
                <app-event-card [event]="event"></app-event-card>
              }
            }
          </div>
        </div>
      </section>
    }

    @if (isLoadingServices() || topServices().length) {
      <section class="section">
        <div class="container">
          <div class="section__head section__head--row">
            <div>
              <h2>Vendors on Festivo</h2>
              <p>Cakes, decor, photography, music and more.</p>
            </div>
            <a routerLink="/services" class="section__link">Browse vendors <app-icon name="arrow-right" [size]="16"></app-icon></a>
          </div>
          <div class="grid">
            @if (isLoadingServices()) {
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="skeleton-card"><div class="skeleton skeleton--image"></div><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div></div>
              }
            } @else {
              @for (service of topServices(); track service._id) {
                <app-vendor-card [service]="service"></app-vendor-card>
              }
            }
          </div>
        </div>
      </section>
    }

    <section class="section">
      <div class="container">
        <div class="vendors">
          <div class="vendors__copy">
            <p class="eyebrow">For vendors</p>
            <h2>Get booked for events near you</h2>
            <p>List your service with photos and prices. Accept requests, send your quote and get paid to your UPI or bank account after each event.</p>
            <ul class="vendors__list">
              <li><app-icon name="check" [size]="18"></app-icon>Free to list. A fee applies only to bookings paid through Festivo.</li>
              <li><app-icon name="check" [size]="18"></app-icon>Payment is collected before the event, so no last-minute ghosting.</li>
              <li><app-icon name="check" [size]="18"></app-icon>Reviews only come from real, completed bookings.</li>
            </ul>
            <app-button [routerLink]="auth.isAuthenticated() ? '/services/create' : '/auth/register'">List your service</app-button>
          </div>
          <div class="vendors__panel" aria-hidden="true">
            <div class="vendors__stat"><app-icon name="inbox" [size]="20"></app-icon><span>New booking request</span></div>
            <div class="vendors__stat"><app-icon name="wallet" [size]="20"></app-icon><span>Payout sent to your UPI</span></div>
            <div class="vendors__stat"><app-icon name="star" [size]="20"></app-icon><span>New 5-star review</span></div>
          </div>
        </div>
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

    // Hero
    .hero {
      background: linear-gradient(180deg, $primary-50 0%, $bg-secondary 100%);
      border-bottom: 1px solid $border-light;
    }

    .hero__inner {
      display: grid;
      gap: $spacing-12;
      align-items: center;
      padding-top: $spacing-16;
      padding-bottom: $spacing-16;

      @include lg {
        grid-template-columns: 1.15fr 1fr;
        padding-top: $spacing-20;
        padding-bottom: $spacing-20;
      }
    }

    .hero__title {
      @include display;
      color: $neutral-900;
      max-width: 14ch;
    }

    .hero__lead {
      margin: $spacing-5 0 0;
      max-width: 34rem;
      font-size: $font-size-lg;
      color: $text-secondary;
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-3;
      margin-top: $spacing-8;
    }

    .hero__trust {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-3 $spacing-6;
      margin-top: $spacing-8;

      li {
        display: inline-flex;
        align-items: center;
        gap: $spacing-2;
        font-size: $font-size-sm;
        color: $text-secondary;
      }

      app-icon {
        color: $primary-600;
      }
    }

    .hero__visual {
      position: relative;
      display: none;
      justify-self: center;
      width: 100%;
      max-width: 420px;

      @include md {
        display: block;
      }
    }

    .preview {
      padding: $spacing-5;
      border: 1px solid $border-light;
      border-radius: $radius-xl;
      background: $bg-primary;
      box-shadow: $shadow-md;

      &--small {
        position: absolute;
        right: -$spacing-6;
        bottom: -$spacing-10;
        display: flex;
        align-items: center;
        gap: $spacing-3;
        padding: $spacing-4;
        width: 230px;
      }
    }

    .preview__head {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding-bottom: $spacing-4;
      margin-bottom: $spacing-2;
      border-bottom: 1px solid $border-light;
    }

    .preview__avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: $radius-md;
      background: $primary-100;
      color: $primary-700;

      &--soft {
        background: $neutral-100;
        color: $text-secondary;
      }
    }

    .preview__title {
      margin: 0;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
    }

    .preview__sub {
      margin: 0;
      font-size: $font-size-xs;
      color: $text-tertiary;
    }

    .preview__status {
      margin-left: auto;
      @include badge;
      background: $success-light;
      color: $success-dark;
    }

    .preview__row {
      display: flex;
      justify-content: space-between;
      padding: $spacing-2 0;
      font-size: $font-size-sm;
      color: $text-secondary;

      strong {
        color: $text-primary;
      }
    }

    .preview__note {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      margin-top: $spacing-3;
      padding: $spacing-3;
      border-radius: $radius-default;
      background: $primary-50;
      color: $primary-800;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }

    // Sections
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

      p {
        margin: $spacing-1 0 0;
        color: $text-secondary;
      }

      &--row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: $spacing-4;
        flex-wrap: wrap;
      }
    }

    .section__link {
      display: inline-flex;
      align-items: center;
      gap: $spacing-1;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
    }

    .steps {
      display: grid;
      gap: $spacing-4;
      counter-reset: none;

      @include md {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .step {
      @include card;

      h3 {
        margin: $spacing-4 0 $spacing-1;
        font-size: $font-size-base;
      }

      p {
        margin: 0;
        font-size: $font-size-sm;
        color: $text-secondary;
      }
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

    .grid {
      display: grid;
      gap: $spacing-5;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }

    .skeleton-card {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      padding-bottom: $spacing-4;
      border: 1px solid $border-light;
      border-radius: $radius-lg;
      background: $bg-primary;
      overflow: hidden;

      .skeleton--title, .skeleton--text {
        margin: 0 $spacing-4;
        width: auto;
      }
    }

    // For vendors
    .vendors {
      display: grid;
      gap: $spacing-10;
      align-items: center;
      padding: $spacing-10;
      border-radius: $radius-xl;
      background: $neutral-900;
      color: $neutral-200;

      @include md {
        grid-template-columns: 1.3fr 1fr;
      }

      @include max-sm {
        padding: $spacing-6;
      }

      h2 {
        color: $text-inverse;
        font-size: $font-size-2xl;
        letter-spacing: -0.02em;
      }

      .eyebrow {
        color: $primary-300;
      }
    }

    .vendors__copy > p {
      margin: $spacing-3 0 0;
      color: $neutral-300;
    }

    .vendors__list {
      display: grid;
      gap: $spacing-2;
      margin: $spacing-5 0 $spacing-6;

      li {
        display: flex;
        gap: $spacing-2;
        font-size: $font-size-sm;
      }

      app-icon {
        color: $primary-300;
        margin-top: 2px;
      }
    }

    .vendors__panel {
      display: grid;
      gap: $spacing-3;
    }

    .vendors__stat {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-4;
      border: 1px solid $neutral-700;
      border-radius: $radius-lg;
      background: $neutral-800;
      color: $text-inverse;
      font-size: $font-size-sm;

      app-icon {
        color: $primary-300;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private eventService = inject(EventService);
  private serviceService = inject(ServiceService);
  auth = inject(AuthService);

  upcomingEvents = signal<Event[]>([]);
  topServices = signal<Service[]>([]);
  isLoadingEvents = signal(true);
  isLoadingServices = signal(true);

  ngOnInit(): void {
    this.eventService.getUpcomingEvents().subscribe({
      next: (response) => {
        this.upcomingEvents.set(response.data.slice(0, 4));
        this.isLoadingEvents.set(false);
      },
      error: () => this.isLoadingEvents.set(false)
    });

    // Highest rated first; new vendors still appear before anyone has reviews
    this.serviceService.getServices({ sort: '-ratingAverage', limit: 4 }).subscribe({
      next: (response) => {
        this.topServices.set(response.data.slice(0, 4));
        this.isLoadingServices.set(false);
      },
      error: () => this.isLoadingServices.set(false)
    });
  }
}
