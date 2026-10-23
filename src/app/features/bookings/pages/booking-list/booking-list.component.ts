import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { BookingService } from '../../../../core/services/booking.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Booking, BookingStatus } from '../../../../core/models/booking.model';
import { Event } from '../../../../core/models/event.model';
import { Service } from '../../../../core/models/service.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, ErrorStateComponent, IconComponent, EmptyStateComponent, ModalComponent],
  template: `

    <main class="bookings-page">
      <div class="container">
        <header class="page-header">
          <div>
            <h1>Bookings</h1>
            <p class="page-header__subtitle">Vendors you've booked, and requests from people booking you</p>
          </div>
        </header>

        <!-- Tabs -->
        <div class="booking-tabs">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'organizer'"
            (click)="setTab('organizer')"
          >
            Vendors I booked
            @if (organizerCount() > 0) {
              <span class="tab-badge">{{ organizerCount() }}</span>
            }
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'vendor'"
            (click)="setTab('vendor')"
          >
            Requests for me
            @if (vendorCount() > 0) {
              <span class="tab-badge">{{ vendorCount() }}</span>
            }
          </button>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="status-filters">
            <button
              class="filter-btn"
              [class.active]="statusFilter() === ''"
              (click)="setStatusFilter('')"
            >All</button>
            <button
              class="filter-btn"
              [class.active]="statusFilter() === 'pending'"
              (click)="setStatusFilter('pending')"
            >Pending</button>
            <button
              class="filter-btn"
              [class.active]="statusFilter() === 'confirmed'"
              (click)="setStatusFilter('confirmed')"
            >Confirmed</button>
            <button
              class="filter-btn"
              [class.active]="statusFilter() === 'completed'"
              (click)="setStatusFilter('completed')"
            >Completed</button>
            <button
              class="filter-btn"
              [class.active]="statusFilter() === 'cancelled'"
              (click)="setStatusFilter('cancelled')"
            >Cancelled</button>
          </div>
        </div>

        @if (hasError()) {
          <app-error-state
            [type]="errorType()"
            [showRetry]="true"
            [isRetrying]="isRetrying()"
            (onRetry)="retryLoad()"
          ></app-error-state>
        } @else if (isLoading()) {
          <div class="loading-state">
            @for (i of [1,2,3]; track i) {
              <div class="skeleton-card">
                <div class="skeleton skeleton--title"></div>
                <div class="skeleton skeleton--text"></div>
                <div class="skeleton skeleton--text" style="width: 60%"></div>
              </div>
            }
          </div>
        } @else if (filteredBookings().length === 0) {
          <div class="panel">
            @if (statusFilter()) {
              <app-empty-state icon="search" [title]="'No ' + formatStatus($any(statusFilter())).toLowerCase() + ' bookings'" description="Try another status, or view all bookings.">
                <app-button variant="secondary" size="sm" (onClick)="setStatusFilter('')">Show all</app-button>
              </app-empty-state>
            } @else if (activeTab() === 'organizer') {
              <app-empty-state icon="calendar" title="No vendors booked yet" description="Find a baker, decorator or photographer for your event and send a booking request.">
                <app-button size="sm" routerLink="/services">Find vendors</app-button>
              </app-empty-state>
            } @else {
              <app-empty-state icon="inbox" title="No booking requests yet" description="When an organizer books one of your services, the request appears here for you to quote and confirm.">
                <app-button variant="secondary" size="sm" routerLink="/dashboard/my-services">Manage my services</app-button>
              </app-empty-state>
            }
          </div>
        } @else {
          <div class="bookings-list">
            @for (booking of filteredBookings(); track booking._id) {
              <div class="booking-card" [routerLink]="['/bookings', booking._id]">
                <div class="booking-header">
                  <div class="service-info">
                    <h3><a class="booking-link" [routerLink]="['/bookings', booking._id]" (click)="$event.stopPropagation()">{{ getServiceName(booking.service) }}</a></h3>
                    <span class="event-name">for {{ getEventTitle(booking.event) }}</span>
                  </div>
                  <span class="status-badge" [class]="'status--' + booking.status">
                    {{ formatStatus(booking.status) }}
                  </span>
                </div>

                <div class="booking-details">
                  <div class="detail-item">
                    <app-icon name="calendar" [size]="16"></app-icon>
                    <span>{{ booking.eventDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="detail-item">
                    <app-icon name="wallet" [size]="16"></app-icon>
                    <span>₹{{ booking.priceAgreed | number }}</span>
                  </div>
                  <div class="detail-item">
                    <app-icon [name]="activeTab() === 'organizer' ? 'store' : 'user'" [size]="16"></app-icon>
                    <span>{{ activeTab() === 'organizer' ? getVendorName(booking.vendor) : getOrganizerName(booking.organizer) }}</span>
                  </div>
                  <div class="detail-item">
                    <app-icon name="credit-card" [size]="16"></app-icon>
                    <span class="payment-status" [class]="'payment--' + booking.paymentStatus">
                      {{ formatPaymentStatus(booking.paymentStatus) }}
                    </span>
                  </div>
                </div>

                <div class="booking-footer">
                  <span class="booking-date">Booked {{ booking.createdAt | date:'mediumDate' }}</span>
                  <div class="booking-actions">
                    @if (activeTab() === 'vendor' && booking.status === 'pending') {
                      <app-button size="sm" [routerLink]="['/bookings', booking._id]">Review &amp; quote</app-button>
                    }
                    @if (booking.status === 'pending' || booking.status === 'confirmed') {
                      <app-button
                        variant="ghost"
                        size="sm"
                        (onClick)="showCancelModal($event, booking)"
                      >Cancel</app-button>
                    }
                    @if (activeTab() === 'organizer' && booking.status === 'confirmed') {
                      <app-button
                        variant="secondary"
                        size="sm"
                        (onClick)="completeBooking($event, booking)"
                        [loading]="actionLoading() === booking._id"
                      >Mark Complete</app-button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </main>

    <!-- Cancel Modal -->
    <app-modal [isOpen]="cancelModal()" title="Cancel booking" size="sm" [showFooter]="true" (onClose)="cancelModal.set(false)">
      <p class="modal-text">The other party is notified. Online payments are refunded according to the <a routerLink="/refund-policy">cancellation policy</a>.</p>
      <label class="form-label" for="cancel-reason">Reason (optional)</label>
      <textarea id="cancel-reason" class="form-textarea" [(ngModel)]="cancelReason" placeholder="Let them know why" rows="3"></textarea>
      <div modal-footer>
        <app-button variant="secondary" (onClick)="cancelModal.set(false)">Keep booking</app-button>
        <app-button variant="danger" [loading]="actionLoading() === selectedBooking()?._id" (onClick)="cancelBooking()">Cancel booking</app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .panel {
      background: $bg-primary;
      border: 1px solid $border-light;
      border-radius: $radius-lg;
    }

    .booking-link {
      color: inherit;

      &:hover {
        color: inherit;
        text-decoration: underline;
      }
    }

    .modal-text {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .detail-item app-icon {
      color: $text-muted;
    }

    .bookings-page {
      min-height: calc(100vh - $navbar-height);
      background: $bg-secondary;
      padding: $spacing-8 0;
    }


    .booking-tabs {
      display: flex;
      gap: $spacing-2;
      margin-bottom: $spacing-6;
      border-bottom: 1px solid $border-light;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-3 $spacing-4;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: $text-secondary;
      font-weight: $font-weight-medium;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        color: $text-primary;
      }

      &.active {
        color: $primary-600;
        border-bottom-color: $primary-600;
      }
    }

    .tab-badge {
      padding: 2px 8px;
      background: $primary-100;
      color: $primary-700;
      border-radius: $radius-full;
      font-size: $font-size-xs;
    }

    .filters-section {
      margin-bottom: $spacing-6;
    }

    .status-filters {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
    }

    .filter-btn {
      padding: $spacing-2 $spacing-4;
      background: $bg-primary;
      border: 1px solid $border-light;
      border-radius: $radius-full;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-300;
      }

      &.active {
        background: $primary-50;
        border-color: $primary-500;
        color: $primary-700;
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .skeleton-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
    }

    .empty-state {
      text-align: center;
      padding: $spacing-16;
      background: $bg-primary;
      border-radius: $radius-lg;

      .empty-icon {
        font-size: 4rem;
        display: block;
        margin-bottom: $spacing-4;
      }

      h2 {
        font-size: $font-size-xl;
        margin-bottom: $spacing-2;
      }

      p {
        color: $text-secondary;
        margin-bottom: $spacing-6;
      }
    }

    .bookings-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .booking-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-5;
      cursor: pointer;
      transition: all $transition-default;

      &:hover {
        box-shadow: $shadow-md;
      }
    }

    .booking-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: $spacing-4;
    }

    .service-info h3 {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-1;
    }

    .event-name {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .status-badge {
      padding: $spacing-1 $spacing-3;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;

      &.status--pending {
        background: $warning-light;
        color: $warning-dark;
      }

      &.status--confirmed {
        background: $info-light;
        color: $info-dark;
      }

      &.status--in_progress {
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

    .booking-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-3;
      padding: $spacing-4;
      background: $neutral-50;
      border-radius: $radius-default;
      margin-bottom: $spacing-4;

      @include sm {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-sm;
    }

    .detail-icon {
      font-size: 1rem;
    }

    .payment-status {
      &.payment--unpaid {
        color: $error;
      }

      &.payment--partial {
        color: $warning-dark;
      }

      &.payment--paid {
        color: $success;
      }
    }

    .booking-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .booking-date {
      font-size: $font-size-sm;
      color: $text-muted;
    }

    .booking-actions {
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
      max-width: 450px;
      width: 100%;

      h3 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-2;
      }

      > p {
        color: $text-secondary;
        margin-bottom: $spacing-4;
      }
    }

    .form-group {
      margin-bottom: $spacing-4;

      label {
        @include form-label;
      }
    }

    .form-textarea {
      @include input-base;
      width: 100%;
      resize: vertical;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: $spacing-3;
    }
  `]
})
export class BookingListComponent implements OnInit {
  private bookingService = inject(BookingService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);
  hasError = signal(false);
  errorType = signal<'generic' | 'network' | 'server'>('generic');
  isRetrying = signal(false);
  activeTab = signal<'organizer' | 'vendor'>('organizer');
  statusFilter = signal<string>('');
  actionLoading = signal<string | null>(null);
  cancelModal = signal(false);
  selectedBooking = signal<Booking | null>(null);
  cancelReason = '';

  organizerCount = signal(0);
  vendorCount = signal(0);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.bookingService.getBookings().subscribe({
      next: (response) => {
        this.bookings.set(response.data);
        this.calculateCounts();
        // Vendors with only incoming requests start on that tab
        if (this.organizerCount() === 0 && this.vendorCount() > 0) {
          this.activeTab.set('vendor');
        }
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
    this.loadBookings();
  }

  calculateCounts(): void {
    const currentUserId = this.auth.currentUser()?._id;
    const bookings = this.bookings();

    this.organizerCount.set(
      bookings.filter(b => {
        const organizer = b.organizer as User;
        return organizer?._id === currentUserId || b.organizer === currentUserId;
      }).length
    );

    this.vendorCount.set(
      bookings.filter(b => {
        const vendor = b.vendor as User;
        return vendor?._id === currentUserId || b.vendor === currentUserId;
      }).length
    );
  }

  filteredBookings(): Booking[] {
    const currentUserId = this.auth.currentUser()?._id;
    let filtered = this.bookings();

    // Filter by role
    if (this.activeTab() === 'organizer') {
      filtered = filtered.filter(b => {
        const organizer = b.organizer as User;
        return organizer?._id === currentUserId || b.organizer === currentUserId;
      });
    } else {
      filtered = filtered.filter(b => {
        const vendor = b.vendor as User;
        return vendor?._id === currentUserId || b.vendor === currentUserId;
      });
    }

    // Filter by status
    if (this.statusFilter()) {
      filtered = filtered.filter(b => b.status === this.statusFilter());
    }

    return filtered;
  }

  setTab(tab: 'organizer' | 'vendor'): void {
    this.activeTab.set(tab);
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
  }

  getServiceName(service: Service | string): string {
    if (typeof service === 'object') {
      return service.serviceName;
    }
    return 'Service';
  }

  getEventTitle(event: Event | string): string {
    if (typeof event === 'object') {
      return event.title;
    }
    return 'Event';
  }

  getVendorName(vendor: User | string): string {
    if (typeof vendor === 'object') {
      return vendor.name;
    }
    return 'Vendor';
  }

  getOrganizerName(organizer: User | string): string {
    if (typeof organizer === 'object') {
      return organizer.name;
    }
    return 'Organizer';
  }

  formatStatus(status: BookingStatus): string {
    const statuses: Record<BookingStatus, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    return statuses[status] || status;
  }

  formatPaymentStatus(status: string): string {
    const statuses: Record<string, string> = {
      unpaid: 'Unpaid',
      partial: 'Partial',
      paid: 'Paid',
      refunded: 'Refunded'
    };
    return statuses[status] || status;
  }

  confirmBooking(event: Event | MouseEvent, booking: Booking): void {
    (event as MouseEvent).stopPropagation();
    this.actionLoading.set(booking._id);

    this.bookingService.confirmBooking(booking._id).subscribe({
      next: () => {
        this.bookings.update(bookings =>
          bookings.map(b =>
            b._id === booking._id ? { ...b, status: 'confirmed' as BookingStatus } : b
          )
        );
        this.actionLoading.set(null);
        this.toast.success('Booking Confirmed', 'The booking has been confirmed.');
      },
      error: () => {
        this.actionLoading.set(null);
      }
    });
  }

  completeBooking(event: Event | MouseEvent, booking: Booking): void {
    (event as MouseEvent).stopPropagation();
    this.actionLoading.set(booking._id);

    this.bookingService.completeBooking(booking._id).subscribe({
      next: () => {
        this.bookings.update(bookings =>
          bookings.map(b =>
            b._id === booking._id ? { ...b, status: 'completed' as BookingStatus } : b
          )
        );
        this.actionLoading.set(null);
        this.toast.success('Booking Completed', 'The booking has been marked as complete.');
      },
      error: () => {
        this.actionLoading.set(null);
      }
    });
  }

  showCancelModal(event: Event | MouseEvent, booking: Booking): void {
    (event as MouseEvent).stopPropagation();
    this.selectedBooking.set(booking);
    this.cancelReason = '';
    this.cancelModal.set(true);
  }

  cancelBooking(): void {
    const booking = this.selectedBooking();
    if (!booking) return;

    this.actionLoading.set(booking._id);

    this.bookingService.cancelBooking(booking._id, this.cancelReason || undefined).subscribe({
      next: () => {
        this.bookings.update(bookings =>
          bookings.map(b =>
            b._id === booking._id ? { ...b, status: 'cancelled' as BookingStatus } : b
          )
        );
        this.actionLoading.set(null);
        this.cancelModal.set(false);
        this.selectedBooking.set(null);
        this.toast.success('Booking Cancelled', 'The booking has been cancelled.');
      },
      error: () => {
        this.actionLoading.set(null);
      }
    });
  }
}
