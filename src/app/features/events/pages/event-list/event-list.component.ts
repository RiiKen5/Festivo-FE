import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Event, EventType, EventFilters } from '../../../../core/models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, ButtonComponent, InputComponent, CardComponent, ErrorStateComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="events-page">
      <!-- Hero Section -->
      <section class="events-hero">
        <div class="container">
          <h1 class="events-hero__title">Discover Events</h1>
          <p class="events-hero__subtitle">Find and join exciting events happening near you</p>

          <!-- Search Bar -->
          <div class="search-bar">
            <div class="search-bar__input">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search events..."
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
              >
            </div>
            <div class="search-bar__location">
              <svg class="location-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <input
                type="text"
                placeholder="City"
                [(ngModel)]="cityFilter"
                (input)="onSearch()"
              >
            </div>
            <app-button (onClick)="loadEvents()">Search</app-button>
          </div>
        </div>
      </section>

      <!-- Filters & Results -->
      <section class="events-content">
        <div class="container">
          <div class="events-layout">
            <!-- Sidebar Filters -->
            <aside class="filters-sidebar">
              <div class="filters-section">
                <h3 class="filters-title">Event Type</h3>
                <div class="filter-options">
                  @for (type of eventTypes; track type.value) {
                    <label class="filter-option">
                      <input
                        type="checkbox"
                        [checked]="selectedTypes.includes(type.value)"
                        (change)="toggleType(type.value)"
                      >
                      <span class="filter-icon">{{ type.icon }}</span>
                      <span class="filter-label">{{ type.label }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="filters-section">
                <h3 class="filters-title">Date Range</h3>
                <div class="date-filters">
                  <button
                    class="date-btn"
                    [class.active]="dateFilter === 'today'"
                    (click)="setDateFilter('today')"
                  >Today</button>
                  <button
                    class="date-btn"
                    [class.active]="dateFilter === 'week'"
                    (click)="setDateFilter('week')"
                  >This Week</button>
                  <button
                    class="date-btn"
                    [class.active]="dateFilter === 'month'"
                    (click)="setDateFilter('month')"
                  >This Month</button>
                  <button
                    class="date-btn"
                    [class.active]="dateFilter === 'all'"
                    (click)="setDateFilter('all')"
                  >All</button>
                </div>
              </div>

              <div class="filters-section">
                <h3 class="filters-title">Price</h3>
                <div class="price-filters">
                  <label class="filter-option">
                    <input
                      type="radio"
                      name="price"
                      [checked]="priceFilter === 'all'"
                      (change)="setPriceFilter('all')"
                    >
                    <span class="filter-label">All</span>
                  </label>
                  <label class="filter-option">
                    <input
                      type="radio"
                      name="price"
                      [checked]="priceFilter === 'free'"
                      (change)="setPriceFilter('free')"
                    >
                    <span class="filter-label">Free</span>
                  </label>
                  <label class="filter-option">
                    <input
                      type="radio"
                      name="price"
                      [checked]="priceFilter === 'paid'"
                      (change)="setPriceFilter('paid')"
                    >
                    <span class="filter-label">Paid</span>
                  </label>
                </div>
              </div>

              <app-button variant="ghost" fullWidth (onClick)="clearFilters()">
                Clear All Filters
              </app-button>
            </aside>

            <!-- Events Grid -->
            <div class="events-main">
              <div class="events-header">
                <p class="events-count">
                  @if (isLoading()) {
                    Loading events...
                  } @else {
                    {{ totalEvents() }} events found
                  }
                </p>
                <div class="events-sort">
                  <select [(ngModel)]="sortBy" (change)="loadEvents()">
                    <option value="-date">Date (Nearest)</option>
                    <option value="date">Date (Furthest)</option>
                    <option value="-views">Most Popular</option>
                    <option value="-createdAt">Newest</option>
                  </select>
                </div>
              </div>

              @if (auth.isAuthenticated()) {
                <div class="create-event-banner">
                  <div class="banner-content">
                    <span class="banner-icon">🎉</span>
                    <div>
                      <h3>Planning an event?</h3>
                      <p>Create your event and start inviting guests</p>
                    </div>
                  </div>
                  <app-button routerLink="/events/create">Create Event</app-button>
                </div>
              }

              <div class="events-grid">
                @if (hasError()) {
                  <div class="error-wrapper">
                    <app-error-state
                      [type]="errorType()"
                      [showRetry]="true"
                      [isRetrying]="isRetrying()"
                      (onRetry)="retryLoad()"
                    ></app-error-state>
                  </div>
                } @else if (isLoading()) {
                  @for (i of [1,2,3,4,5,6]; track i) {
                    <div class="skeleton-card">
                      <div class="skeleton skeleton--image"></div>
                      <div class="skeleton-content">
                        <div class="skeleton skeleton--title"></div>
                        <div class="skeleton skeleton--text"></div>
                        <div class="skeleton skeleton--text" style="width: 60%"></div>
                      </div>
                    </div>
                  }
                } @else if (events().length === 0) {
                  <div class="empty-state">
                    <span class="empty-state__icon">🔍</span>
                    <h3 class="empty-state__title">No events found</h3>
                    <p class="empty-state__desc">Try adjusting your filters or search terms</p>
                    <app-button variant="secondary" (onClick)="clearFilters()">Clear Filters</app-button>
                  </div>
                } @else {
                  @for (event of events(); track event._id) {
                    <app-card
                      [title]="event.title"
                      [subtitle]="formatEventDate(event.date)"
                      [image]="event.coverPhoto || 'assets/images/event-placeholder.jpg'"
                      [badge]="event.eventType"
                      badgeType="primary"
                      hoverable
                      clickable
                      [routerLink]="['/events', event.slug]"
                    >
                      <div class="event-card-content">
                        <p class="event-location">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {{ event.locationName || event.city }}
                        </p>
                        <div class="event-meta">
                          <span class="event-attendees">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                              <path d="M16 3.13a4 4 0 010 7.75"/>
                            </svg>
                            {{ event.currentAttendees }}/{{ event.maxAttendees || '∞' }}
                          </span>
                          @if (event.isPaid) {
                            <span class="event-price">₹{{ event.entryFee }}</span>
                          } @else {
                            <span class="event-free">Free</span>
                          }
                        </div>
                      </div>
                    </app-card>
                  }
                }
              </div>

              <!-- Pagination -->
              @if (totalPages() > 1) {
                <div class="pagination">
                  <button
                    class="pagination__btn"
                    [disabled]="currentPage() === 1"
                    (click)="goToPage(currentPage() - 1)"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10 12L6 8l4-4"/>
                    </svg>
                    Previous
                  </button>
                  <div class="pagination__pages">
                    @for (page of getPageNumbers(); track page) {
                      <button
                        class="pagination__page"
                        [class.active]="page === currentPage()"
                        (click)="goToPage(page)"
                      >{{ page }}</button>
                    }
                  </div>
                  <button
                    class="pagination__btn"
                    [disabled]="currentPage() === totalPages()"
                    (click)="goToPage(currentPage() + 1)"
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 4l4 4-4 4"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .events-page {
      min-height: 100vh;
      background: $bg-secondary;
    }

    .events-hero {
      background: $bg-gradient-hero;
      color: $text-inverse;
      padding: $spacing-12 0;
      text-align: center;
    }

    .events-hero__title {
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-2;
    }

    .events-hero__subtitle {
      font-size: $font-size-lg;
      opacity: 0.9;
      margin-bottom: $spacing-8;
    }

    .search-bar {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      max-width: 800px;
      margin: 0 auto;
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-3;

      @include md {
        flex-direction: row;
        align-items: center;
      }
    }

    .search-bar__input,
    .search-bar__location {
      flex: 1;
      position: relative;

      input {
        width: 100%;
        padding: $spacing-3 $spacing-3 $spacing-3 $spacing-10;
        border: 1px solid $border-light;
        border-radius: $radius-default;
        font-size: $font-size-base;
        color: $text-primary;

        &:focus {
          outline: none;
          border-color: $primary-500;
        }
      }

      svg {
        position: absolute;
        left: $spacing-3;
        top: 50%;
        transform: translateY(-50%);
        color: $text-muted;
      }
    }

    .events-content {
      padding: $spacing-8 0;
    }

    .events-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-8;

      @include lg {
        grid-template-columns: 280px 1fr;
      }
    }

    .filters-sidebar {
      display: none;

      @include lg {
        display: block;
        background: $bg-primary;
        border-radius: $radius-lg;
        padding: $spacing-6;
        height: fit-content;
        position: sticky;
        top: calc($navbar-height + $spacing-4);
      }
    }

    .filters-section {
      margin-bottom: $spacing-6;
      padding-bottom: $spacing-6;
      border-bottom: 1px solid $border-light;

      &:last-of-type {
        margin-bottom: $spacing-4;
        padding-bottom: 0;
        border-bottom: none;
      }
    }

    .filters-title {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      text-transform: uppercase;
      letter-spacing: $letter-spacing-wide;
      color: $text-secondary;
      margin-bottom: $spacing-4;
    }

    .filter-options {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-2;
      border-radius: $radius-default;
      cursor: pointer;
      transition: background $transition-fast;

      &:hover {
        background: $neutral-50;
      }

      input {
        accent-color: $primary-600;
      }
    }

    .filter-icon {
      font-size: 1.25rem;
    }

    .filter-label {
      font-size: $font-size-sm;
    }

    .date-filters {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-2;
    }

    .date-btn {
      padding: $spacing-2 $spacing-3;
      border: 1px solid $border-light;
      border-radius: $radius-default;
      background: $bg-primary;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-300;
      }

      &.active {
        background: $primary-50;
        border-color: $primary-600;
        color: $primary-600;
      }
    }

    .events-main {
      min-width: 0;
    }

    .events-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-6;
    }

    .events-count {
      color: $text-secondary;
    }

    .events-sort select {
      padding: $spacing-2 $spacing-4;
      border: 1px solid $border-light;
      border-radius: $radius-default;
      background: $bg-primary;
      font-size: $font-size-sm;
      cursor: pointer;
    }

    .create-event-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-4 $spacing-6;
      background: linear-gradient(135deg, $primary-50 0%, $secondary-50 100%);
      border-radius: $radius-lg;
      margin-bottom: $spacing-6;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: $spacing-4;
    }

    .banner-icon {
      font-size: 2rem;
    }

    .banner-content h3 {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-1;
    }

    .banner-content p {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .events-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-6;

      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }

      @include xl {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .skeleton-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      overflow: hidden;
    }

    .skeleton-content {
      padding: $spacing-4;
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
    }

    .error-wrapper {
      grid-column: 1 / -1;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: $spacing-12;
    }

    .empty-state__icon {
      font-size: 4rem;
      display: block;
      margin-bottom: $spacing-4;
    }

    .empty-state__title {
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-2;
    }

    .empty-state__desc {
      color: $text-secondary;
      margin-bottom: $spacing-6;
    }

    .event-card-content {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
    }

    .event-location {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .event-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: $font-size-sm;
    }

    .event-attendees {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      color: $text-secondary;
    }

    .event-price {
      color: $primary-600;
      font-weight: $font-weight-semibold;
    }

    .event-free {
      color: $success;
      font-weight: $font-weight-medium;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: $spacing-2;
      margin-top: $spacing-8;
    }

    .pagination__btn {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-2 $spacing-4;
      border: 1px solid $border-light;
      border-radius: $radius-default;
      background: $bg-primary;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover:not(:disabled) {
        border-color: $primary-300;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .pagination__pages {
      display: flex;
      gap: $spacing-1;
    }

    .pagination__page {
      width: 36px;
      height: 36px;
      border: 1px solid $border-light;
      border-radius: $radius-default;
      background: $bg-primary;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-300;
      }

      &.active {
        background: $primary-600;
        border-color: $primary-600;
        color: $text-inverse;
      }
    }
  `]
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
  auth = inject(AuthService);

  events = signal<Event[]>([]);
  isLoading = signal(true);
  hasError = signal(false);
  errorType = signal<'generic' | 'network' | 'server'>('generic');
  isRetrying = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  totalEvents = signal(0);

  searchQuery = '';
  cityFilter = '';
  sortBy = '-date';
  dateFilter: 'today' | 'week' | 'month' | 'all' = 'all';
  priceFilter: 'all' | 'free' | 'paid' = 'all';
  selectedTypes: EventType[] = [];

  eventTypes = [
    { value: 'birthday' as EventType, label: 'Birthday', icon: '🎂' },
    { value: 'house_party' as EventType, label: 'House Party', icon: '🏠' },
    { value: 'meetup' as EventType, label: 'Meetup', icon: '🤝' },
    { value: 'wedding' as EventType, label: 'Wedding', icon: '💒' },
    { value: 'corporate' as EventType, label: 'Corporate', icon: '💼' },
    { value: 'farewell' as EventType, label: 'Farewell', icon: '👋' },
    { value: 'other' as EventType, label: 'Other', icon: '🎉' }
  ];

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const filters: EventFilters = {
      page: this.currentPage(),
      limit: 12,
      sort: this.sortBy,
      isPublic: true
    };

    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.cityFilter) filters.city = this.cityFilter;
    if (this.selectedTypes.length === 1) filters.eventType = this.selectedTypes[0];
    if (this.priceFilter === 'free') filters.isPaid = false;
    if (this.priceFilter === 'paid') filters.isPaid = true;

    // Date filters
    const today = new Date();
    if (this.dateFilter === 'today') {
      filters.minDate = today.toISOString().split('T')[0];
      filters.maxDate = today.toISOString().split('T')[0];
    } else if (this.dateFilter === 'week') {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      filters.minDate = today.toISOString().split('T')[0];
      filters.maxDate = weekEnd.toISOString().split('T')[0];
    } else if (this.dateFilter === 'month') {
      const monthEnd = new Date(today);
      monthEnd.setMonth(today.getMonth() + 1);
      filters.minDate = today.toISOString().split('T')[0];
      filters.maxDate = monthEnd.toISOString().split('T')[0];
    }

    this.eventService.getEvents(filters).subscribe({
      next: (response) => {
        this.events.set(response.data);
        this.totalEvents.set(response.pagination?.totalRecords || response.count);
        this.totalPages.set(response.pagination?.total || 1);
        this.isLoading.set(false);
        this.isRetrying.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.isRetrying.set(false);
        this.hasError.set(true);
        if (err.status === 0) {
          this.errorType.set('network');
        } else if (err.status >= 500) {
          this.errorType.set('server');
        } else {
          this.errorType.set('generic');
        }
      }
    });
  }

  retryLoad(): void {
    this.isRetrying.set(true);
    this.loadEvents();
  }

  onSearch(): void {
    this.currentPage.set(1);
    // Debounce search
    clearTimeout((this as any).searchTimeout);
    (this as any).searchTimeout = setTimeout(() => this.loadEvents(), 300);
  }

  toggleType(type: EventType): void {
    const index = this.selectedTypes.indexOf(type);
    if (index > -1) {
      this.selectedTypes.splice(index, 1);
    } else {
      this.selectedTypes.push(type);
    }
    this.currentPage.set(1);
    this.loadEvents();
  }

  setDateFilter(filter: 'today' | 'week' | 'month' | 'all'): void {
    this.dateFilter = filter;
    this.currentPage.set(1);
    this.loadEvents();
  }

  setPriceFilter(filter: 'all' | 'free' | 'paid'): void {
    this.priceFilter = filter;
    this.currentPage.set(1);
    this.loadEvents();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.cityFilter = '';
    this.dateFilter = 'all';
    this.priceFilter = 'all';
    this.selectedTypes = [];
    this.currentPage.set(1);
    this.loadEvents();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }

    return pages;
  }

  formatEventDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
