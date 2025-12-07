import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ServiceService } from '../../../../core/services/service.service';
import { Service, ServiceCategory, ServiceFilters } from '../../../../core/models/service.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, ButtonComponent, CardComponent, ErrorStateComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="services-page">
      <!-- Hero Section -->
      <section class="services-hero">
        <div class="container">
          <h1 class="services-hero__title">Find the Perfect Vendor</h1>
          <p class="services-hero__subtitle">Browse trusted vendors for catering, decoration, photography, and more</p>

          <div class="search-bar">
            <div class="search-bar__input">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search services..."
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
              >
            </div>
            <div class="search-bar__location">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <app-button (onClick)="loadServices()">Search</app-button>
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="categories-section">
        <div class="container">
          <div class="categories-scroll">
            <button
              class="category-btn"
              [class.active]="!selectedCategory"
              (click)="setCategory(null)"
            >
              <span class="category-icon">🎯</span>
              <span class="category-label">All</span>
            </button>
            @for (cat of categories; track cat.value) {
              <button
                class="category-btn"
                [class.active]="selectedCategory === cat.value"
                (click)="setCategory(cat.value)"
              >
                <span class="category-icon">{{ cat.icon }}</span>
                <span class="category-label">{{ cat.label }}</span>
              </button>
            }
          </div>
        </div>
      </section>

      <!-- Services Grid -->
      <section class="services-content">
        <div class="container">
          <div class="services-header">
            <p class="services-count">
              @if (isLoading()) {
                Loading services...
              } @else {
                {{ totalServices() }} services found
              }
            </p>
            <div class="services-sort">
              <select [(ngModel)]="sortBy" (change)="loadServices()">
                <option value="-ratingAverage">Top Rated</option>
                <option value="-totalBookings">Most Booked</option>
                <option value="basePrice">Price: Low to High</option>
                <option value="-basePrice">Price: High to Low</option>
                <option value="-createdAt">Newest</option>
              </select>
            </div>
          </div>

          <div class="services-grid">
            @if (isLoading()) {
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="skeleton-card">
                  <div class="skeleton skeleton--image"></div>
                  <div class="skeleton-content">
                    <div class="skeleton skeleton--title"></div>
                    <div class="skeleton skeleton--text"></div>
                    <div class="skeleton skeleton--text" style="width: 60%"></div>
                  </div>
                </div>
              }
            } @else if (hasError()) {
              <div class="error-container">
                <app-error-state
                  [type]="errorType()"
                  [isRetrying]="isRetrying()"
                  (onRetry)="retryLoad()">
                </app-error-state>
              </div>
            } @else if (services().length === 0) {
              <div class="empty-state">
                <span class="empty-state__icon">🔍</span>
                <h3 class="empty-state__title">No services found</h3>
                <p class="empty-state__desc">Try adjusting your filters or search terms</p>
                <app-button variant="secondary" (onClick)="clearFilters()">Clear Filters</app-button>
              </div>
            } @else {
              @for (service of services(); track service._id) {
                <div class="service-card" [routerLink]="['/services', service.slug]">
                  <div class="service-card__image" [style.background-image]="'url(' + (service.coverImage || 'assets/images/service-placeholder.jpeg') + ')'">
                    @if (service.isVerified) {
                      <span class="verified-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Verified
                      </span>
                    }
                    <span class="category-badge">{{ getCategoryLabel(service.category) }}</span>
                  </div>
                  <div class="service-card__content">
                    <h3 class="service-card__title">{{ service.serviceName }}</h3>
                    <p class="service-card__provider">by {{ getProviderName(service.provider) }}</p>

                    <div class="service-card__rating">
                      <span class="rating-stars">
                        @for (star of [1,2,3,4,5]; track star) {
                          <span [class.filled]="star <= service.ratingAverage">⭐</span>
                        }
                      </span>
                      <span class="rating-value">{{ service.ratingAverage | number:'1.1-1' }}</span>
                      <span class="rating-count">({{ service.totalRatings }} reviews)</span>
                    </div>

                    <div class="service-card__footer">
                      <div class="service-price">
                        <span class="price-value">₹{{ service.basePrice | number }}</span>
                        <span class="price-unit">{{ formatPriceUnit(service.priceUnit) }}</span>
                      </div>
                      <span class="service-bookings">{{ service.completedBookings }} bookings</span>
                    </div>
                  </div>
                </div>
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
      </section>
    </main>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .services-page {
      min-height: 100vh;
      background: $bg-secondary;
    }

    .services-hero {
      background: linear-gradient(135deg, $accent-600 0%, $accent-800 100%);
      color: $text-inverse;
      padding: $spacing-12 0;
      text-align: center;
    }

    .services-hero__title {
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-2;
    }

    .services-hero__subtitle {
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
          border-color: $accent-500;
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

    .categories-section {
      background: $bg-primary;
      border-bottom: 1px solid $border-light;
      padding: $spacing-4 0;
    }

    .categories-scroll {
      display: flex;
      gap: $spacing-3;
      overflow-x: auto;
      padding-bottom: $spacing-2;
      @include scrollbar-custom;
    }

    .category-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-3 $spacing-4;
      border-radius: $radius-lg;
      border: 2px solid transparent;
      background: $bg-primary;
      cursor: pointer;
      transition: all $transition-fast;
      white-space: nowrap;
      min-width: 80px;

      &:hover {
        background: $accent-50;
        border-color: $accent-200;
      }

      &.active {
        background: $accent-50;
        border-color: $accent-600;
      }
    }

    .category-icon {
      font-size: 1.5rem;
    }

    .category-label {
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }

    .services-content {
      padding: $spacing-8 0;
    }

    .services-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-6;
    }

    .services-count {
      color: $text-secondary;
    }

    .services-sort select {
      padding: $spacing-2 $spacing-4;
      border: 1px solid $border-light;
      border-radius: $radius-default;
      background: $bg-primary;
      font-size: $font-size-sm;
      cursor: pointer;
    }

    .services-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-6;

      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }

      @include lg {
        grid-template-columns: repeat(3, 1fr);
      }

      @include xl {
        grid-template-columns: repeat(4, 1fr);
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

    .error-container {
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

    .service-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      overflow: hidden;
      cursor: pointer;
      transition: all $transition-default;

      &:hover {
        box-shadow: $shadow-md;
        transform: translateY(-4px);
      }
    }

    .service-card__image {
      position: relative;
      height: 180px;
      background-size: cover;
      background-position: center;
      background-color: $neutral-200;
    }

    .verified-badge {
      position: absolute;
      top: $spacing-3;
      left: $spacing-3;
      display: flex;
      align-items: center;
      gap: $spacing-1;
      padding: $spacing-1 $spacing-2;
      background: $success;
      color: white;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }

    .category-badge {
      position: absolute;
      top: $spacing-3;
      right: $spacing-3;
      padding: $spacing-1 $spacing-2;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }

    .service-card__content {
      padding: $spacing-4;
    }

    .service-card__title {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-1;
      @include line-clamp(1);
    }

    .service-card__provider {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: $spacing-3;
    }

    .service-card__rating {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      margin-bottom: $spacing-3;
      font-size: $font-size-sm;
    }

    .rating-stars {
      display: flex;

      span {
        opacity: 0.3;
        font-size: 0.75rem;

        &.filled {
          opacity: 1;
        }
      }
    }

    .rating-value {
      font-weight: $font-weight-semibold;
    }

    .rating-count {
      color: $text-muted;
    }

    .service-card__footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: $spacing-3;
      border-top: 1px solid $border-light;
    }

    .service-price {
      display: flex;
      align-items: baseline;
      gap: $spacing-1;
    }

    .price-value {
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: $accent-600;
    }

    .price-unit {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .service-bookings {
      font-size: $font-size-xs;
      color: $text-muted;
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
        border-color: $accent-300;
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
        border-color: $accent-300;
      }

      &.active {
        background: $accent-600;
        border-color: $accent-600;
        color: $text-inverse;
      }
    }
  `]
})
export class ServiceListComponent implements OnInit {
  private serviceService = inject(ServiceService);

  services = signal<Service[]>([]);
  isLoading = signal(true);
  hasError = signal(false);
  errorType = signal<'generic' | 'network' | 'server'>('generic');
  isRetrying = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  totalServices = signal(0);

  searchQuery = '';
  cityFilter = '';
  sortBy = '-ratingAverage';
  selectedCategory: ServiceCategory | null = null;

  categories = [
    { value: 'food' as ServiceCategory, label: 'Food & Catering', icon: '🍽️' },
    { value: 'decor' as ServiceCategory, label: 'Decoration', icon: '🎨' },
    { value: 'photography' as ServiceCategory, label: 'Photography', icon: '📸' },
    { value: 'music' as ServiceCategory, label: 'Music & DJ', icon: '🎵' },
    { value: 'entertainment' as ServiceCategory, label: 'Entertainment', icon: '🎭' },
    { value: 'venue' as ServiceCategory, label: 'Venues', icon: '🏛️' },
    { value: 'cleanup' as ServiceCategory, label: 'Cleanup', icon: '🧹' },
    { value: 'other' as ServiceCategory, label: 'Other', icon: '✨' }
  ];

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const filters: ServiceFilters = {
      page: this.currentPage(),
      limit: 12,
      sort: this.sortBy
    };

    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.cityFilter) filters.city = this.cityFilter;
    if (this.selectedCategory) filters.category = this.selectedCategory;

    this.serviceService.getServices(filters).subscribe({
      next: (response) => {
        this.services.set(response.data);
        this.totalServices.set(response.pagination?.totalRecords || response.count);
        this.totalPages.set(response.pagination?.total || 1);
        this.isLoading.set(false);
        this.isRetrying.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.isRetrying.set(false);
        this.hasError.set(true);
        // Determine error type
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
    this.loadServices();
  }

  onSearch(): void {
    this.currentPage.set(1);
    clearTimeout((this as any).searchTimeout);
    (this as any).searchTimeout = setTimeout(() => this.loadServices(), 300);
  }

  setCategory(category: ServiceCategory | null): void {
    this.selectedCategory = category;
    this.currentPage.set(1);
    this.loadServices();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.cityFilter = '';
    this.selectedCategory = null;
    this.currentPage.set(1);
    this.loadServices();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadServices();
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

  getCategoryLabel(category: string): string {
    return this.categories.find(c => c.value === category)?.label || category;
  }

  getProviderName(provider: any): string {
    if (typeof provider === 'object' && provider?.name) {
      return provider.name;
    }
    return 'Vendor';
  }

  formatPriceUnit(unit: string): string {
    const units: Record<string, string> = {
      'per_event': '/event',
      'per_hour': '/hour',
      'per_day': '/day',
      'per_person': '/person'
    };
    return units[unit] || '';
  }
}
