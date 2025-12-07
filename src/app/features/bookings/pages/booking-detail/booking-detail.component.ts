import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { BookingService } from '../../../../core/services/booking.service';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Booking, BookingStatus, PaymentMethod } from '../../../../core/models/booking.model';
import { ReviewCreateData } from '../../../../core/models/review.model';
import { Event } from '../../../../core/models/event.model';
import { Service } from '../../../../core/models/service.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, ButtonComponent, ModalComponent],
  template: `
    <app-navbar></app-navbar>

    @if (isLoading()) {
      <div class="loading-state">
        <div class="container">
          <div class="skeleton skeleton--title"></div>
          <div class="skeleton skeleton--text"></div>
        </div>
      </div>
    } @else if (booking()) {
      <main class="booking-detail-page">
        <div class="container">
          <button class="back-btn" routerLink="/bookings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Bookings
          </button>

          <div class="booking-layout">
            <!-- Main Content -->
            <div class="booking-main">
              <!-- Header -->
              <div class="booking-header">
                <div class="header-info">
                  <span class="status-badge" [class]="'status--' + booking()?.status">
                    {{ formatStatus(booking()?.status) }}
                  </span>
                  <h1>{{ getServiceName(booking()?.service) }}</h1>
                  <p class="event-name">for {{ getEventTitle(booking()?.event) }}</p>
                </div>
              </div>

              <!-- Details Card -->
              <div class="detail-card">
                <h2>Booking Details</h2>

                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">Event Date</span>
                    <span class="value">{{ booking()?.eventDate | date:'fullDate' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Booking Date</span>
                    <span class="value">{{ booking()?.createdAt | date:'mediumDate' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Agreed Price</span>
                    <span class="value price">₹{{ booking()?.priceAgreed | number }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Amount Paid</span>
                    <span class="value">₹{{ booking()?.pricePaid | number }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Payment Status</span>
                    <span class="value payment-status" [class]="'payment--' + booking()?.paymentStatus">
                      {{ formatPaymentStatus(booking()?.paymentStatus) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Balance Due</span>
                    <span class="value" [class.text-error]="getBalance() > 0">
                      ₹{{ getBalance() | number }}
                    </span>
                  </div>
                </div>

                @if (booking()?.notes) {
                  <div class="notes-section">
                    <h3>Notes</h3>
                    <p>{{ booking()?.notes }}</p>
                  </div>
                }

                @if (booking()?.requirements) {
                  <div class="notes-section">
                    <h3>Requirements</h3>
                    <p>{{ booking()?.requirements }}</p>
                  </div>
                }
              </div>

              <!-- Service Info -->
              <div class="detail-card">
                <h2>Service Information</h2>
                <div class="service-card">
                  <div class="service-image" [style.background-image]="'url(' + getServiceImage() + ')'"></div>
                  <div class="service-info">
                    <h3>{{ getServiceName(booking()?.service) }}</h3>
                    <p class="service-category">{{ getServiceCategory() }}</p>
                    <div class="service-meta">
                      <span>⭐ {{ getServiceRating() | number:'1.1-1' }}</span>
                      <span>•</span>
                      <span>{{ getServiceBookings() }} bookings</span>
                    </div>
                  </div>
                  <app-button
                    variant="secondary"
                    size="sm"
                    [routerLink]="['/services', getServiceSlug()]"
                  >View Service</app-button>
                </div>
              </div>

              <!-- Timeline -->
              @if (booking()?.status === 'cancelled') {
                <div class="detail-card">
                  <h2>Cancellation Details</h2>
                  <div class="cancellation-info">
                    <p><strong>Cancelled on:</strong> {{ booking()?.cancelledAt | date:'medium' }}</p>
                    @if (booking()?.cancellationReason) {
                      <p><strong>Reason:</strong> {{ booking()?.cancellationReason }}</p>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Sidebar -->
            <div class="booking-sidebar">
              <!-- Vendor/Organizer Card -->
              <div class="contact-card">
                <h3>{{ isVendor() ? 'Organizer' : 'Vendor' }}</h3>
                <div class="contact-info">
                  <div class="contact-avatar">
                    @if (getContactPhoto()) {
                      <img [src]="getContactPhoto()" [alt]="getContactName()">
                    } @else {
                      <span>{{ getContactName().charAt(0).toUpperCase() }}</span>
                    }
                  </div>
                  <div class="contact-details">
                    <h4>{{ getContactName() }}</h4>
                    <p>{{ getContactEmail() }}</p>
                  </div>
                </div>
                <app-button variant="secondary" fullWidth routerLink="/messages">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  Send Message
                </app-button>
              </div>

              <!-- Actions -->
              <div class="actions-card">
                <h3>Actions</h3>

                @if (isVendor()) {
                  <!-- Vendor Actions -->
                  @if (booking()?.status === 'pending') {
                    <app-button fullWidth [loading]="actionLoading()" (onClick)="confirmBooking()">
                      Confirm Booking
                    </app-button>
                  }
                  @if (booking()?.status === 'confirmed') {
                    <app-button fullWidth [loading]="actionLoading()" (onClick)="completeBooking()">
                      Mark as Complete
                    </app-button>
                  }
                } @else {
                  <!-- Organizer Actions -->
                  @if (booking()?.paymentStatus !== 'paid' && (booking()?.status === 'confirmed' || booking()?.status === 'pending')) {
                    <app-button fullWidth (onClick)="showPaymentModal.set(true)">
                      Record Payment
                    </app-button>
                  }
                }

                @if (booking()?.status === 'pending' || booking()?.status === 'confirmed') {
                  <app-button
                    variant="ghost"
                    fullWidth
                    (onClick)="showCancelModal.set(true)"
                  >Cancel Booking</app-button>
                }

                @if (booking()?.status === 'completed' && !booking()?.rating && !isVendor()) {
                  <app-button variant="secondary" fullWidth (onClick)="showReviewModal.set(true)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Leave a Review
                  </app-button>
                }
                @if (booking()?.rating) {
                  <div class="review-submitted">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Review Submitted
                  </div>
                }
              </div>

              <!-- Event Info -->
              <div class="event-card">
                <h3>Event Details</h3>
                <div class="event-info">
                  <p class="event-title">{{ getEventTitle(booking()?.event) }}</p>
                  <div class="event-meta">
                    <span>📅 {{ getEventDate() | date:'mediumDate' }}</span>
                    <span>📍 {{ getEventLocation() }}</span>
                  </div>
                </div>
                <app-button
                  variant="ghost"
                  size="sm"
                  [routerLink]="['/events', getEventId()]"
                >View Event</app-button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Cancel Modal -->
      <app-modal
        [isOpen]="showCancelModal()"
        title="Cancel Booking"
        (onClose)="showCancelModal.set(false)"
        [showFooter]="true"
      >
        <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
        <div class="form-group">
          <label>Reason (optional)</label>
          <textarea
            class="form-textarea"
            [(ngModel)]="cancelReason"
            placeholder="Enter cancellation reason..."
            rows="3"
          ></textarea>
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="showCancelModal.set(false)">Close</app-button>
          <app-button variant="danger" [loading]="actionLoading()" (onClick)="cancelBooking()">
            Cancel Booking
          </app-button>
        </div>
      </app-modal>

      <!-- Payment Modal -->
      <app-modal
        [isOpen]="showPaymentModal()"
        title="Record Payment"
        (onClose)="showPaymentModal.set(false)"
        [showFooter]="true"
      >
        <div class="payment-form">
          <div class="form-group">
            <label>Amount</label>
            <input
              type="number"
              class="form-input"
              [(ngModel)]="paymentAmount"
              [max]="getBalance()"
              placeholder="Enter amount"
            >
            <p class="hint">Balance due: ₹{{ getBalance() | number }}</p>
          </div>
          <div class="form-group">
            <label>Payment Method</label>
            <select class="form-select" [(ngModel)]="paymentMethod">
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </div>
          <div class="form-group">
            <label>Transaction ID (optional)</label>
            <input
              type="text"
              class="form-input"
              [(ngModel)]="transactionId"
              placeholder="Enter transaction reference"
            >
          </div>
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="showPaymentModal.set(false)">Cancel</app-button>
          <app-button [loading]="actionLoading()" (onClick)="recordPayment()">
            Record Payment
          </app-button>
        </div>
      </app-modal>

      <!-- Review Modal -->
      <app-modal
        [isOpen]="showReviewModal()"
        title="Leave a Review"
        (onClose)="showReviewModal.set(false)"
        [showFooter]="true"
      >
        <div class="review-form">
          <p class="review-intro">How was your experience with <strong>{{ getServiceName(booking()?.service) }}</strong>?</p>

          <!-- Overall Rating -->
          <div class="rating-input-section">
            <label>Overall Rating</label>
            <div class="star-rating">
              @for (star of [1,2,3,4,5]; track star) {
                <button
                  type="button"
                  class="star-btn"
                  [class.filled]="star <= reviewData.rating"
                  (click)="setRating('rating', star)">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              }
            </div>
          </div>

          <!-- Sub-Ratings -->
          <div class="sub-ratings">
            <div class="sub-rating-row">
              <span class="sub-rating-label">Quality</span>
              <div class="star-rating small">
                @for (star of [1,2,3,4,5]; track star) {
                  <button
                    type="button"
                    class="star-btn"
                    [class.filled]="star <= reviewData.ratings.quality"
                    (click)="setRating('quality', star)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
            <div class="sub-rating-row">
              <span class="sub-rating-label">Punctuality</span>
              <div class="star-rating small">
                @for (star of [1,2,3,4,5]; track star) {
                  <button
                    type="button"
                    class="star-btn"
                    [class.filled]="star <= reviewData.ratings.punctuality"
                    (click)="setRating('punctuality', star)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
            <div class="sub-rating-row">
              <span class="sub-rating-label">Professionalism</span>
              <div class="star-rating small">
                @for (star of [1,2,3,4,5]; track star) {
                  <button
                    type="button"
                    class="star-btn"
                    [class.filled]="star <= reviewData.ratings.professionalism"
                    (click)="setRating('professionalism', star)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
            <div class="sub-rating-row">
              <span class="sub-rating-label">Value for Money</span>
              <div class="star-rating small">
                @for (star of [1,2,3,4,5]; track star) {
                  <button
                    type="button"
                    class="star-btn"
                    [class.filled]="star <= reviewData.ratings.valueForMoney"
                    (click)="setRating('valueForMoney', star)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Review Text -->
          <div class="form-group">
            <label>Your Review</label>
            <textarea
              class="form-textarea"
              [(ngModel)]="reviewData.reviewText"
              placeholder="Share your experience with this service..."
              rows="4"
            ></textarea>
          </div>
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="showReviewModal.set(false)">Cancel</app-button>
          <app-button [loading]="actionLoading()" (onClick)="submitReview()">
            Submit Review
          </app-button>
        </div>
      </app-modal>
    } @else {
      <div class="error-state">
        <span class="error-icon">😕</span>
        <h2>Booking not found</h2>
        <p>This booking may have been removed or doesn't exist.</p>
        <app-button routerLink="/bookings">Back to Bookings</app-button>
      </div>
    }
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .loading-state,
    .error-state {
      min-height: calc(100vh - $navbar-height);
      padding: $spacing-8;
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

    .booking-detail-page {
      min-height: calc(100vh - $navbar-height);
      background: $bg-secondary;
      padding: $spacing-8 0;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      color: $text-secondary;
      font-size: $font-size-sm;
      margin-bottom: $spacing-6;
      background: none;
      border: none;
      cursor: pointer;
      transition: color $transition-fast;

      &:hover {
        color: $primary-600;
      }
    }

    .booking-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-6;

      @include lg {
        grid-template-columns: 1fr 350px;
      }
    }

    .booking-header {
      @include card;
      margin-bottom: $spacing-6;
    }

    .status-badge {
      display: inline-block;
      padding: $spacing-1 $spacing-3;
      border-radius: $radius-full;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      margin-bottom: $spacing-3;

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

    .header-info h1 {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-1;
    }

    .event-name {
      color: $text-secondary;
    }

    .detail-card {
      @include card;
      margin-bottom: $spacing-6;

      h2 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-4;
        padding-bottom: $spacing-3;
        border-bottom: 1px solid $border-light;
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-4;

      @include sm {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .detail-item {
      .label {
        display: block;
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: $spacing-1;
      }

      .value {
        font-weight: $font-weight-medium;

        &.price {
          font-size: $font-size-lg;
          color: $primary-600;
        }
      }
    }

    .payment-status {
      &.payment--unpaid { color: $error; }
      &.payment--partial { color: $warning-dark; }
      &.payment--paid { color: $success; }
    }

    .text-error {
      color: $error;
    }

    .notes-section {
      margin-top: $spacing-6;
      padding-top: $spacing-4;
      border-top: 1px solid $border-light;

      h3 {
        font-size: $font-size-base;
        font-weight: $font-weight-medium;
        margin-bottom: $spacing-2;
      }

      p {
        color: $text-secondary;
        white-space: pre-wrap;
      }
    }

    .service-card {
      display: flex;
      align-items: center;
      gap: $spacing-4;
    }

    .service-image {
      width: 80px;
      height: 80px;
      border-radius: $radius-default;
      background-size: cover;
      background-position: center;
      background-color: $neutral-200;
      flex-shrink: 0;
    }

    .service-info {
      flex: 1;

      h3 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }

      .service-category {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: $spacing-2;
      }

      .service-meta {
        display: flex;
        gap: $spacing-2;
        font-size: $font-size-sm;
        color: $text-muted;
      }
    }

    .cancellation-info {
      padding: $spacing-4;
      background: $error-light;
      border-radius: $radius-default;

      p {
        margin-bottom: $spacing-2;
        color: $error-dark;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    // Sidebar
    .booking-sidebar {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .contact-card,
    .actions-card,
    .event-card {
      @include card;

      h3 {
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-4;
      }
    }

    .contact-info {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      margin-bottom: $spacing-4;
    }

    .contact-avatar {
      @include avatar(48px);
      @include flex-center;
      background: $bg-gradient-primary;
      color: $text-inverse;
      font-weight: $font-weight-bold;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }
    }

    .contact-details {
      h4 {
        font-weight: $font-weight-medium;
        margin-bottom: $spacing-1;
      }

      p {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }

    .actions-card {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;

      h3 {
        margin-bottom: $spacing-2;
      }
    }

    .event-info {
      margin-bottom: $spacing-4;

      .event-title {
        font-weight: $font-weight-medium;
        margin-bottom: $spacing-2;
      }

      .event-meta {
        display: flex;
        flex-direction: column;
        gap: $spacing-1;
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }

    .form-group {
      margin-bottom: $spacing-4;

      label {
        @include form-label;
      }

      .hint {
        font-size: $font-size-sm;
        color: $text-muted;
        margin-top: $spacing-1;
      }
    }

    .form-input,
    .form-select,
    .form-textarea {
      @include input-base;
      @include input-md;
      width: 100%;
    }

    .form-textarea {
      resize: vertical;
    }

    .review-submitted {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-2;
      padding: $spacing-3;
      background: $success-light;
      color: $success-dark;
      border-radius: $radius-default;
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
    }

    .review-form {
      .review-intro {
        margin-bottom: $spacing-6;
        color: $text-secondary;
      }
    }

    .rating-input-section {
      margin-bottom: $spacing-6;

      label {
        @include form-label;
      }
    }

    .star-rating {
      display: flex;
      gap: $spacing-1;

      &.small {
        gap: 2px;
      }
    }

    .star-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: $neutral-300;
      transition: color $transition-fast, transform $transition-fast;

      &:hover {
        transform: scale(1.1);
      }

      &.filled {
        color: #fbbf24;
      }

      svg {
        display: block;
      }
    }

    .sub-ratings {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      margin-bottom: $spacing-6;
      padding: $spacing-4;
      background: $neutral-50;
      border-radius: $radius-default;
    }

    .sub-rating-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sub-rating-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
  `]
})
export class BookingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(BookingService);
  private reviewService = inject(ReviewService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  booking = signal<Booking | null>(null);
  isLoading = signal(true);
  actionLoading = signal(false);
  showCancelModal = signal(false);
  showPaymentModal = signal(false);
  showReviewModal = signal(false);

  cancelReason = '';
  paymentAmount: number = 0;
  paymentMethod: PaymentMethod | '' = '';
  transactionId = '';

  // Review data
  reviewData = {
    rating: 0,
    reviewText: '',
    ratings: {
      quality: 0,
      punctuality: 0,
      professionalism: 0,
      valueForMoney: 0
    }
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBooking(id);
    }
  }

  loadBooking(id: string): void {
    this.bookingService.getBookingById(id).subscribe({
      next: (response) => {
        this.booking.set(response.data);
        this.paymentAmount = this.getBalance();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  isVendor(): boolean {
    const currentUserId = this.auth.currentUser()?._id;
    const vendor = this.booking()?.vendor as User;
    return vendor?._id === currentUserId || this.booking()?.vendor === currentUserId;
  }

  getBalance(): number {
    const booking = this.booking();
    if (!booking) return 0;
    return booking.priceAgreed - (booking.pricePaid || 0);
  }

  // Service helpers
  getServiceName(service: Service | string | undefined): string {
    if (typeof service === 'object') return service.serviceName;
    return 'Service';
  }

  getServiceImage(): string {
    const service = this.booking()?.service as Service;
    return service?.coverImage || 'assets/images/service-placeholder.jpeg';
  }

  getServiceCategory(): string {
    const service = this.booking()?.service as Service;
    return service?.category || '';
  }

  getServiceRating(): number {
    const service = this.booking()?.service as Service;
    return service?.ratingAverage || 0;
  }

  getServiceBookings(): number {
    const service = this.booking()?.service as Service;
    return service?.completedBookings || 0;
  }

  getServiceSlug(): string {
    const service = this.booking()?.service as Service;
    return service?.slug || '';
  }

  // Event helpers
  getEventTitle(event: Event | string | undefined): string {
    if (typeof event === 'object') return event.title;
    return 'Event';
  }

  getEventDate(): Date | null {
    const event = this.booking()?.event as Event;
    return event?.date || null;
  }

  getEventLocation(): string {
    const event = this.booking()?.event as Event;
    return event?.locationName || event?.city || '';
  }

  getEventId(): string {
    const event = this.booking()?.event as Event;
    return event?._id || '';
  }

  // Contact helpers
  getContactName(): string {
    const user = this.isVendor()
      ? this.booking()?.organizer as User
      : this.booking()?.vendor as User;
    return user?.name || 'User';
  }

  getContactEmail(): string {
    const user = this.isVendor()
      ? this.booking()?.organizer as User
      : this.booking()?.vendor as User;
    return user?.email || '';
  }

  getContactPhoto(): string | null {
    const user = this.isVendor()
      ? this.booking()?.organizer as User
      : this.booking()?.vendor as User;
    return user?.profilePhoto || null;
  }

  formatStatus(status: BookingStatus | undefined): string {
    if (!status) return '';
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

  formatPaymentStatus(status: string | undefined): string {
    if (!status) return '';
    const statuses: Record<string, string> = {
      unpaid: 'Unpaid',
      partial: 'Partially Paid',
      paid: 'Paid',
      refunded: 'Refunded'
    };
    return statuses[status] || status;
  }

  confirmBooking(): void {
    const id = this.booking()?._id;
    if (!id) return;

    this.actionLoading.set(true);
    this.bookingService.confirmBooking(id).subscribe({
      next: (response) => {
        this.booking.set(response.data);
        this.actionLoading.set(false);
        this.toast.success('Booking Confirmed', 'The booking has been confirmed.');
      },
      error: () => {
        this.actionLoading.set(false);
      }
    });
  }

  completeBooking(): void {
    const id = this.booking()?._id;
    if (!id) return;

    this.actionLoading.set(true);
    this.bookingService.completeBooking(id).subscribe({
      next: (response) => {
        this.booking.set(response.data);
        this.actionLoading.set(false);
        this.toast.success('Booking Completed', 'The booking has been marked as complete.');
      },
      error: () => {
        this.actionLoading.set(false);
      }
    });
  }

  cancelBooking(): void {
    const id = this.booking()?._id;
    if (!id) return;

    this.actionLoading.set(true);
    this.bookingService.cancelBooking(id, this.cancelReason || undefined).subscribe({
      next: (response) => {
        this.booking.set(response.data);
        this.actionLoading.set(false);
        this.showCancelModal.set(false);
        this.toast.success('Booking Cancelled', 'The booking has been cancelled.');
      },
      error: () => {
        this.actionLoading.set(false);
      }
    });
  }

  recordPayment(): void {
    const id = this.booking()?._id;
    if (!id || !this.paymentAmount || !this.paymentMethod) {
      this.toast.error('Error', 'Please fill in all required fields.');
      return;
    }

    this.actionLoading.set(true);
    this.bookingService.updatePayment(id, {
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod as PaymentMethod,
      transactionId: this.transactionId || undefined
    }).subscribe({
      next: (response) => {
        this.booking.set(response.data);
        this.actionLoading.set(false);
        this.showPaymentModal.set(false);
        this.paymentAmount = this.getBalance();
        this.paymentMethod = '';
        this.transactionId = '';
        this.toast.success('Payment Recorded', 'The payment has been recorded successfully.');
      },
      error: () => {
        this.actionLoading.set(false);
      }
    });
  }

  // Review methods
  setRating(category: 'rating' | 'quality' | 'punctuality' | 'professionalism' | 'valueForMoney', value: number): void {
    if (category === 'rating') {
      this.reviewData.rating = value;
    } else {
      this.reviewData.ratings[category] = value;
    }
  }

  submitReview(): void {
    const bookingId = this.booking()?._id;
    if (!bookingId) return;

    // Validate
    if (this.reviewData.rating === 0) {
      this.toast.error('Rating Required', 'Please provide an overall rating.');
      return;
    }

    if (!this.reviewData.reviewText.trim()) {
      this.toast.error('Review Required', 'Please write a review.');
      return;
    }

    // Set default sub-ratings if not provided
    const ratings = {
      quality: this.reviewData.ratings.quality || this.reviewData.rating,
      punctuality: this.reviewData.ratings.punctuality || this.reviewData.rating,
      professionalism: this.reviewData.ratings.professionalism || this.reviewData.rating,
      valueForMoney: this.reviewData.ratings.valueForMoney || this.reviewData.rating
    };

    const reviewPayload: ReviewCreateData = {
      booking: bookingId,
      rating: this.reviewData.rating,
      reviewText: this.reviewData.reviewText,
      ratings
    };

    this.actionLoading.set(true);
    this.reviewService.createReview(reviewPayload).subscribe({
      next: () => {
        // Update booking to show review was submitted
        this.booking.update(b => b ? { ...b, rating: this.reviewData.rating } : null);
        this.actionLoading.set(false);
        this.showReviewModal.set(false);
        this.toast.success('Review Submitted', 'Thank you for your feedback!');

        // Reset form
        this.reviewData = {
          rating: 0,
          reviewText: '',
          ratings: {
            quality: 0,
            punctuality: 0,
            professionalism: 0,
            valueForMoney: 0
          }
        };
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toast.error('Error', err.error?.message || 'Failed to submit review. Please try again.');
      }
    });
  }
}
