import { CitySelectComponent } from '../../../../shared/components/city-select/city-select.component';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { VendorCardComponent } from '../../../../shared/components/listing-cards/vendor-card.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ServiceService } from '../../../../core/services/service.service';
import { Service, ServiceCategory, ServiceFilters } from '../../../../core/models/service.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CitySelectComponent, CommonModule, RouterModule, FormsModule, ButtonComponent, IconComponent, EmptyStateComponent, VendorCardComponent, ErrorStateComponent],
  template: `
    <main class="page">
      <div class="container">
        <header class="page-header">
          <div>
            <h1>Vendors</h1>
            <p class="page-header__subtitle">Cakes, decor, photography, music and more for your event</p>
          </div>
        </header>

        <div class="toolbar" role="search">
          <label class="field field--grow">
            <app-icon name="search" [size]="18"></app-icon>
            <span class="visually-hidden">Search vendors</span>
            <input type="search" placeholder="Search vendors or services" [(ngModel)]="searchQuery" (input)="onSearch()">
          </label>
          <app-city-select class="toolbar__city" compact allowAny placeholder="Any city" ariaLabel="City"
                           [(ngModel)]="cityFilter" (cityChange)="onSearch()"></app-city-select>
          <label class="field field--select">
            <span class="visually-hidden">Sort by</span>
            <select [(ngModel)]="sortBy" (change)="loadServices()">
              <option value="-ratingAverage">Top rated</option>
              <option value="-totalBookings">Most booked</option>
              <option value="basePrice">Price: low to high</option>
              <option value="-basePrice">Price: high to low</option>
              <option value="-createdAt">Recently added</option>
            </select>
          </label>
        </div>

        <div class="filters">
          <div class="chips" role="group" aria-label="Category">
            <button type="button" class="chip" [class.chip--on]="!selectedCategory" [attr.aria-pressed]="!selectedCategory" (click)="setCategory(null)">All vendors</button>
            @for (cat of categories; track cat.value) {
              <button type="button" class="chip" [class.chip--on]="selectedCategory === cat.value" [attr.aria-pressed]="selectedCategory === cat.value" (click)="setCategory(cat.value)">
                <app-icon [name]="cat.icon" [size]="15"></app-icon>
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <p class="count" aria-live="polite">
          @if (!isLoading() && !hasError()) {
            {{ totalServices() }} {{ totalServices() === 1 ? 'vendor' : 'vendors' }}
          }
        </p>

        @if (hasError()) {
          <app-error-state [type]="errorType()" [showRetry]="true" [isRetrying]="isRetrying()" (onRetry)="retryLoad()"></app-error-state>
        } @else if (!isLoading() && services().length === 0) {
          <div class="panel">
            <app-empty-state icon="search" title="No vendors match your search" description="Try a different category or city, or clear your search.">
              <app-button variant="secondary" size="sm" (onClick)="clearFilters()">Clear search</app-button>
            </app-empty-state>
          </div>
        } @else {
          <div class="grid">
            @if (isLoading()) {
              @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                <div class="skeleton-card"><div class="skeleton skeleton--image"></div><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div></div>
              }
            } @else {
              @for (service of services(); track service._id) {
                <app-vendor-card [service]="service"></app-vendor-card>
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
export class ServiceListComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private route = inject(ActivatedRoute);

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
    { value: 'food' as ServiceCategory, label: 'Food & cakes', icon: 'utensils' },
    { value: 'decor' as ServiceCategory, label: 'Decoration', icon: 'flower' },
    { value: 'photography' as ServiceCategory, label: 'Photography', icon: 'camera' },
    { value: 'music' as ServiceCategory, label: 'Music & DJ', icon: 'music' },
    { value: 'entertainment' as ServiceCategory, label: 'Entertainment', icon: 'party' },
    { value: 'venue' as ServiceCategory, label: 'Venues', icon: 'map-pin' },
    { value: 'cleanup' as ServiceCategory, label: 'Cleanup', icon: 'sparkles' },
    { value: 'other' as ServiceCategory, label: 'Other', icon: 'store' }
  ];

  ngOnInit(): void {
    // Support links like /services?category=decor&q=balloons
    const params = this.route.snapshot.queryParamMap;
    const category = params.get('category') as ServiceCategory | null;
    if (category && this.categories.some(c => c.value === category)) {
      this.selectedCategory = category;
    }
    this.searchQuery = params.get('q') || '';
    this.cityFilter = params.get('city') || '';
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
        // The API returns { data, meta: { total, pages } }
        const meta = (response as any).meta;
        this.totalServices.set(meta?.total ?? response.data.length);
        this.totalPages.set(meta?.pages || 1);
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
