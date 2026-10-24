import { CitySelectComponent } from '../../../../shared/components/city-select/city-select.component';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { EventCardComponent } from '../../../../shared/components/listing-cards/event-card.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Event, EventType, EventFilters } from '../../../../core/models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CitySelectComponent, CommonModule, RouterModule, FormsModule, ButtonComponent, IconComponent, EmptyStateComponent, EventCardComponent, ErrorStateComponent],
  template: `
    <main class="page">
      <div class="container">
        <header class="page-header">
          <div>
            <h1>Events</h1>
            <p class="page-header__subtitle">Public events you can join or buy tickets for</p>
          </div>
          @if (auth.isAuthenticated()) {
            <app-button routerLink="/events/create">
              <app-icon name="plus" [size]="16"></app-icon>
              Create event
            </app-button>
          }
        </header>

        <div class="toolbar" role="search">
          <label class="field field--grow">
            <app-icon name="search" [size]="18"></app-icon>
            <span class="visually-hidden">Search events</span>
            <input type="search" placeholder="Search events" [(ngModel)]="searchQuery" (input)="onSearch()">
          </label>
          <app-city-select class="toolbar__city" compact allowAny placeholder="Any city" ariaLabel="City"
                           [(ngModel)]="cityFilter" (cityChange)="onSearch()"></app-city-select>
          <label class="field field--select">
            <span class="visually-hidden">Sort by</span>
            <select [(ngModel)]="sortBy" (change)="loadEvents()">
              <option value="date">Soonest first</option>
              <option value="-date">Latest first</option>
              <option value="-views">Most viewed</option>
              <option value="-createdAt">Recently added</option>
            </select>
          </label>
        </div>

        <div class="filters" aria-label="Filters">
          <div class="chips" role="group" aria-label="Event type">
            @for (type of eventTypes; track type.value) {
              <button
                type="button"
                class="chip"
                [class.chip--on]="selectedTypes.includes(type.value)"
                [attr.aria-pressed]="selectedTypes.includes(type.value)"
                (click)="toggleType(type.value)"
              >
                <app-icon [name]="type.icon" [size]="15"></app-icon>
                {{ type.label }}
              </button>
            }
          </div>
          <div class="filters__row">
            <div class="segmented" role="group" aria-label="Date">
              @for (d of dateOptions; track d.value) {
                <button type="button" [class.active]="dateFilter === d.value" [attr.aria-pressed]="dateFilter === d.value" (click)="setDateFilter(d.value)">{{ d.label }}</button>
              }
            </div>
            <div class="segmented" role="group" aria-label="Price">
              @for (p of priceOptions; track p.value) {
                <button type="button" [class.active]="priceFilter === p.value" [attr.aria-pressed]="priceFilter === p.value" (click)="setPriceFilter(p.value)">{{ p.label }}</button>
              }
            </div>
            @if (hasActiveFilters()) {
              <button type="button" class="link-btn" (click)="clearFilters()">Clear filters</button>
            }
          </div>
        </div>

        <p class="count" aria-live="polite">
          @if (!isLoading() && !hasError()) {
            {{ totalEvents() }} {{ totalEvents() === 1 ? 'event' : 'events' }}
          }
        </p>

        @if (hasError()) {
          <app-error-state [type]="errorType()" [showRetry]="true" [isRetrying]="isRetrying()" (onRetry)="retryLoad()"></app-error-state>
        } @else if (!isLoading() && events().length === 0) {
          <div class="panel">
            @if (hasActiveFilters()) {
              <app-empty-state icon="search" title="No events match your filters" description="Try another date range or event type, or clear the filters to see everything.">
                <app-button variant="secondary" size="sm" (onClick)="clearFilters()">Clear filters</app-button>
              </app-empty-state>
            } @else {
              <app-empty-state icon="party" title="No public events yet" description="Be the first to host one. Private events stay invite-only and won't appear here.">
                <app-button size="sm" [routerLink]="auth.isAuthenticated() ? '/events/create' : '/auth/register'">Create an event</app-button>
              </app-empty-state>
            }
          </div>
        } @else {
          <div class="grid">
            @if (isLoading()) {
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="skeleton-card"><div class="skeleton skeleton--image"></div><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div></div>
              }
            } @else {
              @for (event of events(); track event._id) {
                <app-event-card [event]="event"></app-event-card>
              }
            }
          </div>
        }

        @if (totalPages() > 1) {
          <nav class="pagination" aria-label="Pagination">
            <button type="button" class="pagination__btn" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
              <app-icon name="arrow-left" [size]="16"></app-icon> Previous
            </button>
            <div class="pagination__pages">
              @for (page of getPageNumbers(); track page) {
                <button type="button" class="pagination__page" [class.active]="page === currentPage()" [attr.aria-current]="page === currentPage() ? 'page' : null" (click)="goToPage(page)">{{ page }}</button>
              }
            </div>
            <button type="button" class="pagination__btn" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
              Next <app-icon name="arrow-right" [size]="16"></app-icon>
            </button>
          </nav>
        }
      </div>
    </main>
  `,
  styleUrl: '../../../../shared/styles/listing-page.scss'
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
  sortBy = 'date';
  dateFilter: 'today' | 'week' | 'month' | 'all' = 'all';
  priceFilter: 'all' | 'free' | 'paid' = 'all';
  selectedTypes: EventType[] = [];

  eventTypes = [
    { value: 'birthday' as EventType, label: 'Birthday', icon: 'cake' },
    { value: 'house_party' as EventType, label: 'House party', icon: 'home' },
    { value: 'meetup' as EventType, label: 'Meetup', icon: 'users' },
    { value: 'wedding' as EventType, label: 'Wedding', icon: 'heart' },
    { value: 'corporate' as EventType, label: 'Corporate', icon: 'briefcase' },
    { value: 'farewell' as EventType, label: 'Farewell', icon: 'gift' },
    { value: 'other' as EventType, label: 'Other', icon: 'party' }
  ];

  dateOptions: { value: 'all' | 'today' | 'week' | 'month'; label: string }[] = [
    { value: 'all', label: 'Any date' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' }
  ];

  priceOptions: { value: 'all' | 'free' | 'paid'; label: string }[] = [
    { value: 'all', label: 'Any price' },
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' }
  ];

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.cityFilter || this.selectedTypes.length ||
      this.dateFilter !== 'all' || this.priceFilter !== 'all');
  }

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
    if (this.selectedTypes.length) filters.eventType = this.selectedTypes.join(',');
    if (this.priceFilter === 'free') filters.isPaid = false;
    if (this.priceFilter === 'paid') filters.isPaid = true;

    // Date filters: from the start of today to the end of the chosen range
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (this.dateFilter === 'today') {
      end.setDate(end.getDate() + 1);
    } else if (this.dateFilter === 'week') {
      end.setDate(end.getDate() + 8);
    } else if (this.dateFilter === 'month') {
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() + 1);
    }
    if (this.dateFilter !== 'all') {
      filters.dateFrom = start.toISOString();
      filters.dateTo = new Date(end.getTime() - 1).toISOString();
    }

    this.eventService.getEvents(filters).subscribe({
      next: (response) => {
        this.events.set(response.data);
        // The API returns { data, meta: { total, pages } }
        const meta = (response as any).meta;
        this.totalEvents.set(meta?.total ?? response.data.length);
        this.totalPages.set(meta?.pages || 1);
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
}
