import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { categoryLabel, bookingStage, paymentStatusLabel } from '../../../../shared/components/listing-cards/listing-format';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { BookingService } from '../../../../core/services/booking.service';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { UploadService } from '../../../../core/services/upload.service';
import { Booking, BookingStatus, DisputeReason, PaymentMethod } from '../../../../core/models/booking.model';
import { ReviewCreateData } from '../../../../core/models/review.model';
import { Event } from '../../../../core/models/event.model';
import { Service } from '../../../../core/models/service.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, ModalComponent, IconComponent, EmptyStateComponent],
  template: `

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
                  <span [class]="'stage stage--' + stage().tone">{{ stage().label }}</span>
                  <h1>{{ getServiceName(booking()?.service) }}</h1>
                  <p class="event-name">for {{ getEventTitle(booking()?.event) }}</p>
                </div>
              </div>

              <!-- What happens next, at the top so it's never missed (on phones the side panel is far below) -->
              @if (nextStep(); as step) {
                <div class="next-step" [class]="'next-step next-step--' + step.tone" role="status">
                  <div>
                    <p class="next-step__title">{{ step.title }}</p>
                    <p class="next-step__text">{{ step.text }}</p>
                  </div>
                  @if (step.action === 'pay' && paymentsEnabled()) {
                    <div class="next-step__actions">
                      <app-button [loading]="isPaying()" (onClick)="payOnline(getBalance())">Pay ₹{{ getBalance() | number }}</app-button>
                      @if (booking()?.pricePaid === 0 && getBalance() >= 1000) {
                        <app-button variant="secondary" [loading]="isPaying()" (onClick)="payOnline(getAdvanceAmount())">Pay 30% advance (₹{{ getAdvanceAmount() | number }})</app-button>
                      }
                    </div>
                  } @else if (step.action === 'quote') {
                    <app-button (onClick)="openConfirmModal()">Accept &amp; send price</app-button>
                  } @else if (step.action === 'complete') {
                    <app-button variant="secondary" [loading]="actionLoading()" (onClick)="completeBooking()">Mark as done</app-button>
                  } @else if (step.action === 'review') {
                    <app-button variant="secondary" (onClick)="showReviewModal.set(true)">Leave a review</app-button>
                  }
                </div>
              }

              <!-- Arrival check and reported problems -->
              @if (showDayOfCard()) {
                <div class="dayof-card">
                  @if (booking()?.dispute?.status ? booking()?.dispute : null; as d) {
                    @if (d.status === 'open') {
                      <h2>Problem reported · payment on hold</h2>
                      <p class="dayof-quote">"{{ d.details }}"</p>
                      @if (isVendor()) {
                        @if (d.vendorRespondedAt) {
                          <p class="action-hint">You replied on {{ d.vendorRespondedAt | date:'d MMM, h:mm a' }}. Festivo is reviewing both sides and will let you both know.</p>
                        } @else {
                          <p class="action-hint">The organizer says you {{ d.reason === 'no_show' ? "didn't arrive" : "didn't deliver what was agreed" }}. Your payout is on hold. Reply by <strong>{{ d.respondBy | date:'d MMM, h:mm a' }}</strong> with your side and photos (for example, the set-up at the venue). If you don't reply, the organizer is refunded.</p>
                          <div class="form-group">
                            <label for="dispute-reply">What happened</label>
                            <textarea id="dispute-reply" class="form-textarea" rows="3" [(ngModel)]="disputeReply" placeholder="For example: I arrived at 4 pm and set up everything agreed. Photos attached."></textarea>
                          </div>
                          <div class="evidence">
                            @for (url of disputeEvidence(); track url) {
                              <img [src]="url" alt="Photo you attached" />
                            }
                            @if (disputeEvidence().length < 6) {
                              <label class="evidence-add">
                                <input type="file" accept="image/*" (change)="addEvidence($event)" [disabled]="uploadingEvidence()" />
                                {{ uploadingEvidence() ? 'Uploading…' : '+ Add photo' }}
                              </label>
                            }
                          </div>
                          <app-button [loading]="actionLoading()" [disabled]="disputeReply.trim().length < 10" (onClick)="sendDisputeReply()">Send reply</app-button>
                        }
                      } @else {
                        <p class="action-hint">
                          @if (d.vendorRespondedAt) {
                            The vendor replied. Festivo is reviewing both sides and will let you know. Your money stays on hold until then.
                          } @else {
                            The vendor has until <strong>{{ d.respondBy | date:'d MMM, h:mm a' }}</strong> to reply. If they don't, you get a full refund of what you paid online, automatically.
                          }
                        </p>
                      }
                      @if (d.vendorResponse && !isVendor()) {
                        <p class="dayof-quote"><strong>Vendor:</strong> "{{ d.vendorResponse }}"</p>
                        @if (d.vendorEvidence?.length) {
                          <div class="evidence">
                            @for (url of d.vendorEvidence; track url) {
                              <a [href]="url" target="_blank" rel="noopener"><img [src]="url" alt="Photo from the vendor" /></a>
                            }
                          </div>
                        }
                      }
                    } @else {
                      <h2>Reported problem settled</h2>
                      <p class="action-hint">
                        @switch (d.resolution) {
                          @case ('refund') { The organizer was refunded{{ d.refunded ? ' ₹' + (d.refunded | number) : '' }}. }
                          @case ('partial') { ₹{{ d.refunded | number }} was refunded to the organizer and the rest paid to the vendor. }
                          @default { The payment was released to the vendor. }
                        }
                        @if (d.noShow) { Recorded as a no-show. }
                        {{ d.resolutionNote }}
                      </p>
                    }
                  } @else if (isVendor()) {
                    <h2>On the day</h2>
                    @if (booking()?.arrivedAt) {
                      <p class="action-hint">Arrival confirmed at {{ booking()?.arrivedAt | date:'d MMM, h:mm a' }}.</p>
                    } @else {
                      <p class="action-hint">When you arrive, ask the organizer for the 4-digit code on their booking page and enter it here. It confirms you came.</p>
                      <div class="arrival-row">
                        <label for="arrival-code" class="sr-only">Arrival code</label>
                        <input id="arrival-code" class="form-input arrival-input" inputmode="numeric" maxlength="4" placeholder="0000" [(ngModel)]="arrivalInput" />
                        <app-button [loading]="actionLoading()" [disabled]="arrivalInput.length !== 4" (onClick)="confirmArrival()">I've arrived</app-button>
                      </div>
                    }
                  } @else {
                    <h2>On the day</h2>
                    @if (booking()?.arrivedAt) {
                      <p class="action-hint">The vendor arrived at {{ booking()?.arrivedAt | date:'d MMM, h:mm a' }}.</p>
                    } @else {
                      <p class="arrival-code" aria-label="Arrival code">{{ booking()?.arrivalCode }}</p>
                      <p class="action-hint">Your arrival code. Give it to the vendor only when they arrive; they enter it to confirm they came. If they don't turn up, use "Report a problem" and your money stays on hold.</p>
                      <app-button variant="ghost" size="sm" [loading]="actionLoading()" (onClick)="markArrived()">They're here, mark as arrived</app-button>
                    }
                  }
                </div>
              }

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
                    <span class="label">Price</span>
                    <span class="value price">₹{{ booking()?.priceAgreed | number }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Paid so far</span>
                    <span class="value">₹{{ booking()?.pricePaid | number }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Payment Status</span>
                    <span class="value payment-status" [class]="'payment--' + booking()?.paymentStatus">
                      {{ formatPaymentStatus(booking()?.paymentStatus) }}
                    </span>
                  </div>
                  @if (booking()?.refundedAmount) {
                    <div class="detail-item">
                      <span class="label">Refunded</span>
                      <span class="value">₹{{ booking()?.refundedAmount | number }}</span>
                    </div>
                  }
                  <div class="detail-item">
                    <span class="label">Still to pay</span>
                    <span class="value" [class.text-error]="getBalance() > 0">
                      ₹{{ getBalance() | number }}
                    </span>
                  </div>
                  @if (isVendor()) {
                    <div class="detail-item">
                      <span class="label">Festivo fee</span>
                      <span class="value">{{ feeLabel() }}</span>
                    </div>
                  }
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

                @if (booking()?.payments?.length) {
                  <div class="notes-section">
                    <h3>Payments</h3>
                    <ul class="payment-history">
                      @for (p of booking()?.payments; track $index) {
                        <li>
                          <span>{{ p.paidAt | date:'mediumDate' }}</span>
                          <span>{{ p.paymentMethod === 'razorpay' ? 'Paid online (protected)' : 'Recorded by vendor: ' + p.paymentMethod }}</span>
                          <strong>₹{{ p.amount | number }}</strong>
                        </li>
                      }
                    </ul>
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
                      @if (getServiceRating() > 0) {
                        <span><app-icon name="star" [size]="14"></app-icon> {{ getServiceRating() | number:'1.1-1' }}</span>
                      }
                      <span>•</span>
                      <span>{{ getServiceBookings() }} completed {{ getServiceBookings() === 1 ? 'booking' : 'bookings' }}</span>
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
                <app-button variant="secondary" fullWidth (onClick)="messageContact()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  Send Message
                </app-button>
              </div>

              <!-- Actions -->
              <div class="actions-card">
                <h3>More options</h3>

                <!-- Status notes, so this card is never empty -->
                @if (booking()?.status === 'cancelled' || booking()?.status === 'refunded') {
                  <p class="action-hint">This booking was cancelled{{ booking()?.refundedAmount ? ' and ₹' + (booking()?.refundedAmount | number) + ' was refunded' : '' }}.</p>
                } @else if (isVendor() && booking()?.status === 'completed') {
                  <p class="action-hint">Completed. Online payments for this booking are paid out to your account.</p>
                  <app-button variant="secondary" fullWidth routerLink="/dashboard/earnings">View earnings</app-button>
                } @else if (isVendor() && getBalance() <= 0 && booking()?.status === 'confirmed') {
                  <p class="action-hint">Paid in full. Festivo releases the money to you after the organizer marks the booking complete.</p>
                } @else if (isVendor() && booking()?.status === 'confirmed') {
                  <p class="action-hint">Confirmed. The organizer can now pay online.</p>
                }

                @if (isVendor()) {
                  <!-- Vendor Actions (accepting is in the banner at the top) -->
                  @if (getBalance() > 0 && (booking()?.status === 'confirmed' || booking()?.status === 'in_progress')) {
                    <app-button variant="secondary" fullWidth (onClick)="showPaymentModal.set(true)">
                      Record a payment you received
                    </app-button>
                  }
                } @else {
                  <!-- Organizer Actions -->
                  <!-- Paying is in the banner at the top -->
                  @if ((booking()?.status === 'confirmed' || booking()?.status === 'in_progress') && nextStep()?.action !== 'complete' && !disputeOpen()) {
                    <app-button variant="secondary" fullWidth [loading]="actionLoading()" (onClick)="completeBooking()">
                      Mark as done
                    </app-button>
                  }
                  @if ((booking()?.status === 'confirmed' || booking()?.status === 'in_progress') && !booking()?.dispute?.status) {
                    <app-button variant="ghost" fullWidth (onClick)="showProblemModal.set(true)">
                      Report a problem
                    </app-button>
                  }
                }

                @if ((booking()?.status === 'pending' || booking()?.status === 'confirmed') && !disputeOpen()) {
                  <app-button
                    variant="ghost"
                    fullWidth
                    (onClick)="showCancelModal.set(true)"
                  >{{ isVendor() && booking()?.status === 'pending' ? 'Decline request' : 'Cancel booking' }}</app-button>
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
                    <span><app-icon name="calendar" [size]="14"></app-icon> {{ getEventDate() | date:'mediumDate' }}</span>
                    <span><app-icon name="map-pin" [size]="14"></app-icon> {{ getEventLocation() }}</span>
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

      <!-- Report a problem -->
      <app-modal
        [isOpen]="showProblemModal()"
        title="Report a problem"
        (onClose)="showProblemModal.set(false)"
        [showFooter]="true"
      >
        <fieldset class="problem-reasons">
          <legend>What went wrong?</legend>
          <label><input type="radio" name="problem" value="no_show" [(ngModel)]="problemReason" [disabled]="!canReportNoShow()" /> The vendor didn't come</label>
          <label><input type="radio" name="problem" value="not_as_agreed" [(ngModel)]="problemReason" /> They came, but didn't do what was agreed</label>
          <label><input type="radio" name="problem" value="other" [(ngModel)]="problemReason" /> Something else</label>
        </fieldset>
        @if (!canReportNoShow()) {
          <p class="policy-note">{{ booking()?.arrivedAt ? 'The vendor confirmed their arrival with your code, so "didn\'t come" isn\'t available.' : 'You can report a no-show from the day of the event.' }}</p>
        }
        <div class="form-group">
          <label for="problem-details">Tell us what happened</label>
          <textarea id="problem-details" class="form-textarea" rows="3" [(ngModel)]="problemDetails" placeholder="For example: The decorator didn't come and isn't answering calls."></textarea>
        </div>
        <p class="policy-note">Your payment stays on hold. The vendor gets 24 hours to reply with their side. If they don't, you're refunded in full automatically. If they do, Festivo looks at both sides and decides.</p>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="showProblemModal.set(false)">Close</app-button>
          <app-button variant="danger" [loading]="actionLoading()" [disabled]="!problemReason || problemDetails.trim().length < 10" (onClick)="reportProblem()">Report problem</app-button>
        </div>
      </app-modal>

      <!-- Cancel Modal -->
      <app-modal
        [isOpen]="showCancelModal()"
        title="Cancel Booking"
        (onClose)="showCancelModal.set(false)"
        [showFooter]="true"
      >
        <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
        @if ((booking()?.pricePaid || 0) > 0) {
          <p class="policy-note">
            @if (isVendor()) {
              Because you are cancelling, the organizer gets a full refund of ₹{{ booking()?.pricePaid | number }}.
            } @else {
              Refund policy: full refund 7+ days before the event, 50% between 2 and 7 days, none within 48 hours.
            }
          </p>
        }
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
        title="Record a payment you received"
        (onClose)="showPaymentModal.set(false)"
        [showFooter]="true"
      >
        <div class="payment-form">
          <p class="hint">Record cash or direct UPI payments you received from the organizer. Online payments are recorded automatically.</p>
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
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
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

      <!-- Confirm / Quote Modal -->
      <app-modal
        [isOpen]="showConfirmModal()"
        title="Accept and send your price"
        (onClose)="showConfirmModal.set(false)"
        [showFooter]="true"
      >
        <div class="payment-form">
          <div class="form-group">
            <label>Your final price (₹)</label>
            <input type="number" class="form-input" [(ngModel)]="quotePrice" min="0">
            <p class="hint">The organizer proposed ₹{{ booking()?.priceAgreed | number }}. On online payments you receive ₹{{ vendorReceives(quotePrice) | number:'1.0-0' }} after Festivo's {{ feeLabel() }}.</p>
          </div>
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="showConfirmModal.set(false)">Cancel</app-button>
          <app-button [loading]="actionLoading()" (onClick)="confirmBooking()">Accept booking</app-button>
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
      <div class="container">
        <div class="not-found-panel">
          @if (loadFailedTemporarily()) {
            <app-empty-state icon="alert-triangle" title="We couldn't load this booking" description="Check your connection and try again. Nothing about your booking has changed.">
              <app-button (onClick)="retryLoad()">Try again</app-button>
            </app-empty-state>
          } @else {
            <app-empty-state icon="calendar" title="We couldn't open this booking" description="It may belong to a different account. Bookings are only visible to the organizer and the vendor.">
              <app-button routerLink="/bookings">Go to my bookings</app-button>
            </app-empty-state>
          }
        </div>
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

      // Phones: summary, then what to do next, then the details
      @include max-md {
        display: flex;
        flex-direction: column;
        gap: $spacing-4;

        .booking-main,
        .booking-sidebar {
          display: contents;
        }

        .booking-header { order: 1; }
        .dayof-card { order: 2; }
        .actions-card { order: 2; }
        .detail-card { order: 3; }
        .contact-card { order: 4; }
        .event-card { order: 5; }
      }
    }

    .not-found-panel {
      @include card;
      margin-top: $spacing-10;
    }

    .booking-header {
      @include card;
      margin-bottom: $spacing-6;
    }

    .next-step {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: $spacing-3 $spacing-4;
      margin-bottom: $spacing-4; padding: $spacing-4 $spacing-5; border-radius: $radius-lg; border: 1px solid $border-light;
      background: $bg-primary;
      &--act { border-color: $primary-200; background: $primary-50; }
      &--wait { border-color: #fde68a; background: $warning-light; }
      &--ok { border-color: #bbf7d0; background: $success-light; }
    }
    .next-step__title { margin: 0; font-weight: $font-weight-semibold; }
    .next-step__text { margin: 2px 0 0; font-size: $font-size-sm; color: $text-secondary; max-width: 46ch; }
    .next-step__actions { display: flex; flex-wrap: wrap; gap: $spacing-2; }

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
      flex-wrap: wrap;
      align-items: center;
      gap: $spacing-4;

      .service-info {
        flex: 1 1 160px;
        min-width: 0;
      }

      h3 {
        font-size: $font-size-base;
      }
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

    .payment-history {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        justify-content: space-between;
        gap: $spacing-2;
        padding: $spacing-2 0;
        border-bottom: 1px solid $border-light;
        font-size: $font-size-sm;
      }
    }

    .action-hint,
    .policy-note {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin: 0;
    }

    .dayof-card {
      @include card;
      margin-bottom: $spacing-6;
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      align-items: flex-start;

      h2 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        margin: 0;
      }
    }

    .arrival-code {
      font-size: 2.25rem;
      font-weight: $font-weight-bold;
      letter-spacing: 0.4em;
      font-variant-numeric: tabular-nums;
      margin: 0;
    }

    .arrival-row {
      display: flex;
      gap: $spacing-2;
      align-items: center;
    }

    .arrival-input {
      width: 7rem;
      font-size: $font-size-lg;
      letter-spacing: 0.3em;
      text-align: center;
    }

    .dayof-quote {
      margin: 0;
      font-size: $font-size-sm;
      overflow-wrap: anywhere;
    }

    .evidence {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;

      img {
        width: 72px;
        height: 72px;
        object-fit: cover;
        border-radius: $radius-default;
      }
    }

    .evidence-add {
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      border: 1px dashed $border-light;
      border-radius: $radius-default;
      font-size: $font-size-xs;
      color: $text-secondary;
      cursor: pointer;

      input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    }

    .problem-reasons {
      border: 0;
      padding: 0;
      margin: 0 0 $spacing-3;
      display: flex;
      flex-direction: column;
      gap: $spacing-2;

      legend { font-weight: $font-weight-semibold; margin-bottom: $spacing-2; }
      label { display: flex; gap: $spacing-2; align-items: center; }
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
      height: auto;
      min-height: 88px;
      padding: $spacing-3;
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
  private payments = inject(PaymentService);
  private uploads = inject(UploadService);

  booking = signal<Booking | null>(null);
  isLoading = signal(true);
  loadFailedTemporarily = signal(false);
  actionLoading = signal(false);
  showCancelModal = signal(false);
  showPaymentModal = signal(false);
  showReviewModal = signal(false);
  showConfirmModal = signal(false);
  showProblemModal = signal(false);
  uploadingEvidence = signal(false);
  disputeEvidence = signal<string[]>([]);
  isPaying = signal(false);
  paymentsEnabled = signal(false);
  feeCap = signal(1000);
  quotePrice = 0;

  cancelReason = '';
  arrivalInput = '';
  problemReason: DisputeReason | '' = '';
  problemDetails = '';
  disputeReply = '';
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
    this.payments.getConfig().subscribe({
      next: (config) => {
        this.paymentsEnabled.set(config.enabled);
        this.feeCap.set(config.bookingFees.cap);
      },
      error: () => this.paymentsEnabled.set(false)
    });
  }

  // Action responses aren't populated, so reload to keep names and images
  private reload(): void {
    const id = this.booking()?._id;
    if (id) this.loadBooking(id);
  }

  getAdvanceAmount(): number {
    return Math.round(this.getBalance() * 0.3);
  }

  async payOnline(amount: number): Promise<void> {
    const booking = this.booking();
    if (!booking) return;

    this.isPaying.set(true);
    try {
      const details = await firstValueFrom(this.payments.createBookingOrder(booking._id, amount));
      const user = this.auth.currentUser();
      const result = await this.payments.checkout(
        details,
        `Booking: ${this.getServiceName(booking.service)}`,
        { name: user?.name, email: user?.email, contact: user?.phone }
      );
      if (result === 'paid') {
        this.toast.success('Payment Successful', `₹${amount} paid. It is held safely until you mark the booking complete.`);
        this.reload();
      }
    } catch (err: any) {
      this.toast.error('Payment Failed', err?.error?.message || err?.message || 'Please try again.');
    } finally {
      this.isPaying.set(false);
    }
  }

  openConfirmModal(): void {
    this.quotePrice = this.booking()?.priceAgreed || 0;
    this.showConfirmModal.set(true);
  }

  loadBooking(id: string): void {
    this.bookingService.getBookingById(id).subscribe({
      next: (response) => {
        this.booking.set(response.data);
        this.paymentAmount = this.getBalance();
        this.isLoading.set(false);
        // From the "How was ...?" notification or email
        const b = response.data;
        if (this.route.snapshot.queryParamMap.get('review') === '1' && b.status === 'completed' && !b.rating && !this.isVendor()) {
          this.showReviewModal.set(true);
        }
      },
      error: (err) => {
        // Only "not found / not yours" should read as a missing booking
        this.loadFailedTemporarily.set(![403, 404].includes(err?.status));
        this.isLoading.set(false);
      }
    });
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.isLoading.set(true);
    this.loadFailedTemporarily.set(false);
    this.loadBooking(id);
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
    return service?.coverImage || 'assets/images/service-placeholder.svg';
  }

  getServiceCategory(): string {
    const service = this.booking()?.service as Service;
    return service?.category ? categoryLabel(service.category) : '';
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
  // Open the conversation with the other party (vendor or organizer)
  messageContact(): void {
    const user = this.isVendor()
      ? this.booking()?.organizer as User
      : this.booking()?.vendor as User;
    const userId = typeof user === 'object' ? user?._id : user;
    this.router.navigate(userId ? ['/messages', userId] : ['/messages']);
  }

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

  formatPaymentStatus(status: string | undefined): string {
    return paymentStatusLabel(status);
  }

  /** One clear sentence about what happens next, and the button for it. */
  nextStep(): { title: string; text: string; tone: string; action?: 'pay' | 'quote' | 'complete' | 'review' } | null {
    const b = this.booking();
    if (!b) return null;
    const other = this.getContactName();
    const vendor = this.isVendor();
    const due = this.getBalance();
    const accepted = b.status === 'confirmed' || b.status === 'in_progress';
    const eventPassed = new Date(b.eventDate).getTime() < Date.now();

    if (b.dispute?.status === 'open') {
      return null;
    }
    if (b.status === 'pending') {
      return vendor
        ? { title: `${other} wants to book you`, text: 'Accept with your final price, or decline. They pay only after you accept.', tone: 'act', action: 'quote' }
        : { title: `Waiting for ${other} to accept`, text: "They'll reply with their final price. You'll get a notification and a message in your chat.", tone: 'wait' };
    }
    if (accepted && due > 0) {
      if (vendor) {
        return { title: b.pricePaid ? 'Advance received' : 'Accepted · waiting for payment', text: b.pricePaid
          ? `₹${b.pricePaid.toLocaleString('en-IN')} paid, ₹${due.toLocaleString('en-IN')} still due. Festivo pays you after the job.`
          : `${other} can now pay online. You'll be notified when they do.`, tone: 'wait' };
      }
      if (!this.paymentsEnabled()) {
        return { title: `${other} accepted at ₹${b.priceAgreed.toLocaleString('en-IN')}`, text: `Online payment isn't switched on yet. Pay ${other} directly and ask them to record it here.`, tone: 'act' };
      }
      return { title: b.pricePaid ? `₹${due.toLocaleString('en-IN')} still due` : `${other} accepted · pay to book the date`, text: 'Festivo holds your money and releases it to the vendor only after you mark the job as done.', tone: 'act', action: 'pay' };
    }
    if (accepted) {
      return vendor
        ? { title: 'Booked and paid', text: 'Festivo releases your money after the organizer marks the job as done (or 3 days after the event).', tone: 'ok' }
        : { title: 'Booked and paid', text: eventPassed ? 'Once the job is done, mark it as done so the vendor gets paid.' : 'All set. After the event, mark the job as done.', tone: 'ok', action: eventPassed ? 'complete' : undefined };
    }
    if (b.status === 'completed' && !vendor && !b.rating) {
      return { title: 'Completed', text: `How was ${other}? A short review helps other people choose.`, tone: 'ok', action: 'review' };
    }
    return null;
  }

  stage() {
    const b = this.booking();
    return b ? bookingStage(b, this.isVendor()) : { label: '', tone: 'off' as const };
  }

  confirmBooking(): void {
    const id = this.booking()?._id;
    if (!id) return;

    this.actionLoading.set(true);
    this.bookingService.accept(id, this.quotePrice).subscribe({
      next: () => {
        this.reload();
        this.actionLoading.set(false);
        this.showConfirmModal.set(false);
        this.toast.success('Booking accepted', 'The organizer can now pay online.');
      },
      error: () => {
        this.actionLoading.set(false);
      }
    });
  }

  feePercent(): number {
    return this.booking()?.feePercent ?? 10;
  }

  // "3% fee (your own customer)", "5% fee (new customer, founding rate)", ...
  feeLabel(): string {
    const b = this.booking();
    const who = b?.source === 'vendor_link' ? 'your own customer' : 'new customer from Festivo';
    return `${this.feePercent()}% fee (${who}${b?.foundingTerms ? ', founding rate' : ''}, max ₹${this.feeCap().toLocaleString('en-IN')})`;
  }

  vendorReceives(price: number): number {
    const fee = Math.min((Number(price) || 0) * this.feePercent() / 100, this.feeCap());
    return (Number(price) || 0) - fee;
  }

  disputeOpen(): boolean {
    return this.booking()?.dispute?.status === 'open';
  }

  // The arrival check matters from the day before the event (set-up) until
  // the job is settled; a reported problem stays visible afterwards
  showDayOfCard(): boolean {
    const b = this.booking();
    if (!b) return false;
    if (b.dispute?.status) return true;
    if (b.status !== 'confirmed' && b.status !== 'in_progress') return false;
    const dayBefore = new Date(b.eventDate).getTime() - 36 * 60 * 60 * 1000;
    return Date.now() >= dayBefore || !!b.arrivedAt;
  }

  canReportNoShow(): boolean {
    const b = this.booking();
    if (!b || b.arrivedAt) return false;
    const eventDay = new Date(b.eventDate);
    eventDay.setHours(0, 0, 0, 0);
    return Date.now() >= eventDay.getTime();
  }

  confirmArrival(): void {
    const id = this.booking()?._id;
    if (!id) return;
    this.actionLoading.set(true);
    this.bookingService.confirmArrival(id, this.arrivalInput.trim()).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.arrivalInput = '';
        this.reload();
        this.toast.success('Arrival confirmed', 'The organizer has been told you are here.');
      },
      error: () => this.actionLoading.set(false)
    });
  }

  markArrived(): void {
    const id = this.booking()?._id;
    if (!id) return;
    this.actionLoading.set(true);
    this.bookingService.markArrived(id).subscribe({
      next: () => { this.actionLoading.set(false); this.reload(); },
      error: () => this.actionLoading.set(false)
    });
  }

  reportProblem(): void {
    const id = this.booking()?._id;
    if (!id || !this.problemReason) return;
    this.actionLoading.set(true);
    this.bookingService.reportProblem(id, this.problemReason, this.problemDetails.trim()).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showProblemModal.set(false);
        this.problemDetails = '';
        this.reload();
        this.toast.success('Problem reported', 'Your payment is on hold. The vendor has 24 hours to reply.');
      },
      error: () => this.actionLoading.set(false)
    });
  }

  async addEvidence(event: globalThis.Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadingEvidence.set(true);
    try {
      const url = await firstValueFrom(this.uploads.uploadImage(file));
      this.disputeEvidence.update(list => [...list, url]);
    } catch {
      // The error interceptor already showed why
    } finally {
      this.uploadingEvidence.set(false);
    }
  }

  sendDisputeReply(): void {
    const id = this.booking()?._id;
    if (!id) return;
    this.actionLoading.set(true);
    this.bookingService.respondToDispute(id, this.disputeReply.trim(), this.disputeEvidence()).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.disputeReply = '';
        this.disputeEvidence.set([]);
        this.reload();
        this.toast.success('Reply sent', 'Festivo will review both sides and let you know.');
      },
      error: () => this.actionLoading.set(false)
    });
  }

  completeBooking(): void {
    const id = this.booking()?._id;
    if (!id) return;

    this.actionLoading.set(true);
    this.bookingService.completeBooking(id).subscribe({
      next: () => {
        this.reload();
        this.actionLoading.set(false);
        this.toast.success('Booking Completed', 'Thanks! The vendor will now be paid out. Please leave a review.');
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
      next: (response: any) => {
        this.reload();
        this.actionLoading.set(false);
        this.showCancelModal.set(false);
        this.toast.success('Booking Cancelled', response.message || 'The booking has been cancelled.');
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toast.error('Could not cancel', err.error?.message || 'Please try again.');
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
    this.bookingService.recordOfflinePayment(id, {
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod as PaymentMethod,
      transactionId: this.transactionId || undefined
    }).subscribe({
      next: () => {
        this.reload();
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
      bookingId,
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
