import { Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PaymentService } from '../../core/services/payment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent, IconComponent, EventCardComponent, VendorCardComponent],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero__glow" aria-hidden="true"></div>
      <div class="container hero__inner">
        <div class="hero__copy">
          <p class="pill"><app-icon name="sparkles" [size]="14"></app-icon>The easier way to host</p>
          <h1 class="hero__title">Celebrations, <em>beautifully</em> handled.</h1>
          <p class="hero__lead">
            Book trusted local bakers, decorators, photographers and DJs, and invite your guests, all in one place.
            @if (paymentsEnabled()) { Your payment is held safely until the job is done. }
          </p>

          <form class="search" role="search" (ngSubmit)="search()">
            <app-icon name="search" [size]="20"></app-icon>
            <label class="visually-hidden" for="hero-q">Search vendors</label>
            <input id="hero-q" name="q" [(ngModel)]="query" placeholder="Search cakes, decor, DJs…" autocomplete="off">
            <button type="submit" class="search__btn">Search</button>
          </form>

          <div class="popular">
            <span>Popular:</span>
            @for (c of popular; track c.value) {
              <a [routerLink]="'/services'" [queryParams]="{ category: c.value }">{{ c.label }}</a>
            }
          </div>
        </div>

        <!-- Illustration of an invitation and a booking; not real data -->
        <div class="hero__art" aria-hidden="true">
          <div class="art-card">
            <div class="art-card__cover">
              <app-icon name="cake" [size]="44"></app-icon>
              <span class="art-card__badge">You're invited</span>
            </div>
            <div class="art-card__body">
              <p class="art-card__kind">Birthday</p>
              <p class="art-card__title">Aanya turns 5</p>
              <p class="art-card__line"><app-icon name="calendar" [size]="15"></app-icon>Sat, 6 Dec · 4:00 pm</p>
              <p class="art-card__line"><app-icon name="map-pin" [size]="15"></app-icon>Koregaon Park, Pune</p>
              <div class="art-card__foot">
                <span class="faces"><i></i><i></i><i></i><i></i></span>
                <span>18 going</span>
              </div>
            </div>
          </div>
          <div class="float float--a">
            <span class="float__icon float__icon--ok"><app-icon name="check" [size]="16"></app-icon></span>
            <span><strong>Theme cake</strong><small>Confirmed · ₹2,000</small></span>
          </div>
          <div class="float float--b">
            <span class="float__icon"><app-icon name="shield-check" [size]="16"></app-icon></span>
            <span><strong>{{ paymentsEnabled() ? 'Payment held safely' : 'Decor booked' }}</strong><small>{{ paymentsEnabled() ? 'Released after the party' : 'Balloon arch · 3 pm' }}</small></span>
          </div>
          <div class="float float--c">
            <span class="float__icon float__icon--soft"><app-icon name="message" [size]="16"></app-icon></span>
            <span><strong>Photographer</strong><small>“See you at 3:30!”</small></span>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="section">
      <div class="container">
        <div class="head">
          <h2>Everything for the day</h2>
          <a routerLink="/services" class="head__link">All vendors <app-icon name="arrow-right" [size]="16"></app-icon></a>
        </div>
        <div class="cats">
          @for (c of categories; track c.value) {
            <a class="cat" [attr.data-cat]="c.value" routerLink="/services" [queryParams]="{ category: c.value }">
              <span class="cat__icon"><app-icon [name]="c.icon" [size]="24"></app-icon></span>
              <span class="cat__name">{{ c.label }}</span>
              <span class="cat__sub">{{ c.sub }}</span>
              <app-icon class="cat__go" name="arrow-right" [size]="18"></app-icon>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Occasions -->
    <section class="section section--tight">
      <div class="container">
        <div class="head">
          <div>
            <h2>What are you celebrating?</h2>
            <p>Pick an occasion. We'll set up the event, a checklist and vendors that fit.</p>
          </div>
        </div>
        <div class="occasions">
          @for (o of occasions; track o.value) {
            <a class="occasion" [attr.data-type]="o.value" routerLink="/events/create" [queryParams]="{ type: o.value }">
              <app-icon [name]="o.icon" [size]="28"></app-icon>
              <span>{{ o.label }}</span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="section">
      <div class="container">
        <div class="how">
          <div class="how__intro">
            <h2>From idea to party in three steps</h2>
            <p>No calling around, no chasing quotes on WhatsApp.</p>
            <app-button routerLink="/events/create" size="lg">Start planning</app-button>
          </div>
          <ol class="how__steps">
            <li>
              <span class="how__n">1</span>
              <div><h3>Create your event</h3><p>Tell us the occasion, date and place. We make you a checklist.</p></div>
            </li>
            <li>
              <span class="how__n">2</span>
              <div><h3>Book vendors</h3><p>Compare prices and reviews, send a request, and get a confirmed quote.</p></div>
            </li>
            <li>
              <span class="how__n">3</span>
              @if (paymentsEnabled()) {
                <div><h3>Pay securely</h3><p>Pay through Yaay by UPI or card. The vendor is paid once the job is done.</p></div>
              } @else {
                <div><h3>Pay the vendor</h3><p>Pay them directly, the way you agree. Online payment through Yaay is coming soon.</p></div>
              }
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="section section--soft">
      <div class="container">
        <div class="head head--center">
          <h2>One place for the whole event</h2>
          <p>Everything a host juggles, without the spreadsheets.</p>
        </div>
        <div class="bento">
          <article class="tile tile--wide">
            <div>
              <h3>{{ paymentsEnabled() ? 'Your money stays protected' : 'Clear prices, up front' }}</h3>
              <p>{{ paymentsEnabled() ? 'Pay a 30% advance or in full by UPI or card. Yaay holds it until you mark the booking done.' : 'Every vendor shows their price before you ask. Their quote is confirmed in writing.' }}</p>
            </div>
            <div class="mini mini--pay" aria-hidden="true">
              <div class="mini__row"><span>Vendor's quote</span><strong>₹6,500</strong></div>
              <div class="mini__row"><span>Advance paid</span><strong>₹1,950</strong></div>
              <div class="mini__bar"><span></span></div>
              <p class="mini__note"><app-icon name="shield-check" [size]="14"></app-icon>{{ paymentsEnabled() ? 'Held until delivered' : 'Quote confirmed' }}</p>
            </div>
          </article>
          <article class="tile">
            <span class="tile__icon"><app-icon name="send" [size]="20"></app-icon></span>
            <h3>Invites and RSVPs</h3>
            <p>Share one link on WhatsApp. Guests RSVP without signing up.</p>
          </article>
          <article class="tile">
            <span class="tile__icon"><app-icon name="ticket" [size]="20"></app-icon></span>
            <h3>Tickets and check-in</h3>
            <p>Sell tickets for a public event and scan guests in at the door.</p>
          </article>
          <article class="tile">
            <span class="tile__icon"><app-icon name="clipboard" [size]="20"></app-icon></span>
            <h3>A checklist that plans with you</h3>
            <p>Made for your occasion, with vendors suggested for each item.</p>
          </article>
          <article class="tile">
            <span class="tile__icon"><app-icon name="mic" [size]="20"></app-icon></span>
            <h3>Chat with vendors</h3>
            <p>Messages and voice notes in one thread, next to the booking.</p>
          </article>
        </div>
      </div>
    </section>

    @if (upcomingEvents().length) {
      <section class="section">
        <div class="container">
          <div class="head">
            <h2>Happening near you</h2>
            <a routerLink="/events" class="head__link">All events <app-icon name="arrow-right" [size]="16"></app-icon></a>
          </div>
          <div class="grid">
            @for (event of upcomingEvents(); track event._id) {
              <app-event-card [event]="event"></app-event-card>
            }
          </div>
        </div>
      </section>
    }

    @if (topServices().length) {
      <section class="section" [class.section--flush]="upcomingEvents().length">
        <div class="container">
          <div class="head">
            <h2>Vendors on Yaay</h2>
            <a routerLink="/services" class="head__link">Browse vendors <app-icon name="arrow-right" [size]="16"></app-icon></a>
          </div>
          <div class="grid">
            @for (service of topServices(); track service._id) {
              <app-vendor-card [service]="service"></app-vendor-card>
            }
          </div>
        </div>
      </section>
    }

    <!-- For vendors -->
    <section class="section">
      <div class="container">
        <div class="vendors">
          <div class="vendors__copy">
            <p class="pill pill--dark">For vendors</p>
            <h2>Turn your craft into bookings</h2>
            <p>List your cakes, decor, photography or music in minutes. Get requests from hosts nearby, send your quote, and get paid to your UPI.</p>
            <ul>
              <li><app-icon name="check" [size]="18"></app-icon>Free to list</li>
              <li><app-icon name="check" [size]="18"></app-icon>Paid before the event, no ghosting</li>
              <li><app-icon name="check" [size]="18"></app-icon>Reviews only from real bookings</li>
            </ul>
            <div class="vendors__cta">
              <app-button [routerLink]="auth.isAuthenticated() ? '/services/create' : '/for-vendors'" size="lg">List your service</app-button>
            </div>
          </div>
          <div class="vendors__art" aria-hidden="true">
            <div class="note"><app-icon name="inbox" [size]="18"></app-icon><span><strong>New request</strong><small>Birthday · 40 guests · 14 Dec</small></span></div>
            <div class="note note--b"><app-icon name="wallet" [size]="18"></app-icon><span><strong>Payout sent</strong><small>₹4,850 to your UPI</small></span></div>
            <div class="note"><app-icon name="star" [size]="18"></app-icon><span><strong>New 5-star review</strong><small>“The cake was perfect!”</small></span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Closing call -->
    <section class="final">
      <div class="container final__inner">
        <h2>Your next celebration starts here.</h2>
        <p>Free to plan. Book only what you need.</p>
        <div class="final__actions">
          <app-button routerLink="/events/create" size="lg">Plan an event</app-button>
          <app-button routerLink="/services" variant="secondary" size="lg">Browse vendors</app-button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    :host { display: block; background: $bg-primary; }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 $spacing-5;
      padding: 6px 12px;
      border: 1px solid $primary-200;
      border-radius: $radius-full;
      background: rgba(255, 255, 255, 0.7);
      color: $primary-800;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;

      &--dark {
        border-color: rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.08);
        color: $primary-200;
      }
    }

    // ---------- Hero ----------
    .hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, #fff 0%, $primary-50 100%);
    }

    .hero__glow {
      position: absolute;
      inset: -20% 0 auto auto;
      width: 70vw;
      max-width: 900px;
      aspect-ratio: 1;
      background:
        radial-gradient(closest-side, rgba(245, 158, 11, 0.18), transparent 70%) 10% 60% / 60% 60% no-repeat,
        radial-gradient(closest-side, rgba(187, 87, 130, 0.22), transparent 70%) 60% 30% / 70% 70% no-repeat;
      filter: blur(20px);
      pointer-events: none;
    }

    .hero__inner {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: $spacing-12;
      align-items: center;
      padding-top: $spacing-12;
      padding-bottom: $spacing-16;

      @include lg {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
        gap: $spacing-16;
        padding-top: $spacing-20;
        padding-bottom: $spacing-24;
      }
    }

    .hero__title {
      font-family: $font-family-display;
      font-weight: 600;
      font-size: clamp(2.6rem, 9vw, 4.75rem);
      line-height: 1.02;
      letter-spacing: -0.035em;
      color: $neutral-900;

      em {
        font-style: italic;
        color: $primary-600;
      }
    }

    .hero__lead {
      max-width: 34rem;
      margin: $spacing-6 0 0;
      font-size: 1.125rem;
      line-height: 1.6;
      color: $text-secondary;
    }

    .search {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      max-width: 34rem;
      margin-top: $spacing-8;
      padding: 6px 6px 6px $spacing-4;
      border: 1px solid $border-default;
      border-radius: $radius-full;
      background: $bg-primary;
      box-shadow: 0 12px 32px -12px rgba(85, 36, 58, 0.25);
      color: $text-tertiary;

      &:focus-within { border-color: $primary-400; box-shadow: 0 12px 32px -12px rgba(85, 36, 58, 0.35), $focus-ring; }

      input {
        flex: 1;
        min-width: 0;
        height: 44px;
        border: 0;
        background: transparent;
        font-size: $font-size-base;
        color: $text-primary;
        outline: none;
      }
    }

    .search__btn {
      flex-shrink: 0;
      height: 44px;
      padding: 0 $spacing-5;
      border-radius: $radius-full;
      background: $primary-600;
      color: $text-inverse;
      font-weight: $font-weight-semibold;
      transition: background-color $transition-fast;

      &:hover { background: $primary-700; }
    }

    .popular {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: $spacing-2;
      margin-top: $spacing-4;
      font-size: $font-size-sm;
      color: $text-tertiary;

      a {
        padding: 4px 12px;
        border: 1px solid $border-light;
        border-radius: $radius-full;
        background: rgba(255, 255, 255, 0.8);
        color: $text-secondary;

        &:hover { border-color: $primary-300; color: $primary-800; }
      }
    }

    // Hero art
    .hero__art {
      position: relative;
      justify-self: center;
      width: min(100%, 360px);
      padding: $spacing-10 0;

      @include lg { width: 380px; }
    }

    .art-card {
      position: relative;
      overflow: hidden;
      border-radius: 24px;
      background: $bg-primary;
      box-shadow: 0 40px 80px -32px rgba(85, 36, 58, 0.45), 0 0 0 1px rgba(24, 24, 27, 0.04);
      transform: rotate(-2deg);
      animation: bob 7s ease-in-out infinite;
    }

    .art-card__cover {
      position: relative;
      display: grid;
      place-items: center;
      height: 180px;
      background: linear-gradient(135deg, #f59e0b 0%, #db2777 60%, #9e3f68 100%);
      color: #fff;
    }

    .art-card__badge {
      position: absolute;
      left: 14px;
      top: 14px;
      padding: 4px 10px;
      border-radius: $radius-full;
      background: rgba(255, 255, 255, 0.92);
      color: $text-primary;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
    }

    .art-card__body { padding: $spacing-5; }

    .art-card__kind {
      margin: 0;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: $primary-700;
    }

    .art-card__title {
      margin: 4px 0 $spacing-3;
      font-family: $font-family-display;
      font-size: 1.6rem;
      font-weight: 600;
      color: $neutral-900;
    }

    .art-card__line {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      margin: 0 0 6px;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .art-card__foot {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      margin-top: $spacing-4;
      padding-top: $spacing-4;
      border-top: 1px solid $border-light;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }

    .faces {
      display: inline-flex;

      i {
        width: 26px;
        height: 26px;
        margin-left: -8px;
        border: 2px solid #fff;
        border-radius: 50%;
        background: linear-gradient(135deg, #fdba74, #f472b6);
        &:first-child { margin-left: 0; }
        &:nth-child(2) { background: linear-gradient(135deg, #a5b4fc, #818cf8); }
        &:nth-child(3) { background: linear-gradient(135deg, #5eead4, #14b8a6); }
        &:nth-child(4) { background: linear-gradient(135deg, #fcd34d, #f59e0b); }
      }
    }

    .float {
      position: absolute;
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: 10px 14px 10px 10px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 16px 40px -16px rgba(24, 24, 27, 0.35), 0 0 0 1px rgba(24, 24, 27, 0.05);
      font-size: $font-size-sm;
      white-space: nowrap;
      animation: bob 6s ease-in-out infinite;

      strong { display: block; font-size: $font-size-sm; color: $text-primary; }
      small { display: block; font-size: $font-size-xs; color: $text-tertiary; }

      &--a { top: 0; right: -8px; animation-delay: -2s; @include lg { right: -48px; } }
      &--b { bottom: 4px; left: -8px; animation-delay: -4s; @include lg { left: -64px; } }
      &--c { top: 46%; right: -12px; animation-delay: -1s; display: none; @include lg { display: flex; right: -80px; } }
    }

    .float__icon {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: $primary-100;
      color: $primary-700;

      &--ok { background: #dcfce7; color: #15803d; }
      &--soft { background: #e0e7ff; color: #4338ca; }
    }

    @keyframes bob {
      0%, 100% { translate: 0 0; }
      50% { translate: 0 -8px; }
    }

    // ---------- Sections ----------
    .section {
      padding: $spacing-16 0;
      @include lg { padding: $spacing-24 0; }

      &--tight { padding-top: 0; }
      &--flush { padding-top: 0; }
      &--soft { background: $neutral-50; }
    }

    .head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: $spacing-4;
      flex-wrap: wrap;
      margin-bottom: $spacing-8;

      h2 {
        font-family: $font-family-display;
        font-size: clamp(1.75rem, 4.5vw, 2.5rem);
        font-weight: 600;
        letter-spacing: -0.025em;
        color: $neutral-900;
      }

      p { margin: $spacing-2 0 0; color: $text-secondary; max-width: 36rem; }

      &--center {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }

    .head__link {
      display: inline-flex;
      align-items: center;
      gap: $spacing-1;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
    }

    // Categories
    .cats {
      display: grid;
      gap: $spacing-3;
      grid-template-columns: repeat(2, minmax(0, 1fr));

      @include md { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: $spacing-4; }
    }

    .cat {
      --tint: #{$primary-50};
      --ink: #{$primary-700};
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-height: 150px;
      padding: $spacing-5;
      border-radius: 20px;
      background: var(--tint);
      color: $text-primary;
      transition: transform 0.25s cubic-bezier(.2, .8, .2, 1), box-shadow 0.25s;

      @include md { min-height: 180px; padding: $spacing-6; }

      &:hover {
        color: $text-primary;
        transform: translateY(-3px);
        box-shadow: 0 20px 40px -24px rgba(24, 24, 27, 0.35);
        .cat__go { opacity: 1; transform: none; }
      }

      &[data-cat=food] { --tint: #fff4e6; --ink: #c2410c; }
      &[data-cat=decor] { --tint: #fdf2f8; --ink: #be185d; }
      &[data-cat=photography] { --tint: #eef2ff; --ink: #4338ca; }
      &[data-cat=music] { --tint: #f5f3ff; --ink: #6d28d9; }
      &[data-cat=entertainment] { --tint: #ecfdf5; --ink: #047857; }
      &[data-cat=venue] { --tint: #f0f9ff; --ink: #0369a1; }
    }

    .cat__icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: auto;
      border-radius: 14px;
      background: #fff;
      color: var(--ink);
      box-shadow: 0 4px 12px -6px rgba(24, 24, 27, 0.2);
    }

    .cat__name {
      margin-top: $spacing-4;
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
    }

    .cat__sub {
      font-size: $font-size-sm;
      color: $text-secondary;
      line-height: 1.4;
    }

    .cat__go {
      position: absolute;
      top: $spacing-5;
      right: $spacing-5;
      color: var(--ink);
      opacity: 0;
      transform: translateX(-4px);
      transition: opacity 0.2s, transform 0.2s;
    }

    // Occasions
    .occasions {
      display: grid;
      gap: $spacing-3;
      grid-template-columns: repeat(2, minmax(0, 1fr));

      @include sm { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      @include lg { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    }

    .occasion {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: $spacing-6;
      aspect-ratio: 5 / 4;
      padding: $spacing-4;
      border-radius: 20px;
      color: #fff;
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      background: linear-gradient(135deg, #bb5782, #6b2b46);
      transition: transform 0.25s cubic-bezier(.2, .8, .2, 1), box-shadow 0.25s;

      @include lg { aspect-ratio: 3 / 4; }

      &:hover {
        color: #fff;
        transform: translateY(-3px);
        box-shadow: 0 20px 40px -20px rgba(24, 24, 27, 0.5);
      }

      &[data-type=birthday] { background: linear-gradient(150deg, #f59e0b, #db2777); }
      &[data-type=house_party] { background: linear-gradient(150deg, #8b5cf6, #db2777); }
      &[data-type=wedding] { background: linear-gradient(150deg, #e11d48, #9f1239); }
      &[data-type=corporate] { background: linear-gradient(150deg, #475569, #0f172a); }
      &[data-type=farewell] { background: linear-gradient(150deg, #14b8a6, #0f766e); }
      &[data-type=meetup] { background: linear-gradient(150deg, #0ea5e9, #6366f1); }
    }

    // How it works
    .how {
      display: grid;
      gap: $spacing-10;

      @include lg { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: $spacing-16; align-items: center; }
    }

    .how__intro {
      h2 {
        font-family: $font-family-display;
        font-size: clamp(1.75rem, 4.5vw, 2.75rem);
        font-weight: 600;
        line-height: 1.1;
        letter-spacing: -0.025em;
        color: $neutral-900;
      }

      p { margin: $spacing-3 0 $spacing-6; color: $text-secondary; font-size: $font-size-lg; }
    }

    .how__steps {
      display: grid;
      gap: $spacing-3;

      li {
        display: flex;
        gap: $spacing-5;
        padding: $spacing-5;
        border: 1px solid $border-light;
        border-radius: 20px;
        background: $bg-primary;
      }

      h3 { font-size: $font-size-lg; font-weight: $font-weight-semibold; }
      p { margin: 4px 0 0; color: $text-secondary; }
    }

    .how__n {
      flex-shrink: 0;
      font-family: $font-family-display;
      font-size: 2.25rem;
      line-height: 1;
      font-weight: 600;
      color: $primary-300;
      width: 32px;
    }

    // Features
    .bento {
      display: grid;
      gap: $spacing-4;

      @include md { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      @include lg { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    .tile {
      padding: $spacing-6;
      border: 1px solid $border-light;
      border-radius: 20px;
      background: $bg-primary;

      h3 { font-size: $font-size-lg; font-weight: $font-weight-semibold; }
      p { margin: $spacing-2 0 0; color: $text-secondary; }

      &--wide {
        display: grid;
        gap: $spacing-6;
        background: linear-gradient(160deg, $primary-50, #fff 70%);

        @include md { grid-column: span 2; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; }

        h3 { font-family: $font-family-display; font-size: 1.75rem; font-weight: 600; letter-spacing: -0.02em; }
      }
    }

    // Phones: small tiles become compact rows
    @include max-md {
      .tile:not(.tile--wide) {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr);
        column-gap: $spacing-4;
        padding: $spacing-4;

        .tile__icon { grid-row: span 2; margin: 0; }
        h3 { font-size: $font-size-base; }
        p { margin: 2px 0 0; font-size: $font-size-sm; }
      }
    }

    .tile__icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      margin-bottom: $spacing-5;
      border-radius: 12px;
      background: $primary-50;
      color: $primary-700;
    }

    .mini {
      padding: $spacing-5;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 20px 40px -24px rgba(85, 36, 58, 0.35), 0 0 0 1px rgba(24, 24, 27, 0.05);
    }

    .mini__row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: $font-size-sm;
      color: $text-secondary;
      strong { color: $text-primary; }
    }

    .mini__bar {
      height: 8px;
      margin: $spacing-3 0;
      border-radius: $radius-full;
      background: $neutral-100;
      span { display: block; width: 30%; height: 100%; border-radius: inherit; background: $primary-600; }
    }

    .mini__note {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: $primary-700;
    }

    .grid {
      display: grid;
      gap: $spacing-5;
      grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
    }

    // For vendors
    .vendors {
      display: grid;
      gap: $spacing-10;
      align-items: center;
      padding: $spacing-8 $spacing-6;
      border-radius: 28px;
      background:
        radial-gradient(60% 80% at 100% 0%, rgba(187, 87, 130, 0.35), transparent 60%),
        $neutral-900;
      color: $neutral-300;

      @include md { padding: $spacing-12; }
      @include lg { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); padding: $spacing-16; }

      h2 {
        font-family: $font-family-display;
        font-size: clamp(1.75rem, 4.5vw, 2.75rem);
        font-weight: 600;
        line-height: 1.1;
        letter-spacing: -0.025em;
        color: #fff;
      }

      p { margin: $spacing-4 0 0; font-size: $font-size-lg; max-width: 34rem; }

      ul {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-2 $spacing-5;
        margin: $spacing-6 0 0;
      }

      li { display: flex; align-items: center; gap: $spacing-2; color: $neutral-200; }
      li app-icon { color: $primary-300; }
    }

    .vendors__cta { margin-top: $spacing-8; }

    .vendors__art {
      display: grid;
      gap: $spacing-3;
    }

    .note {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-4;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.06);
      color: $primary-200;

      strong { display: block; color: #fff; font-size: $font-size-sm; }
      small { display: block; color: $neutral-400; font-size: $font-size-xs; }

      &--b { @include lg { margin-left: $spacing-10; } }
    }

    // Closing
    .final {
      padding: $spacing-16 0 $spacing-20;
      background: linear-gradient(180deg, #fff, $primary-50);
      text-align: center;
    }

    .final__inner {
      display: flex;
      flex-direction: column;
      align-items: center;

      h2 {
        font-family: $font-family-display;
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 600;
        line-height: 1.05;
        letter-spacing: -0.03em;
        color: $neutral-900;
        max-width: 16ch;
      }

      p { margin: $spacing-4 0 $spacing-8; color: $text-secondary; font-size: $font-size-lg; }
    }

    .final__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: $spacing-3;
    }

    @media (prefers-reduced-motion: reduce) {
      .art-card, .float { animation: none; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private eventService = inject(EventService);
  private serviceService = inject(ServiceService);
  private router = inject(Router);
  auth = inject(AuthService);
  paymentsEnabled = toSignal(inject(PaymentService).getConfig().pipe(map(c => c.enabled)), { initialValue: false });

  upcomingEvents = signal<Event[]>([]);
  topServices = signal<Service[]>([]);
  query = '';

  popular = [
    { value: 'food', label: 'Cakes' },
    { value: 'decor', label: 'Decor' },
    { value: 'photography', label: 'Photography' },
    { value: 'music', label: 'DJ' }
  ];

  categories = [
    { value: 'food', label: 'Cakes & food', sub: 'Theme cakes, desserts, catering', icon: 'cake' },
    { value: 'decor', label: 'Decoration', sub: 'Balloons, flowers, backdrops', icon: 'flower' },
    { value: 'photography', label: 'Photography', sub: 'Candids, reels, albums', icon: 'camera' },
    { value: 'music', label: 'Music & DJ', sub: 'DJs, live bands, sound', icon: 'music' },
    { value: 'entertainment', label: 'Entertainment', sub: 'Magicians, games, hosts', icon: 'party' },
    { value: 'venue', label: 'Venues', sub: 'Halls, rooftops, gardens', icon: 'map-pin' }
  ];

  occasions = [
    { value: 'birthday', label: 'Birthday', icon: 'cake' },
    { value: 'house_party', label: 'House party', icon: 'home' },
    { value: 'wedding', label: 'Wedding', icon: 'heart' },
    { value: 'corporate', label: 'Corporate', icon: 'briefcase' },
    { value: 'farewell', label: 'Farewell', icon: 'gift' },
    { value: 'meetup', label: 'Meetup', icon: 'users' }
  ];

  ngOnInit(): void {
    this.eventService.getUpcomingEvents().subscribe({
      next: (response) => this.upcomingEvents.set(response.data.slice(0, 4)),
      error: () => {}
    });

    // Highest rated first; new vendors still appear before anyone has reviews
    this.serviceService.getServices({ sort: '-ratingAverage', limit: 4 }).subscribe({
      next: (response) => this.topServices.set(response.data.slice(0, 4)),
      error: () => {}
    });
  }

  search(): void {
    const q = this.query.trim();
    this.router.navigate(['/services'], q ? { queryParams: { q } } : {});
  }
}
