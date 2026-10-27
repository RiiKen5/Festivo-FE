import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ServiceService } from '../../../../core/services/service.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AttributionService } from '../../../../core/services/attribution.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Service, ServiceCategory } from '../../../../core/models/service.model';

@Component({
  selector: 'app-my-services',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, ButtonComponent, ModalComponent],
  template: `

    <main class="my-services-page">
      <div class="container">
        <div class="page-header">
          <div class="header-content">
            <h1>My Services</h1>
            <p>Manage your service listings</p>
          </div>
          <div class="header-actions">
          <app-button variant="secondary" routerLink="/dashboard/calendar">
            <app-icon name="calendar" [size]="18"></app-icon>
            Calendar
          </app-button>
          <app-button routerLink="/services/create">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add New Service
          </app-button>
          </div>
        </div>

        @if (fees(); as f) {
          <div class="fee-banner">
            @if (auth.currentUser()?.foundingVendor && f.foundingOpen) {
              <p class="fee-banner__title">You're a founding vendor</p>
              <p>Festivo keeps <strong>{{ f.foundingOwnPercent }}%</strong> on customers who book through your own link and <strong>{{ f.foundingNewPercent }}%</strong> on new customers who find you on Festivo, until {{ foundingLastDay(f.foundingUntil) }}. Never more than ₹{{ f.cap | number }} a booking.</p>
            } @else {
              <p class="fee-banner__title">Your fees</p>
              <p>Festivo keeps <strong>{{ f.ownPercent }}%</strong> on customers who book through your own link and <strong>{{ f.newPercent }}%</strong> on new customers who find you on Festivo. Never more than ₹{{ f.cap | number }} a booking.</p>
            }
            <p>Use <strong>Share</strong> on a listing to send your link on Instagram or WhatsApp. Customers who first come through it count as yours.</p>
          </div>
        }

        @if (isLoading()) {
          <div class="loading-state">
            <div class="skeleton-grid">
              @for (i of [1,2,3]; track i) {
                <div class="skeleton-card">
                  <div class="skeleton skeleton--image"></div>
                  <div class="skeleton-content">
                    <div class="skeleton skeleton--title"></div>
                    <div class="skeleton skeleton--text"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else if (services().length === 0) {
          <div class="empty-state">
            <span class="empty-icon" aria-hidden="true"><app-icon name="store" [size]="28"></app-icon></span>
            <h2>No services yet</h2>
            <p>Create your first service listing to start getting bookings</p>
            <app-button routerLink="/services/create">Create Your First Service</app-button>
          </div>
        } @else {
          <div class="services-stats">
            <div class="stat-card">
              <span class="stat-value">{{ services().length }}</span>
              <span class="stat-label">Total Services</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ getActiveCount() }}</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ getTotalBookings() }}</span>
              <span class="stat-label">Total Bookings</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ getAverageRating() | number:'1.1-1' }}</span>
              <span class="stat-label">Avg Rating</span>
            </div>
          </div>

          <div class="share-tip">
            <app-icon name="share" [size]="18"></app-icon>
            <p>
              <strong>Get paid before the event.</strong>
              Put your Festivo link in your Instagram bio and send it with your quotes on WhatsApp.
              Customers book and pay here, and the money is released to you after the job.
            </p>
          </div>

          <div class="services-list">
            @for (service of services(); track service._id) {
              <div class="service-card" [class.inactive]="!service.isActive">
                <div class="service-image" [style.background-image]="'url(' + (service.coverImage || 'assets/images/service-placeholder.svg') + ')'">
                  <span class="category-badge">{{ getCategoryLabel(service.category) }}</span>
                  @if (!service.isActive) {
                    <span class="status-badge status--inactive">Inactive</span>
                  }
                  @if (service.isVerified) {
                    <span class="status-badge status--verified">Verified</span>
                  }
                </div>

                <div class="service-content">
                  <div class="service-main">
                    <h3>{{ service.serviceName }}</h3>
                    <p class="service-description">{{ service.description }}</p>

                    <div class="service-meta">
                      <div class="meta-item">
                        <span class="meta-icon" aria-hidden="true"><app-icon name="map-pin" [size]="14"></app-icon></span>
                        <span>{{ service.city }}</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-icon" aria-hidden="true"><app-icon name="wallet" [size]="14"></app-icon></span>
                        <span>₹{{ service.basePrice | number }} {{ formatPriceUnit(service.priceUnit) }}</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-icon">⭐</span>
                        <span>{{ service.ratingAverage | number:'1.1-1' }} ({{ service.totalRatings }} reviews)</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-icon" aria-hidden="true"><app-icon name="briefcase" [size]="14"></app-icon></span>
                        <span>{{ service.completedBookings }} bookings</span>
                      </div>
                    </div>
                  </div>

                  <div class="service-actions">
                    <div class="availability-toggle">
                      <label class="toggle-label">
                        <span>{{ service.isActive ? 'Active' : 'Inactive' }}</span>
                        <label class="toggle">
                          <input
                            type="checkbox"
                            [checked]="service.isActive"
                            (change)="toggleActive(service)"
                          >
                          <span class="toggle-slider"></span>
                        </label>
                      </label>
                    </div>

                    <div class="action-buttons">
                      <app-button
                        variant="secondary"
                        size="sm"
                        [routerLink]="['/services', service.slug]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        View
                      </app-button>
                      <app-button variant="secondary" size="sm" (onClick)="share(service)">
                        <app-icon name="share" [size]="16"></app-icon>
                        Share
                      </app-button>
                      <app-button
                        variant="secondary"
                        size="sm"
                        [routerLink]="['/services/edit', service._id]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </app-button>
                      <app-button
                        variant="ghost"
                        size="sm"
                        (onClick)="confirmDelete(service)"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </app-button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <app-modal [isOpen]="showDeleteModal()" title="Delete service" size="sm" [showFooter]="true" (onClose)="showDeleteModal.set(false)">
      <p class="modal-text">Remove "{{ serviceToDelete()?.serviceName }}" from Festivo? It will be hidden from search and can't be booked. Your existing bookings aren't affected.</p>
      <div modal-footer>
        <app-button variant="secondary" (onClick)="showDeleteModal.set(false)">Keep service</app-button>
        <app-button variant="danger" [loading]="isDeleting()" (onClick)="deleteService()">Delete service</app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .modal-text {
      margin: 0;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .my-services-page {
      min-height: calc(100vh - $navbar-height);
      background: $bg-secondary;
      padding: $spacing-8 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-8;
    }

    .header-content h1 {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-1;
    }

    .header-content p {
      color: $text-secondary;
    }

    .fee-banner {
      background: $bg-primary;
      border-left: 4px solid $primary-500;
      border-radius: $radius-lg;
      padding: $spacing-4 $spacing-5;
      margin-bottom: $spacing-6;
      font-size: $font-size-sm;
      color: $text-secondary;

      p { margin: 0 0 $spacing-2; }
      p:last-child { margin-bottom: 0; }
      strong { color: $text-primary; }
    }

    .fee-banner__title {
      font-weight: $font-weight-semibold;
      color: $text-primary;
      font-size: $font-size-base;
    }

    .services-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-4;
      margin-bottom: $spacing-8;

      @include md {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .header-actions { display: flex; flex-wrap: wrap; gap: $spacing-2; }

    .share-tip {
      display: flex;
      gap: $spacing-3;
      align-items: flex-start;
      padding: $spacing-4;
      margin-bottom: $spacing-6;
      border-radius: $radius-lg;
      background: $bg-secondary;
      border: 1px solid $border-light;
      color: $text-secondary;
      font-size: $font-size-sm;

      app-icon { color: $primary-600; flex-shrink: 0; margin-top: 2px; }
      p { margin: 0; }
      strong { color: $text-primary; }
    }

    .stat-card {
      @include card;
      text-align: center;
      padding: $spacing-4;
    }

    .stat-value {
      display: block;
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: $primary-600;
      margin-bottom: $spacing-1;
    }

    .stat-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .skeleton-grid {
      display: grid;
      gap: $spacing-4;
    }

    .skeleton-card {
      display: flex;
      background: $bg-primary;
      border-radius: $radius-lg;
      overflow: hidden;
    }

    .skeleton--image {
      width: 200px;
      height: 150px;
      flex-shrink: 0;
    }

    .skeleton-content {
      flex: 1;
      padding: $spacing-4;
    }

    .empty-state {
      text-align: center;
      padding: $spacing-16;
      background: $bg-primary;
      border-radius: $radius-lg;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: $spacing-4;
    }

    .empty-state h2 {
      font-size: $font-size-xl;
      margin-bottom: $spacing-2;
    }

    .empty-state p {
      color: $text-secondary;
      margin-bottom: $spacing-6;
    }

    .services-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .service-card {
      display: flex;
      flex-direction: column;
      background: $bg-primary;
      border-radius: $radius-lg;
      overflow: hidden;
      transition: all $transition-default;

      @include md {
        flex-direction: row;
      }

      &:hover {
        box-shadow: $shadow-md;
      }

      &.inactive {
        opacity: 0.7;
      }
    }

    .service-image {
      position: relative;
      width: 100%;
      height: 180px;
      background-size: cover;
      background-position: center;
      background-color: $neutral-200;

      @include md {
        width: 250px;
        height: auto;
        min-height: 200px;
      }
    }

    .category-badge {
      position: absolute;
      bottom: $spacing-3;
      left: $spacing-3;
      padding: $spacing-1 $spacing-3;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: $radius-full;
      font-size: $font-size-xs;
    }

    .status-badge {
      position: absolute;
      top: $spacing-3;
      right: $spacing-3;
      padding: $spacing-1 $spacing-3;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;

      &.status--inactive {
        background: $error-light;
        color: $error-dark;
      }

      &.status--verified {
        background: $success;
        color: white;
      }
    }

    .service-content {
      flex: 1;
      padding: $spacing-5;
      display: flex;
      flex-direction: column;

      @include md {
        flex-direction: row;
        justify-content: space-between;
      }
    }

    .service-main {
      flex: 1;
    }

    .service-main h3 {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-2;
    }

    .service-description {
      color: $text-secondary;
      font-size: $font-size-sm;
      margin-bottom: $spacing-4;
      @include line-clamp(2);
    }

    .service-meta {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-4;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .meta-icon {
      font-size: 1rem;
    }

    .service-actions {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
      margin-top: $spacing-4;

      @include md {
        margin-top: 0;
        margin-left: $spacing-6;
        align-items: flex-end;
      }
    }

    .availability-toggle {
      display: flex;
      align-items: center;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;

      input:focus-visible + .toggle-slider {
        box-shadow: $focus-ring;
      }

      input {
        opacity: 0;
        width: 0;
        height: 0;

        &:checked + .toggle-slider {
          background: $success;
        }

        &:checked + .toggle-slider::before {
          transform: translateX(20px);
        }
      }
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: $neutral-300;
      border-radius: $radius-full;
      transition: background $transition-fast;

      &::before {
        content: '';
        position: absolute;
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: $radius-full;
        transition: transform $transition-fast;
      }
    }

    .action-buttons {
      display: flex;
      gap: $spacing-2;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: $spacing-4;
    }

    .modal-content {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
      max-width: 400px;
      width: 100%;

      h3 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-3;
      }

      p {
        color: $text-secondary;
        margin-bottom: $spacing-6;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: $spacing-3;
    }
  `]
})
export class MyServicesComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private toast = inject(ToastService);
  private attribution = inject(AttributionService);
  private analytics = inject(AnalyticsService);
  auth = inject(AuthService);
  fees = toSignal(inject(PaymentService).getConfig().pipe(map(c => c.bookingFees)));

  // Founding terms end at midnight IST; show the last day they apply
  foundingLastDay(until: string): string {
    return new Date(new Date(until).getTime() - 1).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  }

  services = signal<Service[]>([]);
  isLoading = signal(true);
  showDeleteModal = signal(false);
  serviceToDelete = signal<Service | null>(null);
  isDeleting = signal(false);

  // The vendor's own booking link, tagged so customers it brings are counted
  async share(service: Service): Promise<void> {
    const url = this.attribution.tagged(`/services/${service.slug || service._id}`, 'vendor_share', 'link');
    this.analytics.track('listing_shared', { serviceId: service._id, channel: 'my_services', own: true });
    if (navigator.share) {
      try {
        await navigator.share({ title: service.serviceName, text: `Book ${service.serviceName} on Festivo`, url });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      this.toast.success('Link copied', 'Paste it in your Instagram bio or send it to customers on WhatsApp.');
    } catch {
      this.toast.info('Your booking link', url);
    }
  }

  categories = [
    { value: 'food', label: 'Food & Catering' },
    { value: 'decor', label: 'Decoration' },
    { value: 'photography', label: 'Photography' },
    { value: 'music', label: 'Music & DJ' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'venue', label: 'Venues' },
    { value: 'cleanup', label: 'Cleanup' },
    { value: 'other', label: 'Other' }
  ];

  ngOnInit(): void {
    // Founding status is granted when the first service is listed
    this.auth.loadCurrentUser();
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading.set(true);
    this.serviceService.getMyServices().subscribe({
      next: (response) => {
        this.services.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getCategoryLabel(category: string): string {
    return this.categories.find(c => c.value === category)?.label || category;
  }

  formatPriceUnit(unit: string): string {
    const units: Record<string, string> = {
      'per_event': '/event',
      'per_hour': '/hr',
      'per_day': '/day',
      'per_person': '/person'
    };
    return units[unit] || '';
  }

  getActiveCount(): number {
    return this.services().filter(s => s.isActive).length;
  }

  getTotalBookings(): number {
    return this.services().reduce((sum, s) => sum + s.completedBookings, 0);
  }

  getAverageRating(): number {
    const servicesWithRating = this.services().filter(s => s.totalRatings > 0);
    if (servicesWithRating.length === 0) return 0;
    const total = servicesWithRating.reduce((sum, s) => sum + s.ratingAverage, 0);
    return total / servicesWithRating.length;
  }

  toggleActive(service: Service): void {
    const newStatus = !service.isActive;
    this.serviceService.updateService(service._id, { isActive: newStatus }).subscribe({
      next: () => {
        this.services.update(services =>
          services.map(s =>
            s._id === service._id ? { ...s, isActive: newStatus } : s
          )
        );
        this.toast.success(
          newStatus ? 'Service Activated' : 'Service Deactivated',
          newStatus ? 'Your service is now visible to customers.' : 'Your service is now hidden.'
        );
      },
      error: () => {
        this.toast.error('Error', 'Failed to update service status');
      }
    });
  }

  confirmDelete(service: Service): void {
    this.serviceToDelete.set(service);
    this.showDeleteModal.set(true);
  }

  deleteService(): void {
    const service = this.serviceToDelete();
    if (!service) return;

    this.isDeleting.set(true);
    this.serviceService.deleteService(service._id).subscribe({
      next: () => {
        this.services.update(services => services.filter(s => s._id !== service._id));
        this.showDeleteModal.set(false);
        this.serviceToDelete.set(null);
        this.isDeleting.set(false);
        this.toast.success('Service Deleted', 'Your service has been removed.');
      },
      error: () => {
        this.isDeleting.set(false);
      }
    });
  }
}
