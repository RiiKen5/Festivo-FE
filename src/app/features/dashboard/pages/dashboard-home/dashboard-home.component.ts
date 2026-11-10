import { bookingStage, eventStatusLabel, paymentStatusLabel } from '../../../../shared/components/listing-cards/listing-format';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { AuthService } from '../../../../core/services/auth.service';
import { EventService } from '../../../../core/services/event.service';
import { BookingService } from '../../../../core/services/booking.service';
import { ToastService } from '../../../../core/services/toast.service';
import { RsvpService } from '../../../../core/services/rsvp.service';
import { Event } from '../../../../core/models/event.model';
import { Booking } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, ButtonComponent, CardComponent],
  template: `

    <main class="dashboard">
      <div class="container">
        <!-- Header -->
        <header class="dash-head">
          <div>
            <h1>Hi, {{ auth.currentUser()?.name?.split(' ')?.[0] || 'there' }}</h1>
            <p>{{ summary() }}</p>
          </div>
          <app-button routerLink="/events/create" icon="plus">New event</app-button>
        </header>

        @if (!isLoadingEvents()) {
          @if (upcomingEvents()[0]; as ev) {
            <a class="next" [routerLink]="['/events', ev.slug]" [attr.data-type]="ev.eventType">
              <span class="next__art" aria-hidden="true"><app-icon [name]="typeIcon(ev.eventType)" [size]="30"></app-icon></span>
              <span class="next__body">
                <span class="next__kicker">Next up · {{ countdown(ev.date) }}</span>
                <span class="next__title">{{ ev.title }}</span>
                <span class="next__meta">{{ formatDate(ev.date) }} · {{ ev.time }} · {{ ev.locationName || ev.city }}</span>
              </span>
              <span class="next__cta">Open plan <app-icon name="arrow-right" [size]="16"></app-icon></span>
            </a>
          } @else if (!myEvents().length) {
            <section class="start">
              <h2>What are you planning?</h2>
              <p>Pick an occasion. We'll set up a checklist and suggest vendors near you.</p>
              <div class="start__grid">
                @for (o of occasions; track o.value) {
                  <a class="start__item" [attr.data-type]="o.value" routerLink="/events/create" [queryParams]="{ type: o.value }">
                    <app-icon [name]="o.icon" [size]="22"></app-icon>{{ o.label }}
                  </a>
                }
              </div>
            </section>
          }
        }

        <!-- Navigation Tabs -->
        @if (vendorRequests().length || awaitingPayment().length) {
          <div class="attention">
            @for (booking of vendorRequests(); track booking._id) {
              <a class="attention-item" [routerLink]="['/bookings', booking._id]">
                <strong>New booking request:</strong> {{ getServiceName(booking.service) }} for {{ getEventTitle(booking) }} on {{ formatDate(booking.eventDate) }} — confirm and send your quote →
              </a>
            }
            @for (booking of awaitingPayment(); track booking._id) {
              <a class="attention-item" [routerLink]="['/bookings', booking._id]">
                <strong>Ready to pay:</strong> {{ getServiceName(booking.service) }} confirmed at ₹{{ booking.priceAgreed | number }} — pay securely to lock it in →
              </a>
            }
          </div>
        }

        <div class="dashboard-tabs">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'overview'"
            (click)="setTab('overview')"
          >Overview</button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'events'"
            (click)="setTab('events')"
          >My Events</button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'bookings'"
            (click)="setTab('bookings')"
          >Bookings</button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          @switch (activeTab()) {
            @case ('overview') {
              <div class="overview-grid">
                <!-- Upcoming Events -->
                @if (upcomingEvents().length > 1) {
                <section class="dashboard-section">
                  <div class="section-header">
                    <h2>Also coming up</h2>
                    <a routerLink="/dashboard/events" class="section-link">All events →</a>
                  </div>
                  <div class="events-list">
                    @for (event of upcomingEvents().slice(1, 4); track event._id) {
                      <a class="event-item" [routerLink]="['/events', event.slug]">
                        <div class="event-date">
                          <span class="date-day">{{ getDay(event.date) }}</span>
                          <span class="date-month">{{ getMonth(event.date) }}</span>
                        </div>
                        <div class="event-info">
                          <h3>{{ event.title }}</h3>
                          <p>{{ event.time }} • {{ event.locationName || event.city }}</p>
                        </div>
                        <div class="event-badge" [class]="'badge--' + event.status">
                          {{ eventStatus(event.status) }}
                        </div>
                      </a>
                    }
                  </div>
                </section>
                }

                <!-- Tickets & RSVPs -->
                @if (myRsvps().length) {
                  <section class="dashboard-section">
                    <div class="section-header">
                      <h2>My Tickets &amp; RSVPs</h2>
                    </div>
                    <div class="bookings-list">
                      @for (rsvp of myRsvps().slice(0, 5); track rsvp._id) {
                        <a class="booking-item" [routerLink]="['/events', rsvp.event?.slug]">
                          <div class="booking-info">
                            <h4>{{ rsvp.event?.title }}</h4>
                            <p>{{ formatDate(rsvp.event?.date) }} · {{ rsvp.event?.time }} · {{ rsvp.event?.city }}</p>
                          </div>
                          @if (rsvp.status === 'pending_payment') {
                            <div class="booking-status status--pending">Pay to confirm</div>
                          } @else if (rsvp.status === 'going' && rsvp.checkInCode) {
                            <div class="ticket-code">{{ rsvp.checkInCode }}</div>
                          } @else {
                            <div class="booking-status">{{ rsvp.status === 'maybe' ? 'Maybe' : rsvp.status === 'not_going' ? "Can't go" : rsvp.status }}</div>
                          }
                        </a>
                      }
                    </div>
                  </section>
                }

                <!-- Recent Bookings -->
                <section class="dashboard-section">
                  <div class="section-header">
                    <h2>Recent Bookings</h2>
                    <a routerLink="/dashboard/bookings" class="section-link">View all →</a>
                  </div>
                  @if (isLoadingBookings()) {
                    <div class="loading-placeholder">Loading bookings...</div>
                  } @else if (recentBookings().length === 0) {
                    <div class="empty-card">
                      <span class="empty-icon" aria-hidden="true"><app-icon name="clipboard" [size]="28"></app-icon></span>
                      <h3>No vendors booked yet</h3>
                      <p>Cakes, decor, photography and more, from people near you.</p>
                      <app-button routerLink="/services" size="sm" variant="secondary">Find vendors</app-button>
                    </div>
                  } @else {
                    <div class="bookings-list">
                      @for (booking of recentBookings().slice(0, 4); track booking._id) {
                        <a class="booking-item" [routerLink]="['/bookings', booking._id]">
                          <div class="booking-info">
                            <h4>{{ getServiceName(booking.service) }}</h4>
                            <p>{{ isIncoming(booking) ? 'Request from ' + getOrganizerName(booking) : 'For ' + getEventTitle(booking) }} · {{ formatDate(booking.eventDate) }}</p>
                          </div>
                          <span [class]="'stage stage--' + stage(booking).tone">{{ stage(booking).label }}</span>
                          <div class="booking-price">₹{{ booking.priceAgreed | number }}</div>
                        </a>
                      }
                    </div>
                  }
                </section>

              </div>
            }

            @case ('events') {
              <section class="dashboard-section full-width">
                <div class="section-header">
                  <h2>My Events</h2>
                  <app-button routerLink="/events/create" size="sm">Create New</app-button>
                </div>
                @if (isLoadingEvents()) {
                  <div class="loading-placeholder">Loading events...</div>
                } @else if (myEvents().length === 0) {
                  <div class="empty-card">
                    <span class="empty-icon" aria-hidden="true"><app-icon name="calendar" [size]="28"></app-icon></span>
                    <h3>No events created yet</h3>
                    <p>Start planning your first event</p>
                    <app-button routerLink="/events/create">Create Event</app-button>
                  </div>
                } @else {
                  <div class="events-grid">
                    @for (event of myEvents(); track event._id) {
                      <div class="event-card-wrapper">
                        <app-card
                          [title]="event.title"
                          [subtitle]="formatDate(event.date)"
                          [image]="event.coverPhoto || 'assets/images/event-placeholder.svg'"
                          [badge]="event.isPublished ? 'Published' : 'Draft'"
                          [badgeType]="event.isPublished ? 'success' : 'warning'"
                          hoverable
                          [hasFooter]="true"
                        >
                          <p class="card-location"><app-icon name="map-pin" [size]="14"></app-icon> {{ event.locationName || event.city }}</p>
                          <p class="card-attendees"><app-icon name="users" [size]="14"></app-icon> {{ event.currentAttendees }} / {{ event.maxAttendees || '∞' }}</p>
                          <p class="card-status">
                            <span class="status-badge" [class]="'status--' + event.status">{{ eventStatus(event.status) }}</span>
                          </p>
                          <div card-footer class="card-footer">
                            <div class="footer-actions">
                              @if (event.isPublished) {
                                <app-button
                                  size="sm"
                                  variant="ghost"
                                  (click)="unpublishEvent(event, $event)"
                                  [loading]="publishingEventId() === event._id"
                                  [disabled]="publishingEventId() === event._id"
                                >
                                  Unpublish
                                </app-button>
                              } @else {
                                <app-button
                                  size="sm"
                                  variant="primary"
                                  (click)="publishEvent(event, $event)"
                                  [loading]="publishingEventId() === event._id"
                                  [disabled]="publishingEventId() === event._id"
                                >
                                  Publish
                                </app-button>
                              }
                            </div>
                            <div class="footer-links">
                              <app-button size="sm" variant="ghost" [routerLink]="['/events', event.slug, 'edit']">Edit</app-button>
                              <app-button size="sm" variant="secondary" [routerLink]="['/events', event.slug]">View</app-button>
                            </div>
                          </div>
                        </app-card>
                      </div>
                    }
                  </div>
                }
              </section>
            }

            @case ('bookings') {
              <section class="dashboard-section full-width">
                <div class="section-header">
                  <h2>My Bookings</h2>
                </div>
                @if (isLoadingBookings()) {
                  <div class="loading-placeholder">Loading bookings...</div>
                } @else if (recentBookings().length === 0) {
                  <div class="empty-card">
                    <span class="empty-icon" aria-hidden="true"><app-icon name="clipboard" [size]="28"></app-icon></span>
                    <h3>No bookings yet</h3>
                    <p>Book services for your upcoming events</p>
                    <app-button routerLink="/services" variant="secondary">Browse Services</app-button>
                  </div>
                } @else {
                  <div class="bookings-table">
                    <div class="table-header">
                      <span>Service</span>
                      <span>Event Date</span>
                      <span>Status</span>
                      <span>Amount</span>
                      <span>Payment</span>
                    </div>
                    @for (booking of recentBookings(); track booking._id) {
                      <div class="table-row">
                        <span class="cell-service">{{ getServiceName(booking.service) }}</span>
                        <span>{{ formatDate(booking.eventDate) }}</span>
                        <span><span [class]="'stage stage--' + stage(booking).tone">{{ stage(booking).label }}</span></span>
                        <span class="cell-amount">₹{{ booking.priceAgreed | number }}</span>
                        <span class="payment-status" [class]="'payment--' + booking.paymentStatus">{{ paymentStatus(booking.paymentStatus) }}</span>
                      </div>
                    }
                  </div>
                }
              </section>
            }
          }
        </div>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .dashboard {
      min-height: calc(100vh - $navbar-height);
      background: $bg-secondary;
      padding: $spacing-8 0;
    }

    .dashboard-header {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
      margin-bottom: $spacing-8;

      @include md {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .welcome-section {
      h1 {
        font-size: $font-size-2xl;
        font-weight: $font-weight-bold;
        margin-bottom: $spacing-1;

        @include md {
          font-size: $font-size-3xl;
        }
      }

      p {
        color: $text-secondary;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $spacing-3;
      margin-bottom: $spacing-6;

      @include md {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: $spacing-4;
        margin-bottom: $spacing-8;
      }
    }

    .stat-card {
      @include card;
      display: flex;
      align-items: center;
      gap: $spacing-3;
      min-width: 0;
      padding: $spacing-3;

      @include md {
        gap: $spacing-4;
        padding: $card-padding;
      }

      .stat-icon {
        width: 40px;
        height: 40px;

        @include md {
          width: 48px;
          height: 48px;
        }
      }
    }

    .stat-icon {
      @include flex-center;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: $radius-md;
      // One quiet style; the number is what matters
      background: $primary-50;
      color: $primary-700;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .stat-value {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
    }

    .stat-label {
      font-size: $font-size-sm;
      color: $text-secondary;
      line-height: 1.3;
    }

    .dash-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: $spacing-4;
      flex-wrap: wrap;
      margin-bottom: $spacing-6;

      h1 {
        font-family: $font-family-display;
        font-size: clamp(1.75rem, 5vw, 2.5rem);
        font-weight: 600;
        letter-spacing: -0.025em;
      }

      p { margin: $spacing-1 0 0; color: $text-secondary; }
    }

    // The next event, front and centre
    .next {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: $spacing-4;
      margin-bottom: $spacing-6;
      padding: $spacing-5;
      border-radius: 20px;
      color: #fff;
      background: linear-gradient(135deg, #bb5782, #6b2b46);
      box-shadow: 0 24px 48px -28px rgba(85, 36, 58, 0.6);
      transition: transform 0.25s cubic-bezier(.2, .8, .2, 1);

      @include md { grid-template-columns: auto minmax(0, 1fr) auto; padding: $spacing-6 $spacing-8; gap: $spacing-6; }

      &:hover { color: #fff; transform: translateY(-2px); }

      &[data-type=birthday] { background: linear-gradient(135deg, #f59e0b, #db2777); }
      &[data-type=house_party] { background: linear-gradient(135deg, #8b5cf6, #db2777); }
      &[data-type=wedding] { background: linear-gradient(135deg, #e11d48, #9f1239); }
      &[data-type=corporate] { background: linear-gradient(135deg, #475569, #0f172a); }
      &[data-type=farewell] { background: linear-gradient(135deg, #14b8a6, #0f766e); }
      &[data-type=meetup] { background: linear-gradient(135deg, #0ea5e9, #6366f1); }
    }

    .next__art {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.2);

      @include md { width: 72px; height: 72px; border-radius: 20px; }
    }

    .next__body { display: flex; flex-direction: column; min-width: 0; }

    .next__kicker {
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.85;
    }

    .next__title {
      margin: 2px 0 4px;
      font-family: $font-family-display;
      font-size: clamp(1.35rem, 4vw, 1.875rem);
      font-weight: 600;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }

    .next__meta { font-size: $font-size-sm; opacity: 0.9; }

    .next__cta {
      grid-column: 1 / -1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-1;
      height: 40px;
      padding: 0 $spacing-5;
      border-radius: $radius-full;
      background: #fff;
      color: $text-primary;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;

      @include md { grid-column: auto; }
    }

    // First visit: pick an occasion
    .start {
      @include card;
      margin-bottom: $spacing-6;

      h2 { font-family: $font-family-display; font-size: 1.5rem; font-weight: 600; }
      p { margin: $spacing-1 0 $spacing-5; color: $text-secondary; }
    }

    .start__grid {
      display: grid;
      gap: $spacing-3;
      grid-template-columns: repeat(2, minmax(0, 1fr));

      @include sm { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      @include lg { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    }

    .start__item {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-4;
      border-radius: 16px;
      color: #fff;
      font-weight: $font-weight-semibold;
      background: linear-gradient(135deg, #bb5782, #6b2b46);
      transition: transform 0.2s;

      &:hover { color: #fff; transform: translateY(-2px); }

      &[data-type=birthday] { background: linear-gradient(135deg, #f59e0b, #db2777); }
      &[data-type=house_party] { background: linear-gradient(135deg, #8b5cf6, #db2777); }
      &[data-type=wedding] { background: linear-gradient(135deg, #e11d48, #9f1239); }
      &[data-type=corporate] { background: linear-gradient(135deg, #475569, #0f172a); }
      &[data-type=farewell] { background: linear-gradient(135deg, #14b8a6, #0f766e); }
      &[data-type=meetup] { background: linear-gradient(135deg, #0ea5e9, #6366f1); }
    }

    a.event-item { color: inherit; }

    .dashboard-tabs {
      display: flex;
      gap: $spacing-2;
      margin-bottom: $spacing-6;
      border-bottom: 1px solid $border-light;
    }

    // Phones: the three tabs share the width instead of scrolling
    .tab-btn {
      flex: 1;
      padding: $spacing-3 $spacing-2;
      font-weight: $font-weight-medium;
      color: $text-secondary;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      background: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all $transition-fast;

      @include md {
        flex: none;
        padding: $spacing-3 $spacing-4;
      }

      &:hover {
        color: $text-primary;
      }

      &.active {
        color: $primary-600;
        border-bottom-color: $primary-600;
      }
    }

    .tab-content {
      min-height: 400px;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: $spacing-6;

      @include lg {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .dashboard-section {
      @include card;
      min-width: 0;

      @include max-md {
        padding: $spacing-4;
      }

      &.full-width {
        grid-column: 1 / -1;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-4;
      padding-bottom: $spacing-3;
      border-bottom: 1px solid $border-light;

      h2 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
      }
    }

    .section-link {
      color: $primary-600;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;

      &:hover {
        color: $primary-700;
      }
    }

    .loading-placeholder {
      padding: $spacing-8;
      text-align: center;
      color: $text-secondary;
    }

    .empty-card {
      text-align: center;
      padding: $spacing-8;

      .empty-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        margin-bottom: $spacing-4;
        border-radius: $radius-full;
        background: $primary-50;
        color: $primary-600;
      }

      h3 {
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-2;
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
        margin-bottom: $spacing-4;
      }
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
    }

    .event-item {
      display: flex;
      align-items: center;
      gap: $spacing-4;
      padding: $spacing-3;
      border-radius: $radius-default;
      cursor: pointer;
      transition: background $transition-fast;

      &:hover {
        background: $neutral-50;
      }
    }

    .event-date {
      @include flex-column-center;
      width: 48px;
      height: 48px;
      background: $primary-50;
      border-radius: $radius-default;
    }

    .date-day {
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: $primary-600;
      line-height: 1;
    }

    .date-month {
      font-size: $font-size-xs;
      color: $primary-600;
      text-transform: uppercase;
    }

    .event-info {
      flex: 1;
      min-width: 0;

      h3 {
        font-size: $font-size-sm;
        font-weight: $font-weight-semibold;
        @include truncate;
      }

      p {
        font-size: $font-size-xs;
        color: $text-secondary;
      }
    }

    .event-badge,
    .booking-status {
      padding: $spacing-1 $spacing-2;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      text-transform: capitalize;

      &.badge--draft,
      &.status--pending {
        background: $neutral-100;
        color: $text-secondary;
      }

      &.badge--planning,
      &.status--confirmed {
        background: $info-light;
        color: $info-dark;
      }

      &.badge--active,
      &.status--in_progress {
        background: $primary-100;
        color: $primary-700;
      }

      &.badge--completed,
      &.status--completed {
        background: $success-light;
        color: $success-dark;
      }

      &.badge--cancelled,
      &.status--cancelled {
        background: $error-light;
        color: $error-dark;
      }
    }

    .bookings-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
    }

    .booking-item {
      display: flex;
      align-items: center;
      gap: $spacing-4;
      padding: $spacing-3;
      border-radius: $radius-default;
      background: $neutral-50;
      color: inherit;
      text-decoration: none;

      &:hover {
        background: $neutral-100;
      }
    }

    .ticket-code {
      font-family: $font-family-mono;
      font-weight: $font-weight-semibold;
      letter-spacing: $letter-spacing-wide;
      color: $primary-700;
    }

    .attention {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
      margin-bottom: $spacing-6;
    }

    .attention-item {
      display: block;
      padding: $spacing-3 $spacing-4;
      border-radius: $radius-md;
      background: $warning-light;
      color: $warning-dark;
      text-decoration: none;
      font-size: $font-size-sm;
    }

    .booking-info {
      flex: 1;
      min-width: 0;

      h4 {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        @include truncate;
      }

      p {
        font-size: $font-size-xs;
        color: $text-secondary;
      }
    }

    .booking-price {
      font-weight: $font-weight-semibold;
      color: $primary-600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-3;
    }

    .action-card {
      @include flex-column-center;
      padding: $spacing-4;
      background: $neutral-50;
      border-radius: $radius-lg;
      text-decoration: none;
      transition: all $transition-fast;

      &:hover {
        background: $primary-50;
      }
    }

    .action-icon {
      display: inline-flex;
      margin-bottom: $spacing-2;
      color: $primary-600;
    }

    .action-label {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: $text-primary;
    }

    .events-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-6;

      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }

      @include lg {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .card-location,
    .card-attendees {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: $spacing-1;
    }

    .card-footer {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
    }

    .footer-actions {
      display: flex;
      justify-content: center;
      padding-bottom: $spacing-2;
      border-bottom: 1px solid $border-light;
    }

    .footer-links {
      display: flex;
      justify-content: space-between;
    }

    .card-status {
      margin-top: $spacing-2;
    }

    .status-badge {
      padding: $spacing-1 $spacing-2;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      text-transform: capitalize;

      &.status--draft {
        background: $neutral-100;
        color: $text-secondary;
      }

      &.status--planning {
        background: $info-light;
        color: $info-dark;
      }

      &.status--active {
        background: $primary-100;
        color: $primary-700;
      }

      &.status--completed {
        background: $success-light;
        color: $success-dark;
      }

      &.status--cancelled {
        background: $error-light;
        color: $error-dark;
      }
    }

    .event-card-wrapper {
      height: 100%;
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: $spacing-4;
      padding: $spacing-3 $spacing-4;
      align-items: center;
    }

    // Phones: each booking is a small card (service and amount on top,
    // date, status and payment below) instead of a table to scroll
    @include max-md {
      .table-header { display: none; }

      .table-row {
        grid-template-columns: minmax(0, 1fr) auto;
        gap: $spacing-2 $spacing-3;
        padding: $spacing-3 0;

        .cell-service { grid-column: 1; grid-row: 1; }
        .cell-amount { grid-column: 2; grid-row: 1; text-align: right; }
        > span:nth-child(2) { grid-column: 1 / -1; color: $text-secondary; }
        > span:nth-child(3), .payment-status { justify-self: start; }
        > span:nth-child(3) { grid-column: 1; }
        .payment-status { grid-column: 2; justify-self: end; }
      }
    }

    .table-header {
      background: $neutral-50;
      border-radius: $radius-default;
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .table-row {
      border-bottom: 1px solid $border-light;
      font-size: $font-size-sm;

      &:last-child {
        border-bottom: none;
      }
    }

    .cell-service {
      font-weight: $font-weight-medium;
    }

    .cell-amount {
      font-weight: $font-weight-semibold;
    }

    .payment-status {
      padding: $spacing-1 $spacing-2;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;

      &.payment--unpaid {
        background: $warning-light;
        color: $warning-dark;
      }

      &.payment--partial {
        background: $info-light;
        color: $info-dark;
      }

      &.payment--paid {
        background: $success-light;
        color: $success-dark;
      }

      &.payment--refunded {
        background: $error-light;
        color: $error-dark;
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private bookingService = inject(BookingService);
  private toast = inject(ToastService);
  private rsvpService = inject(RsvpService);
  auth = inject(AuthService);

  stage(booking: Booking) {
    return bookingStage(booking, this.isIncoming(booking));
  }

  eventStatus(status: string): string {
    return eventStatusLabel(status);
  }

  paymentStatus(status: string): string {
    return paymentStatusLabel(status);
  }

  occasions = [
    { value: 'birthday', label: 'Birthday', icon: 'cake' },
    { value: 'house_party', label: 'House party', icon: 'home' },
    { value: 'wedding', label: 'Wedding', icon: 'heart' },
    { value: 'corporate', label: 'Corporate', icon: 'briefcase' },
    { value: 'farewell', label: 'Farewell', icon: 'gift' },
    { value: 'meetup', label: 'Meetup', icon: 'users' }
  ];

  typeIcon(type: string): string {
    return this.occasions.find(o => o.value === type)?.icon || 'party';
  }

  /** "today", "tomorrow", "in 12 days" */
  countdown(date: string | Date): string {
    const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const days = Math.round((day(new Date(date)) - day(new Date())) / 864e5);
    return days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  }

  /** One line under the greeting: what needs the user, else what's planned */
  summary(): string {
    const asks = this.vendorRequests().length + this.awaitingPayment().length;
    if (asks) return `${asks} ${asks === 1 ? 'thing needs' : 'things need'} your attention.`;
    const n = this.upcomingEvents().length;
    if (n) return `You have ${n} upcoming ${n === 1 ? 'event' : 'events'}.`;
    return 'Nothing planned yet. Let\'s change that.';
  }

  activeTab = signal<'overview' | 'events' | 'bookings'>('overview');
  myEvents = signal<Event[]>([]);
  upcomingEvents = signal<Event[]>([]);
  recentBookings = signal<Booking[]>([]);
  myRsvps = signal<any[]>([]);
  isLoadingEvents = signal(true);
  isLoadingBookings = signal(true);
  publishingEventId = signal<string | null>(null);

  ngOnInit(): void {
    const tab = this.route.snapshot.data['tab'];
    if (tab) {
      this.activeTab.set(tab);
    }

    this.loadMyEvents();
    this.loadBookings();
    this.rsvpService.getMyRsvps().subscribe({
      next: (response) => this.myRsvps.set(response.data)
    });
  }

  private userId(): string | undefined {
    return this.auth.currentUser()?._id;
  }

  private idOf(ref: any): string | undefined {
    return typeof ref === 'object' ? ref?._id : ref;
  }

  // Booking requests this user received as a vendor
  isIncoming(booking: Booking): boolean {
    return this.idOf(booking.vendor) === this.userId();
  }

  vendorRequests(): Booking[] {
    return this.recentBookings().filter(b => this.isIncoming(b) && b.status === 'pending');
  }

  awaitingPayment(): Booking[] {
    return this.recentBookings().filter(b =>
      !this.isIncoming(b) && b.status === 'confirmed' && b.paymentStatus !== 'paid');
  }

  getEventTitle(booking: Booking): string {
    return typeof booking.event === 'object' ? booking.event.title : 'your event';
  }

  getOrganizerName(booking: Booking): string {
    return typeof booking.organizer === 'object' ? booking.organizer.name : 'an organizer';
  }

  setTab(tab: 'overview' | 'events' | 'bookings'): void {
    this.activeTab.set(tab);
  }

  loadMyEvents(): void {
    this.eventService.getMyEvents().subscribe({
      next: (response) => {
        this.myEvents.set(response.data);
        const now = new Date();
        this.upcomingEvents.set(
          response.data
            .filter(e => new Date(e.date) >= now && !['cancelled', 'completed'].includes(e.status))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        );
        this.isLoadingEvents.set(false);
      },
      error: () => {
        this.isLoadingEvents.set(false);
      }
    });
  }

  loadBookings(): void {
    this.bookingService.getBookings().subscribe({
      next: (response) => {
        this.recentBookings.set(response.data);
        this.isLoadingBookings.set(false);
      },
      error: () => {
        this.isLoadingBookings.set(false);
      }
    });
  }

  completedBookings(): number {
    return this.recentBookings().filter(b => b.status === 'completed').length;
  }

  pendingBookings(): number {
    return this.recentBookings().filter(b => b.status === 'pending').length;
  }

  getDay(date: Date): string {
    return new Date(date).getDate().toString();
  }

  getMonth(date: Date): string {
    return new Date(date).toLocaleString('en', { month: 'short' });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getServiceName(service: any): string {
    if (typeof service === 'object' && service?.serviceName) {
      return service.serviceName;
    }
    return 'Service';
  }

  getStatusBadgeType(status: string): 'primary' | 'success' | 'warning' | 'error' {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'active': return 'primary';
      default: return 'warning';
    }
  }

  publishEvent(event: Event, clickEvent: MouseEvent): void {
    clickEvent.stopPropagation();
    clickEvent.preventDefault();

    this.publishingEventId.set(event._id);

    this.eventService.publishEvent(event._id).subscribe({
      next: (response) => {
        // Update the event in the local list
        this.myEvents.update(events =>
          events.map(e => e._id === event._id ? { ...e, isPublished: true } : e)
        );
        this.toast.success('Event Published', `"${event.title}" is now visible to everyone.`);
        this.publishingEventId.set(null);
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to publish event. Please try again.';
        this.toast.error('Publish Failed', message);
        this.publishingEventId.set(null);
      }
    });
  }

  unpublishEvent(event: Event, clickEvent: MouseEvent): void {
    clickEvent.stopPropagation();
    clickEvent.preventDefault();

    this.publishingEventId.set(event._id);

    this.eventService.unpublishEvent(event._id).subscribe({
      next: (response) => {
        // Update the event in the local list
        this.myEvents.update(events =>
          events.map(e => e._id === event._id ? { ...e, isPublished: false } : e)
        );
        this.toast.success('Event Unpublished', `"${event.title}" is now hidden from public view.`);
        this.publishingEventId.set(null);
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to unpublish event. Please try again.';
        this.toast.error('Unpublish Failed', message);
        this.publishingEventId.set(null);
      }
    });
  }
}
