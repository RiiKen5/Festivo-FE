import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { AuthService } from '../../../../core/services/auth.service';
import { EventService } from '../../../../core/services/event.service';
import { BookingService } from '../../../../core/services/booking.service';
import { Event } from '../../../../core/models/event.model';
import { Booking } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, ButtonComponent, CardComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="dashboard">
      <div class="container">
        <!-- Header -->
        <header class="dashboard-header">
          <div class="welcome-section">
            <h1>Welcome back, {{ auth.currentUser()?.name?.split(' ')?.[0] || 'User' }}!</h1>
            <p>Here's what's happening with your events</p>
          </div>
          <div class="header-actions">
            <app-button routerLink="/events/create">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Event
            </app-button>
          </div>
        </header>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon--primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ myEvents().length }}</span>
              <span class="stat-label">My Events</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon--success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ completedBookings() }}</span>
              <span class="stat-label">Completed</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon--warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ pendingBookings() }}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon--info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ auth.currentUser()?.eventsAttended || 0 }}</span>
              <span class="stat-label">Attended</span>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
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
                <section class="dashboard-section">
                  <div class="section-header">
                    <h2>Upcoming Events</h2>
                    <a routerLink="/dashboard/events" class="section-link">View all →</a>
                  </div>
                  @if (isLoadingEvents()) {
                    <div class="loading-placeholder">Loading events...</div>
                  } @else if (upcomingEvents().length === 0) {
                    <div class="empty-card">
                      <span class="empty-icon">📅</span>
                      <h3>No upcoming events</h3>
                      <p>Create your first event to get started</p>
                      <app-button routerLink="/events/create" size="sm">Create Event</app-button>
                    </div>
                  } @else {
                    <div class="events-list">
                      @for (event of upcomingEvents().slice(0, 3); track event._id) {
                        <div class="event-item" [routerLink]="['/events', event.slug]">
                          <div class="event-date">
                            <span class="date-day">{{ getDay(event.date) }}</span>
                            <span class="date-month">{{ getMonth(event.date) }}</span>
                          </div>
                          <div class="event-info">
                            <h3>{{ event.title }}</h3>
                            <p>{{ event.time }} • {{ event.locationName || event.city }}</p>
                          </div>
                          <div class="event-badge" [class]="'badge--' + event.status">
                            {{ event.status }}
                          </div>
                        </div>
                      }
                    </div>
                  }
                </section>

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
                      <span class="empty-icon">📋</span>
                      <h3>No bookings yet</h3>
                      <p>Book services for your events</p>
                      <app-button routerLink="/services" size="sm" variant="secondary">Browse Services</app-button>
                    </div>
                  } @else {
                    <div class="bookings-list">
                      @for (booking of recentBookings().slice(0, 4); track booking._id) {
                        <div class="booking-item">
                          <div class="booking-info">
                            <h4>{{ getServiceName(booking.service) }}</h4>
                            <p>{{ formatDate(booking.eventDate) }}</p>
                          </div>
                          <div class="booking-status" [class]="'status--' + booking.status">
                            {{ booking.status }}
                          </div>
                          <div class="booking-price">₹{{ booking.priceAgreed | number }}</div>
                        </div>
                      }
                    </div>
                  }
                </section>

                <!-- Quick Actions -->
                <section class="dashboard-section">
                  <h2>Quick Actions</h2>
                  <div class="actions-grid">
                    <a routerLink="/events/create" class="action-card">
                      <span class="action-icon">🎉</span>
                      <span class="action-label">Create Event</span>
                    </a>
                    <a routerLink="/services" class="action-card">
                      <span class="action-icon">🔍</span>
                      <span class="action-label">Find Services</span>
                    </a>
                    <a routerLink="/messages" class="action-card">
                      <span class="action-icon">💬</span>
                      <span class="action-label">Messages</span>
                    </a>
                    <a routerLink="/profile" class="action-card">
                      <span class="action-icon">👤</span>
                      <span class="action-label">Edit Profile</span>
                    </a>
                  </div>
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
                    <span class="empty-icon">📅</span>
                    <h3>No events created yet</h3>
                    <p>Start planning your first event</p>
                    <app-button routerLink="/events/create">Create Event</app-button>
                  </div>
                } @else {
                  <div class="events-grid">
                    @for (event of myEvents(); track event._id) {
                      <app-card
                        [title]="event.title"
                        [subtitle]="formatDate(event.date)"
                        [image]="event.coverPhoto || 'assets/images/event-placeholder.jpg'"
                        [badge]="event.status"
                        [badgeType]="getStatusBadgeType(event.status)"
                        hoverable
                        clickable
                        [hasFooter]="true"
                        [routerLink]="['/events', event.slug]"
                      >
                        <p class="card-location">📍 {{ event.locationName || event.city }}</p>
                        <p class="card-attendees">👥 {{ event.currentAttendees }} / {{ event.maxAttendees || '∞' }}</p>
                        <div card-footer class="card-footer">
                          <app-button size="sm" variant="ghost" [routerLink]="['/events', event.slug, 'edit']">Edit</app-button>
                          <app-button size="sm" variant="secondary" [routerLink]="['/events', event.slug]">View</app-button>
                        </div>
                      </app-card>
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
                    <span class="empty-icon">📋</span>
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
                        <span class="booking-status" [class]="'status--' + booking.status">{{ booking.status }}</span>
                        <span class="cell-amount">₹{{ booking.priceAgreed | number }}</span>
                        <span class="payment-status" [class]="'payment--' + booking.paymentStatus">{{ booking.paymentStatus }}</span>
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
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-4;
      margin-bottom: $spacing-8;

      @include md {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .stat-card {
      @include card;
      display: flex;
      align-items: center;
      gap: $spacing-4;
    }

    .stat-icon {
      @include flex-center;
      width: 48px;
      height: 48px;
      border-radius: $radius-lg;

      &--primary {
        background: $primary-100;
        color: $primary-600;
      }

      &--success {
        background: $success-light;
        color: $success-dark;
      }

      &--warning {
        background: $warning-light;
        color: $warning-dark;
      }

      &--info {
        background: $info-light;
        color: $info-dark;
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
    }

    .stat-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .dashboard-tabs {
      display: flex;
      gap: $spacing-2;
      margin-bottom: $spacing-6;
      border-bottom: 1px solid $border-light;
      overflow-x: auto;
    }

    .tab-btn {
      padding: $spacing-3 $spacing-4;
      font-weight: $font-weight-medium;
      color: $text-secondary;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      background: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all $transition-fast;

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
      grid-template-columns: 1fr;
      gap: $spacing-6;

      @include lg {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .dashboard-section {
      @include card;

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
        font-size: 3rem;
        display: block;
        margin-bottom: $spacing-4;
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
        transform: translateY(-2px);
      }
    }

    .action-icon {
      font-size: 1.5rem;
      margin-bottom: $spacing-2;
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
      justify-content: space-between;
    }

    .bookings-table {
      overflow-x: auto;
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: $spacing-4;
      padding: $spacing-3 $spacing-4;
      align-items: center;
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
  auth = inject(AuthService);

  activeTab = signal<'overview' | 'events' | 'bookings'>('overview');
  myEvents = signal<Event[]>([]);
  upcomingEvents = signal<Event[]>([]);
  recentBookings = signal<Booking[]>([]);
  isLoadingEvents = signal(true);
  isLoadingBookings = signal(true);

  ngOnInit(): void {
    const tab = this.route.snapshot.data['tab'];
    if (tab) {
      this.activeTab.set(tab);
    }

    this.loadMyEvents();
    this.loadBookings();
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
          response.data.filter(e => new Date(e.date) >= now)
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
}
