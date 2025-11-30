import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ServiceService } from '../../../../core/services/service.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Service } from '../../../../core/models/service.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, ButtonComponent, ModalComponent],
  template: `
    <app-navbar></app-navbar>

    @if (isLoading()) {
      <div class="loading-state">
        <div class="container">
          <div class="skeleton skeleton--image" style="height: 400px; border-radius: 16px;"></div>
          <div class="skeleton skeleton--title mt-6"></div>
          <div class="skeleton skeleton--text mt-4"></div>
        </div>
      </div>
    } @else if (service()) {
      <main class="service-detail">
        <div class="container">
          <!-- Gallery -->
          <div class="service-gallery">
            <div class="gallery-main">
              <img [src]="selectedImage() || service()?.coverImage || 'assets/images/service-placeholder.jpg'" [alt]="service()?.serviceName">
              @if (service()?.isVerified) {
                <div class="verified-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Verified Vendor
                </div>
              }
            </div>
            @if (service()?.portfolioImages?.length) {
              <div class="gallery-thumbnails">
                <button
                  class="thumbnail"
                  [class.active]="!selectedImage() || selectedImage() === service()?.coverImage"
                  (click)="selectImage(service()?.coverImage)"
                >
                  <img [src]="service()?.coverImage" alt="Cover">
                </button>
                @for (img of service()?.portfolioImages; track img) {
                  <button
                    class="thumbnail"
                    [class.active]="selectedImage() === img"
                    (click)="selectImage(img)"
                  >
                    <img [src]="img" alt="Portfolio">
                  </button>
                }
              </div>
            }
          </div>

          <div class="service-layout">
            <!-- Main Content -->
            <div class="service-main">
              <header class="service-header">
                <span class="service-category">{{ getCategoryLabel(service()?.category) }}</span>
                <h1 class="service-title">{{ service()?.serviceName }}</h1>
                <div class="service-meta">
                  <div class="service-rating">
                    <span class="rating-stars">⭐</span>
                    <span class="rating-value">{{ service()?.ratingAverage | number:'1.1-1' }}</span>
                    <span class="rating-count">({{ service()?.totalRatings }} reviews)</span>
                  </div>
                  <span class="meta-divider">•</span>
                  <span class="service-bookings">{{ service()?.completedBookings }} bookings completed</span>
                  <span class="meta-divider">•</span>
                  <span class="service-location">📍 {{ service()?.city }}</span>
                </div>
              </header>

              <section class="content-section">
                <h2>About this service</h2>
                <p class="service-description">{{ service()?.description }}</p>
              </section>

              <section class="content-section">
                <h2>Service Areas</h2>
                <div class="service-areas">
                  @for (area of service()?.serviceAreas; track area) {
                    <span class="area-tag">{{ area }}</span>
                  }
                  @if (!service()?.serviceAreas?.length) {
                    <span class="area-tag">{{ service()?.city }}</span>
                  }
                </div>
              </section>

              @if (service()?.tags?.length) {
                <section class="content-section">
                  <h2>Tags</h2>
                  <div class="service-tags">
                    @for (tag of service()?.tags; track tag) {
                      <span class="tag">{{ tag }}</span>
                    }
                  </div>
                </section>
              }

              <!-- Provider Info -->
              <section class="content-section">
                <h2>About the Vendor</h2>
                <div class="provider-card">
                  <div class="provider-avatar">
                    @if (getProvider()?.profilePhoto) {
                      <img [src]="getProvider()?.profilePhoto" [alt]="getProvider()?.name">
                    } @else {
                      <span>{{ getProvider()?.name?.charAt(0)?.toUpperCase() }}</span>
                    }
                  </div>
                  <div class="provider-info">
                    <h3>{{ getProvider()?.name }}</h3>
                    @if (service()?.businessName) {
                      <p class="business-name">{{ service()?.businessName }}</p>
                    }
                    <div class="provider-stats">
                      <span>⭐ {{ getProvider()?.ratingAverage | number:'1.1-1' }} rating</span>
                      <span>•</span>
                      <span>{{ service()?.totalBookings }} total bookings</span>
                    </div>
                  </div>
                  @if (auth.isAuthenticated() && getProvider()?._id !== auth.currentUser()?._id) {
                    <app-button variant="secondary" size="sm">Message</app-button>
                  }
                </div>
              </section>

              <!-- Reviews Section -->
              <section class="content-section">
                <h2>Reviews ({{ service()?.totalRatings }})</h2>
                <div class="reviews-summary">
                  <div class="rating-big">
                    <span class="rating-number">{{ service()?.ratingAverage | number:'1.1-1' }}</span>
                    <span class="rating-stars-big">⭐⭐⭐⭐⭐</span>
                    <span class="rating-label">{{ service()?.totalRatings }} reviews</span>
                  </div>
                </div>
                <p class="reviews-note">Reviews will be loaded here...</p>
              </section>
            </div>

            <!-- Sidebar -->
            <aside class="service-sidebar">
              <div class="booking-card">
                <div class="price-section">
                  <span class="price-label">Starting from</span>
                  <div class="price-main">
                    <span class="price-value">₹{{ service()?.basePrice | number }}</span>
                    <span class="price-unit">{{ formatPriceUnit(service()?.priceUnit) }}</span>
                  </div>
                </div>

                <div class="availability-badge" [class]="'availability--' + service()?.availability">
                  @switch (service()?.availability) {
                    @case ('available') {
                      <span class="dot"></span> Available for booking
                    }
                    @case ('busy') {
                      <span class="dot"></span> Currently busy
                    }
                    @default {
                      <span class="dot"></span> Not taking orders
                    }
                  }
                </div>

                @if (auth.isAuthenticated()) {
                  @if (service()?.availability === 'available') {
                    <app-button fullWidth (onClick)="bookingModal = true">
                      Book Now
                    </app-button>
                    <app-button variant="secondary" fullWidth>
                      Check Availability
                    </app-button>
                  } @else {
                    <app-button variant="secondary" fullWidth disabled>
                      Not Available
                    </app-button>
                  }
                  <app-button variant="ghost" fullWidth>
                    Save to Favorites
                  </app-button>
                } @else {
                  <app-button routerLink="/auth/login" fullWidth>
                    Login to Book
                  </app-button>
                }

                <div class="card-divider"></div>

                <div class="contact-info">
                  <h4>Contact Vendor</h4>
                  <p>Send a message to discuss your requirements</p>
                  @if (auth.isAuthenticated()) {
                    <app-button variant="secondary" fullWidth size="sm">
                      Send Message
                    </app-button>
                  }
                </div>

                <div class="share-section">
                  <span class="share-label">Share this service</span>
                  <div class="share-buttons">
                    <button class="share-btn" (click)="shareOnWhatsApp()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>
                    <button class="share-btn" (click)="copyLink()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <!-- Booking Modal -->
      <app-modal
        [isOpen]="bookingModal"
        title="Book Service"
        (onClose)="bookingModal = false"
        [showFooter]="true"
      >
        <div class="booking-form">
          <p>Select your event and date to book this service.</p>
          <p class="form-hint">You'll be able to discuss requirements after booking.</p>
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="bookingModal = false">Cancel</app-button>
          <app-button (onClick)="confirmBooking()">Confirm Booking</app-button>
        </div>
      </app-modal>
    } @else {
      <div class="error-state">
        <span class="error-icon">😕</span>
        <h2>Service not found</h2>
        <p>This service may have been removed or doesn't exist.</p>
        <app-button routerLink="/services">Browse Services</app-button>
      </div>
    }
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .loading-state,
    .error-state {
      min-height: calc(100vh - $navbar-height);
      padding: $spacing-8 0;
    }

    .error-state {
      @include flex-column-center;
      text-align: center;

      .error-icon {
        font-size: 4rem;
        margin-bottom: $spacing-4;
      }

      h2 { margin-bottom: $spacing-2; }
      p {
        color: $text-secondary;
        margin-bottom: $spacing-6;
      }
    }

    .service-detail {
      padding: $spacing-8 0;
      background: $bg-secondary;
    }

    .service-gallery {
      margin-bottom: $spacing-8;
    }

    .gallery-main {
      position: relative;
      border-radius: $radius-xl;
      overflow: hidden;
      height: 400px;

      @include md {
        height: 500px;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .verified-badge {
      position: absolute;
      top: $spacing-4;
      left: $spacing-4;
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-2 $spacing-4;
      background: $success;
      color: white;
      border-radius: $radius-full;
      font-weight: $font-weight-medium;
    }

    .gallery-thumbnails {
      display: flex;
      gap: $spacing-3;
      margin-top: $spacing-4;
      overflow-x: auto;
      @include scrollbar-custom;
    }

    .thumbnail {
      width: 80px;
      height: 60px;
      border-radius: $radius-default;
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      flex-shrink: 0;

      &.active {
        border-color: $accent-600;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .service-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-8;

      @include lg {
        grid-template-columns: 1fr 380px;
      }
    }

    .service-header {
      margin-bottom: $spacing-8;
    }

    .service-category {
      @include badge-primary;
      margin-bottom: $spacing-3;
    }

    .service-title {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-4;
    }

    .service-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: $spacing-2;
      color: $text-secondary;
    }

    .service-rating {
      display: flex;
      align-items: center;
      gap: $spacing-1;
    }

    .rating-value {
      font-weight: $font-weight-semibold;
      color: $text-primary;
    }

    .rating-count {
      color: $text-muted;
    }

    .meta-divider {
      color: $text-muted;
    }

    .content-section {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
      margin-bottom: $spacing-6;

      h2 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-4;
        padding-bottom: $spacing-3;
        border-bottom: 1px solid $border-light;
      }
    }

    .service-description {
      color: $text-secondary;
      line-height: $line-height-relaxed;
      white-space: pre-wrap;
    }

    .service-areas {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
    }

    .area-tag {
      padding: $spacing-2 $spacing-4;
      background: $accent-50;
      color: $accent-700;
      border-radius: $radius-full;
      font-size: $font-size-sm;
    }

    .service-tags {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
    }

    .tag {
      padding: $spacing-1 $spacing-3;
      background: $neutral-100;
      border-radius: $radius-full;
      font-size: $font-size-sm;
    }

    .provider-card {
      display: flex;
      align-items: center;
      gap: $spacing-4;
    }

    .provider-avatar {
      @include avatar(64px);
      @include flex-center;
      background: $bg-gradient-primary;
      color: $text-inverse;
      font-weight: $font-weight-bold;
      font-size: $font-size-xl;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }
    }

    .provider-info {
      flex: 1;

      h3 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }

      .business-name {
        color: $text-secondary;
        font-size: $font-size-sm;
        margin-bottom: $spacing-2;
      }
    }

    .provider-stats {
      display: flex;
      gap: $spacing-2;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .reviews-summary {
      text-align: center;
      padding: $spacing-6;
      background: $neutral-50;
      border-radius: $radius-lg;
      margin-bottom: $spacing-6;
    }

    .rating-big {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-2;
    }

    .rating-number {
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
    }

    .reviews-note {
      color: $text-secondary;
      text-align: center;
    }

    // Sidebar
    .service-sidebar {
      @include lg {
        position: sticky;
        top: calc($navbar-height + $spacing-4);
      }
    }

    .booking-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .price-section {
      text-align: center;
      padding-bottom: $spacing-4;
      border-bottom: 1px solid $border-light;
    }

    .price-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .price-main {
      display: flex;
      justify-content: center;
      align-items: baseline;
      gap: $spacing-1;
      margin-top: $spacing-2;
    }

    .price-value {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      color: $accent-600;
    }

    .price-unit {
      color: $text-secondary;
    }

    .availability-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-2;
      padding: $spacing-3;
      border-radius: $radius-default;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: $radius-full;
      }

      &.availability--available {
        background: $success-light;
        color: $success-dark;

        .dot { background: $success; }
      }

      &.availability--busy {
        background: $warning-light;
        color: $warning-dark;

        .dot { background: $warning; }
      }

      &.availability--not_taking_orders {
        background: $error-light;
        color: $error-dark;

        .dot { background: $error; }
      }
    }

    .card-divider {
      height: 1px;
      background: $border-light;
    }

    .contact-info {
      text-align: center;

      h4 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-2;
      }

      p {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: $spacing-4;
      }
    }

    .share-section {
      padding-top: $spacing-4;
      border-top: 1px solid $border-light;
    }

    .share-label {
      display: block;
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: $spacing-3;
    }

    .share-buttons {
      display: flex;
      gap: $spacing-2;
    }

    .share-btn {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-default;
      border: 1px solid $border-light;
      background: $bg-primary;
      color: $text-secondary;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $accent-300;
        color: $accent-600;
      }
    }

    .booking-form {
      p {
        color: $text-secondary;
        margin-bottom: $spacing-2;
      }

      .form-hint {
        font-size: $font-size-sm;
        color: $text-muted;
      }
    }
  `]
})
export class ServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private serviceService = inject(ServiceService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  service = signal<Service | null>(null);
  isLoading = signal(true);
  selectedImage = signal<string | undefined>(undefined);
  bookingModal = false;

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
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadService(slug);
    }
  }

  loadService(slug: string): void {
    this.serviceService.getServiceBySlug(slug).subscribe({
      next: (response) => {
        this.service.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getProvider(): User | null {
    const provider = this.service()?.provider;
    if (typeof provider === 'object') {
      return provider as User;
    }
    return null;
  }

  selectImage(img: string | undefined): void {
    this.selectedImage.set(img);
  }

  getCategoryLabel(category: string | undefined): string {
    if (!category) return '';
    return this.categories.find(c => c.value === category)?.label || category;
  }

  formatPriceUnit(unit: string | undefined): string {
    if (!unit) return '';
    const units: Record<string, string> = {
      'per_event': '/event',
      'per_hour': '/hour',
      'per_day': '/day',
      'per_person': '/person'
    };
    return units[unit] || '';
  }

  confirmBooking(): void {
    this.toast.success('Booking Request Sent!', 'The vendor will contact you soon.');
    this.bookingModal = false;
  }

  shareOnWhatsApp(): void {
    const url = window.location.href;
    const text = `Check out this service: ${this.service()?.serviceName}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href);
    this.toast.success('Link Copied!', 'Service link has been copied to clipboard.');
  }
}
