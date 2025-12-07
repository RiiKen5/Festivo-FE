import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ServiceService } from '../../../../core/services/service.service';
import { ReviewService } from '../../../../core/services/review.service';
import { BookingService } from '../../../../core/services/booking.service';
import { EventService } from '../../../../core/services/event.service';
import { FavoriteService } from '../../../../core/services/favorite.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Service } from '../../../../core/models/service.model';
import { Review } from '../../../../core/models/review.model';
import { User } from '../../../../core/models/user.model';
import { Event as EventModel } from '../../../../core/models/event.model';
import { BookingCreateData } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, ButtonComponent, ModalComponent],
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
              <img [src]="selectedImage() || service()?.coverImage || 'assets/images/service-placeholder.jpeg'" [alt]="service()?.serviceName">
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
                    <app-button variant="secondary" size="sm" (onClick)="messageVendor()">Message</app-button>
                  }
                </div>
              </section>

              <!-- Reviews Section -->
              <section class="content-section reviews-section">
                <h2>Reviews ({{ service()?.totalRatings }})</h2>

                <!-- Rating Summary -->
                <div class="reviews-summary">
                  <div class="rating-overview">
                    <div class="rating-big">
                      <span class="rating-number">{{ service()?.ratingAverage | number:'1.1-1' }}</span>
                      <div class="rating-stars-big">
                        @for (star of [1,2,3,4,5]; track star) {
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            [class.filled]="star <= Math.round(service()?.ratingAverage || 0)"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        }
                      </div>
                      <span class="rating-label">Based on {{ service()?.totalRatings }} reviews</span>
                    </div>

                    @if (reviews().length > 0) {
                      <div class="rating-breakdown">
                        <div class="rating-bar">
                          <span class="rating-bar__label">Quality</span>
                          <div class="rating-bar__track">
                            <div class="rating-bar__fill" [style.width.%]="getAverageRating('quality') * 20"></div>
                          </div>
                          <span class="rating-bar__value">{{ getAverageRating('quality') | number:'1.1-1' }}</span>
                        </div>
                        <div class="rating-bar">
                          <span class="rating-bar__label">Punctuality</span>
                          <div class="rating-bar__track">
                            <div class="rating-bar__fill" [style.width.%]="getAverageRating('punctuality') * 20"></div>
                          </div>
                          <span class="rating-bar__value">{{ getAverageRating('punctuality') | number:'1.1-1' }}</span>
                        </div>
                        <div class="rating-bar">
                          <span class="rating-bar__label">Professionalism</span>
                          <div class="rating-bar__track">
                            <div class="rating-bar__fill" [style.width.%]="getAverageRating('professionalism') * 20"></div>
                          </div>
                          <span class="rating-bar__value">{{ getAverageRating('professionalism') | number:'1.1-1' }}</span>
                        </div>
                        <div class="rating-bar">
                          <span class="rating-bar__label">Value for Money</span>
                          <div class="rating-bar__track">
                            <div class="rating-bar__fill" [style.width.%]="getAverageRating('valueForMoney') * 20"></div>
                          </div>
                          <span class="rating-bar__value">{{ getAverageRating('valueForMoney') | number:'1.1-1' }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Reviews List -->
                @if (isLoadingReviews()) {
                  <div class="reviews-loading">
                    <div class="spinner"></div>
                    <span>Loading reviews...</span>
                  </div>
                } @else if (reviews().length === 0) {
                  <div class="reviews-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <h3>No reviews yet</h3>
                    <p>Be the first to review this service after your booking!</p>
                  </div>
                } @else {
                  <div class="reviews-list">
                    @for (review of reviews(); track review._id) {
                      <div class="review-card">
                        <div class="review-header">
                          <div class="review-author">
                            <div class="review-avatar">
                              @if (getReviewer(review)?.profilePhoto) {
                                <img [src]="getReviewer(review)?.profilePhoto" [alt]="getReviewer(review)?.name">
                              } @else {
                                <span>{{ getReviewer(review)?.name?.charAt(0)?.toUpperCase() }}</span>
                              }
                            </div>
                            <div class="review-author-info">
                              <span class="review-author-name">{{ getReviewer(review)?.name }}</span>
                              <span class="review-date">{{ review.createdAt | date:'mediumDate' }}</span>
                            </div>
                          </div>
                          <div class="review-rating">
                            @for (star of [1,2,3,4,5]; track star) {
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                [class.filled]="star <= review.rating"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            }
                          </div>
                        </div>

                        <p class="review-text">{{ review.reviewText }}</p>

                        <!-- Sub-ratings -->
                        <div class="review-subratings">
                          <span class="subrating">
                            <span class="subrating-label">Quality:</span>
                            <span class="subrating-value">{{ review.ratings.quality }}/5</span>
                          </span>
                          <span class="subrating">
                            <span class="subrating-label">Punctuality:</span>
                            <span class="subrating-value">{{ review.ratings.punctuality }}/5</span>
                          </span>
                          <span class="subrating">
                            <span class="subrating-label">Professionalism:</span>
                            <span class="subrating-value">{{ review.ratings.professionalism }}/5</span>
                          </span>
                          <span class="subrating">
                            <span class="subrating-label">Value:</span>
                            <span class="subrating-value">{{ review.ratings.valueForMoney }}/5</span>
                          </span>
                        </div>

                        <!-- Vendor Response -->
                        @if (review.vendorResponse) {
                          <div class="vendor-response">
                            <div class="vendor-response-header">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                              </svg>
                              <span>Vendor Response</span>
                            </div>
                            <p>{{ review.vendorResponse }}</p>
                          </div>
                        }

                        <!-- Respond Button for Vendor -->
                        @if (isOwnService() && !review.vendorResponse) {
                          <button
                            class="respond-btn"
                            (click)="openResponseModal(review)">
                            Reply to this review
                          </button>
                        }

                        <!-- Helpful & Report -->
                        <div class="review-actions">
                          <button class="review-action" (click)="markHelpful(review)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                            </svg>
                            Helpful ({{ review.helpfulCount }})
                          </button>
                          <button class="review-action" (click)="reportReview(review)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                              <line x1="4" y1="22" x2="4" y2="15"/>
                            </svg>
                            Report
                          </button>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Load More -->
                  @if (hasMoreReviews()) {
                    <div class="reviews-load-more">
                      <app-button
                        variant="secondary"
                        [loading]="isLoadingMoreReviews()"
                        (onClick)="loadMoreReviews()">
                        Load more reviews
                      </app-button>
                    </div>
                  }
                }
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

                @if (isOwnService()) {
                  <div class="own-service-notice">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>This is your service</span>
                  </div>
                  <app-button variant="secondary" fullWidth [routerLink]="['/services/edit', service()?._id]">
                    Edit Service
                  </app-button>
                } @else if (auth.isAuthenticated()) {
                  @if (service()?.availability === 'available') {
                    <app-button fullWidth (onClick)="openBookingModal()">
                      Book Now
                    </app-button>
                    <app-button variant="secondary" fullWidth (onClick)="availabilityModal = true">
                      Check Availability
                    </app-button>
                  } @else {
                    <app-button variant="secondary" fullWidth disabled>
                      Not Available
                    </app-button>
                  }
                  <app-button variant="ghost" fullWidth (onClick)="toggleFavorite()">
                    @if (isFavorite()) {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      Saved
                    } @else {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      Save to Favorites
                    }
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
                  @if (auth.isAuthenticated() && getProvider()?._id !== auth.currentUser()?._id) {
                    <app-button variant="secondary" fullWidth size="sm" (onClick)="messageVendor()">
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
                    <button class="share-btn" (click)="shareOnTwitter()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
        (onClose)="closeBookingModal()"
        [showFooter]="true"
      >
        <div class="booking-form">
          @if (isLoadingEvents()) {
            <div class="form-loading">
              <div class="spinner"></div>
              <span>Loading your events...</span>
            </div>
          } @else if (userEvents().length === 0) {
            <div class="no-events-notice">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h3>No events found</h3>
              <p>You need to create an event before booking services.</p>
              <app-button routerLink="/events/create" (onClick)="closeBookingModal()">
                Create Event
              </app-button>
            </div>
          } @else {
            <div class="form-group">
              <label for="booking-event">Select Event *</label>
              <select
                id="booking-event"
                [(ngModel)]="bookingForm.eventId"
                (ngModelChange)="onEventSelect($event)"
                class="form-select"
              >
                <option value="">Choose an event...</option>
                @for (event of userEvents(); track event._id) {
                  <option [value]="event._id">
                    {{ event.title }} ({{ event.date | date:'mediumDate' }})
                  </option>
                }
              </select>
            </div>

            <div class="form-group">
              <label for="booking-date">Event Date *</label>
              <input
                type="date"
                id="booking-date"
                [(ngModel)]="bookingForm.eventDate"
                class="form-input"
                [min]="minBookingDate"
              />
              <span class="form-hint">When do you need this service?</span>
            </div>

            <div class="form-group">
              <label for="booking-price">Agreed Price (₹) *</label>
              <input
                type="number"
                id="booking-price"
                [(ngModel)]="bookingForm.priceAgreed"
                class="form-input"
                [min]="0"
                placeholder="Enter agreed price"
              />
              <span class="form-hint">Base price: ₹{{ service()?.basePrice | number }} {{ formatPriceUnit(service()?.priceUnit) }}</span>
            </div>

            <div class="form-group">
              <label for="booking-requirements">Requirements</label>
              <textarea
                id="booking-requirements"
                [(ngModel)]="bookingForm.requirements"
                class="form-textarea"
                rows="3"
                placeholder="Describe your specific requirements..."
              ></textarea>
            </div>

            <div class="form-group">
              <label for="booking-notes">Additional Notes</label>
              <textarea
                id="booking-notes"
                [(ngModel)]="bookingForm.notes"
                class="form-textarea"
                rows="2"
                placeholder="Any other information for the vendor..."
              ></textarea>
            </div>

            @if (bookingError()) {
              <div class="form-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ bookingError() }}
              </div>
            }
          }
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="closeBookingModal()">Cancel</app-button>
          <app-button
            [loading]="isSubmittingBooking()"
            [disabled]="!canSubmitBooking()"
            (onClick)="confirmBooking()">
            Confirm Booking
          </app-button>
        </div>
      </app-modal>

      <!-- Vendor Response Modal -->
      <app-modal
        [isOpen]="responseModal"
        title="Reply to Review"
        (onClose)="responseModal = false"
        [showFooter]="true"
      >
        <div class="response-form">
          <p class="response-hint">Your response will be visible publicly below the customer's review.</p>
          <textarea
            class="response-textarea"
            [(ngModel)]="vendorResponse"
            placeholder="Thank you for your feedback..."
            rows="4"
          ></textarea>
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="responseModal = false">Cancel</app-button>
          <app-button [loading]="isSubmittingResponse()" (onClick)="submitVendorResponse()">Submit Response</app-button>
        </div>
      </app-modal>

      <!-- Check Availability Modal -->
      <app-modal
        [isOpen]="availabilityModal"
        title="Check Availability"
        (onClose)="closeAvailabilityModal()"
        [showFooter]="true"
      >
        <div class="availability-form">
          <div class="form-group">
            <label for="avail-date">Select Date</label>
            <input
              type="date"
              id="avail-date"
              [(ngModel)]="availabilityDate"
              class="form-input"
              [min]="minBookingDate"
            />
            <span class="form-hint">Check if the vendor is available on this date</span>
          </div>

          @if (availabilityResult()) {
            <div class="availability-result" [class.available]="availabilityResult()?.available" [class.unavailable]="!availabilityResult()?.available">
              @if (availabilityResult()?.available) {
                <div class="result-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h4>Available!</h4>
                <p>This vendor is available on {{ availabilityDate | date:'longDate' }}.</p>
                <app-button size="sm" (onClick)="bookOnSelectedDate()">Book This Date</app-button>
              } @else {
                <div class="result-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <h4>Not Available</h4>
                <p>{{ availabilityResult()?.reason || 'This vendor is not available on the selected date.' }}</p>
                @if (availabilityResult()?.alternativeDates?.length) {
                  <div class="alternative-dates">
                    <span class="alt-label">Try these dates instead:</span>
                    <div class="alt-date-list">
                      @for (date of availabilityResult()?.alternativeDates; track date) {
                        <button class="alt-date" (click)="selectAlternativeDate(date)">
                          {{ date | date:'mediumDate' }}
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="closeAvailabilityModal()">Close</app-button>
          <app-button
            [loading]="isCheckingAvailability()"
            [disabled]="!availabilityDate"
            (onClick)="checkAvailability()">
            Check Availability
          </app-button>
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

    .reviews-section {
      h2 {
        margin-bottom: $spacing-6;
      }
    }

    .reviews-summary {
      padding: $spacing-6;
      background: $neutral-50;
      border-radius: $radius-lg;
      margin-bottom: $spacing-6;
    }

    .rating-overview {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-8;

      @include md {
        grid-template-columns: auto 1fr;
      }
    }

    .rating-big {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-2;
      text-align: center;
    }

    .rating-number {
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
      color: $text-primary;
    }

    .rating-stars-big {
      display: flex;
      gap: 4px;

      svg {
        fill: $neutral-200;
        stroke: $neutral-300;

        &.filled {
          fill: #fbbf24;
          stroke: #fbbf24;
        }
      }
    }

    .rating-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .rating-breakdown {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      flex: 1;
    }

    .rating-bar {
      display: flex;
      align-items: center;
      gap: $spacing-3;

      &__label {
        width: 120px;
        font-size: $font-size-sm;
        color: $text-secondary;
      }

      &__track {
        flex: 1;
        height: 8px;
        background: $neutral-200;
        border-radius: $radius-full;
        overflow: hidden;
      }

      &__fill {
        height: 100%;
        background: $primary-500;
        border-radius: $radius-full;
        transition: width 0.3s ease;
      }

      &__value {
        width: 30px;
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: $text-primary;
        text-align: right;
      }
    }

    .reviews-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-4;
      padding: $spacing-8;
      color: $text-muted;

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid $border-light;
        border-top-color: $primary-600;
        border-radius: $radius-full;
        animation: spin 0.8s linear infinite;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .reviews-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-8;
      text-align: center;
      color: $text-muted;

      svg {
        margin-bottom: $spacing-4;
        opacity: 0.5;
      }

      h3 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        color: $text-primary;
        margin-bottom: $spacing-2;
      }

      p {
        max-width: 280px;
      }
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .review-card {
      padding: $spacing-5;
      background: $bg-primary;
      border: 1px solid $border-light;
      border-radius: $radius-lg;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: $spacing-4;
    }

    .review-author {
      display: flex;
      align-items: center;
      gap: $spacing-3;
    }

    .review-avatar {
      @include avatar(40px);
      @include flex-center;
      background: $bg-gradient-primary;
      color: $text-inverse;
      font-weight: $font-weight-semibold;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }
    }

    .review-author-info {
      display: flex;
      flex-direction: column;
    }

    .review-author-name {
      font-weight: $font-weight-medium;
      color: $text-primary;
    }

    .review-date {
      font-size: $font-size-sm;
      color: $text-muted;
    }

    .review-rating {
      display: flex;
      gap: 2px;

      svg {
        fill: $neutral-200;
        stroke: $neutral-300;

        &.filled {
          fill: #fbbf24;
          stroke: #fbbf24;
        }
      }
    }

    .review-text {
      color: $text-secondary;
      line-height: $line-height-relaxed;
      margin-bottom: $spacing-4;
    }

    .review-subratings {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-4;
      margin-bottom: $spacing-4;
      padding: $spacing-3;
      background: $neutral-50;
      border-radius: $radius-default;
    }

    .subrating {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      font-size: $font-size-sm;

      &-label {
        color: $text-muted;
      }

      &-value {
        font-weight: $font-weight-medium;
        color: $text-primary;
      }
    }

    .vendor-response {
      margin-top: $spacing-4;
      padding: $spacing-4;
      background: $primary-50;
      border-left: 3px solid $primary-500;
      border-radius: 0 $radius-default $radius-default 0;

      .vendor-response-header {
        display: flex;
        align-items: center;
        gap: $spacing-2;
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: $primary-700;
        margin-bottom: $spacing-2;
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
        line-height: $line-height-relaxed;
        margin: 0;
      }
    }

    .respond-btn {
      margin-top: $spacing-4;
      padding: $spacing-2 $spacing-4;
      background: none;
      border: 1px dashed $primary-300;
      border-radius: $radius-default;
      color: $primary-600;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        background: $primary-50;
        border-style: solid;
      }
    }

    .review-actions {
      display: flex;
      gap: $spacing-4;
      margin-top: $spacing-4;
      padding-top: $spacing-4;
      border-top: 1px solid $border-light;
    }

    .review-action {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-1 $spacing-2;
      background: none;
      border: none;
      color: $text-muted;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: color $transition-fast;

      &:hover {
        color: $text-primary;
      }
    }

    .reviews-load-more {
      display: flex;
      justify-content: center;
      margin-top: $spacing-6;
    }

    .response-form {
      .response-hint {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: $spacing-4;
      }

      .response-textarea {
        width: 100%;
        padding: $spacing-3;
        border: 1px solid $border-default;
        border-radius: $radius-default;
        font-family: inherit;
        font-size: $font-size-base;
        resize: vertical;
        transition: border-color $transition-fast;

        &:focus {
          outline: none;
          border-color: $primary-500;
        }
      }
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
      .form-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-4;
        padding: $spacing-8;
        color: $text-muted;

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid $border-light;
          border-top-color: $primary-600;
          border-radius: $radius-full;
          animation: spin 0.8s linear infinite;
        }
      }

      .no-events-notice {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: $spacing-6;
        text-align: center;
        color: $text-muted;

        svg {
          margin-bottom: $spacing-4;
          opacity: 0.5;
        }

        h3 {
          font-size: $font-size-lg;
          font-weight: $font-weight-semibold;
          color: $text-primary;
          margin-bottom: $spacing-2;
        }

        p {
          max-width: 280px;
          margin-bottom: $spacing-4;
        }
      }

      .form-group {
        margin-bottom: $spacing-4;

        label {
          display: block;
          font-size: $font-size-sm;
          font-weight: $font-weight-medium;
          color: $text-primary;
          margin-bottom: $spacing-2;
        }
      }

      .form-select,
      .form-input,
      .form-textarea {
        width: 100%;
        padding: $spacing-3;
        border: 1px solid $border-default;
        border-radius: $radius-default;
        font-family: inherit;
        font-size: $font-size-base;
        background: $bg-primary;
        transition: border-color $transition-fast;

        &:focus {
          outline: none;
          border-color: $primary-500;
        }

        &::placeholder {
          color: $text-muted;
        }
      }

      .form-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right $spacing-3 center;
        padding-right: $spacing-8;
      }

      .form-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .form-hint {
        display: block;
        font-size: $font-size-sm;
        color: $text-muted;
        margin-top: $spacing-1;
      }

      .form-error {
        display: flex;
        align-items: center;
        gap: $spacing-2;
        padding: $spacing-3;
        background: $error-light;
        color: $error-dark;
        border-radius: $radius-default;
        font-size: $font-size-sm;
        margin-top: $spacing-4;

        svg {
          flex-shrink: 0;
        }
      }
    }

    // Availability Form
    .availability-form {
      .form-group {
        margin-bottom: $spacing-4;

        label {
          display: block;
          font-size: $font-size-sm;
          font-weight: $font-weight-medium;
          color: $text-primary;
          margin-bottom: $spacing-2;
        }
      }

      .form-input {
        width: 100%;
        padding: $spacing-3;
        border: 1px solid $border-default;
        border-radius: $radius-default;
        font-family: inherit;
        font-size: $font-size-base;

        &:focus {
          outline: none;
          border-color: $primary-500;
        }
      }

      .form-hint {
        display: block;
        font-size: $font-size-sm;
        color: $text-muted;
        margin-top: $spacing-1;
      }
    }

    .availability-result {
      margin-top: $spacing-6;
      padding: $spacing-6;
      border-radius: $radius-lg;
      text-align: center;

      &.available {
        background: $success-light;
        color: $success-dark;

        .result-icon svg {
          stroke: $success;
        }

        h4 {
          color: $success-dark;
        }
      }

      &.unavailable {
        background: $error-light;
        color: $error-dark;

        .result-icon svg {
          stroke: $error;
        }

        h4 {
          color: $error-dark;
        }
      }

      .result-icon {
        margin-bottom: $spacing-3;
      }

      h4 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-2;
      }

      p {
        font-size: $font-size-sm;
        margin-bottom: $spacing-4;
      }
    }

    .alternative-dates {
      margin-top: $spacing-4;
      padding-top: $spacing-4;
      border-top: 1px solid rgba(0,0,0,0.1);
    }

    .alt-label {
      display: block;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      margin-bottom: $spacing-2;
    }

    .alt-date-list {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
      justify-content: center;
    }

    .alt-date {
      padding: $spacing-2 $spacing-3;
      background: $bg-primary;
      border: 1px solid $border-default;
      border-radius: $radius-default;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-400;
        background: $primary-50;
      }
    }

    .own-service-notice {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-2;
      padding: $spacing-3 $spacing-4;
      background: $info-light;
      color: $info-dark;
      border-radius: $radius-default;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;

      svg {
        flex-shrink: 0;
      }
    }
  `]
})
export class ServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceService = inject(ServiceService);
  private reviewService = inject(ReviewService);
  private bookingService = inject(BookingService);
  private eventService = inject(EventService);
  private favoriteService = inject(FavoriteService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  // Service
  service = signal<Service | null>(null);
  isLoading = signal(true);
  selectedImage = signal<string | undefined>(undefined);
  isFavorite = signal(false);
  bookingModal = false;
  availabilityModal = false;
  availabilityDate = '';
  isCheckingAvailability = signal(false);
  availabilityResult = signal<{ available: boolean; reason?: string; alternativeDates?: Date[] } | null>(null);

  // Booking Form
  userEvents = signal<EventModel[]>([]);
  isLoadingEvents = signal(false);
  isSubmittingBooking = signal(false);
  bookingError = signal<string>('');
  bookingForm = {
    eventId: '',
    eventDate: '',
    priceAgreed: 0,
    requirements: '',
    notes: ''
  };
  minBookingDate = new Date().toISOString().split('T')[0];

  // Reviews
  reviews = signal<Review[]>([]);
  isLoadingReviews = signal(false);
  isLoadingMoreReviews = signal(false);
  hasMoreReviews = signal(false);
  currentReviewPage = signal(1);

  // Vendor Response Modal
  responseModal = false;
  selectedReviewForResponse: Review | null = null;
  vendorResponse = '';
  isSubmittingResponse = signal(false);

  // Helper for template
  Math = Math;

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
        // Check if favorited
        this.isFavorite.set(this.favoriteService.isFavorite(response.data._id, 'service'));
        // Load reviews after service is loaded
        this.loadReviews();
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

  // Booking Modal Methods
  openBookingModal(): void {
    this.bookingModal = true;
    this.bookingError.set('');
    this.resetBookingForm();
    this.loadUserEvents();
  }

  closeBookingModal(): void {
    this.bookingModal = false;
    this.bookingError.set('');
  }

  resetBookingForm(): void {
    this.bookingForm = {
      eventId: '',
      eventDate: '',
      priceAgreed: this.service()?.basePrice || 0,
      requirements: '',
      notes: ''
    };
  }

  loadUserEvents(): void {
    this.isLoadingEvents.set(true);
    this.eventService.getMyEvents({ status: 'planning' }).subscribe({
      next: (response) => {
        // Filter to only show upcoming events (date >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = response.data.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today;
        });
        this.userEvents.set(upcomingEvents);
        this.isLoadingEvents.set(false);
      },
      error: () => {
        this.userEvents.set([]);
        this.isLoadingEvents.set(false);
      }
    });
  }

  onEventSelect(eventId: string): void {
    const selectedEvent = this.userEvents().find(e => e._id === eventId);
    if (selectedEvent) {
      // Pre-fill the event date from the selected event
      const eventDate = new Date(selectedEvent.date);
      this.bookingForm.eventDate = eventDate.toISOString().split('T')[0];
    }
  }

  canSubmitBooking(): boolean {
    return !!(
      this.bookingForm.eventId &&
      this.bookingForm.eventDate &&
      this.bookingForm.priceAgreed > 0 &&
      !this.isSubmittingBooking()
    );
  }

  confirmBooking(): void {
    if (!this.canSubmitBooking()) {
      this.bookingError.set('Please fill in all required fields.');
      return;
    }

    const serviceId = this.service()?._id;
    if (!serviceId) {
      this.bookingError.set('Service not found.');
      return;
    }

    this.isSubmittingBooking.set(true);
    this.bookingError.set('');

    const bookingData: BookingCreateData = {
      event: this.bookingForm.eventId,
      service: serviceId,
      eventDate: this.bookingForm.eventDate,
      priceAgreed: this.bookingForm.priceAgreed,
      notes: this.bookingForm.notes || undefined,
      requirements: this.bookingForm.requirements || undefined
    };

    this.bookingService.createBooking(bookingData).subscribe({
      next: (response) => {
        this.isSubmittingBooking.set(false);
        this.closeBookingModal();
        this.toast.success('Booking Request Sent!', 'The vendor will review your booking request.');
        // Navigate to bookings page
        this.router.navigate(['/bookings']);
      },
      error: (err) => {
        this.isSubmittingBooking.set(false);
        const errorMessage = err.error?.message || 'Failed to create booking. Please try again.';
        this.bookingError.set(errorMessage);
      }
    });
  }

  shareOnWhatsApp(): void {
    const url = window.location.href;
    const text = `Check out this service: ${this.service()?.serviceName}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  }

  shareOnTwitter(): void {
    const url = window.location.href;
    const text = `Check out this service: ${this.service()?.serviceName}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href);
    this.toast.success('Link Copied!', 'Service link has been copied to clipboard.');
  }

  messageVendor(): void {
    const providerId = this.getProvider()?._id;
    if (providerId) {
      this.router.navigate(['/messages', providerId]);
    }
  }

  toggleFavorite(): void {
    const serviceData = this.service();
    if (!serviceData) return;

    this.favoriteService.toggleFavorite({
      id: serviceData._id,
      type: 'service',
      name: serviceData.serviceName,
      image: serviceData.coverImage
    }).subscribe(result => {
      this.isFavorite.set(result.isFavorite);
      if (result.isFavorite) {
        this.toast.success('Saved!', 'Service added to your favorites');
      } else {
        this.toast.info('Removed', 'Service removed from favorites');
      }
    });
  }

  // Availability Check Methods
  closeAvailabilityModal(): void {
    this.availabilityModal = false;
    this.availabilityDate = '';
    this.availabilityResult.set(null);
  }

  checkAvailability(): void {
    const serviceId = this.service()?._id;
    if (!serviceId || !this.availabilityDate) return;

    this.isCheckingAvailability.set(true);
    this.availabilityResult.set(null);

    this.serviceService.checkAvailability(serviceId, this.availabilityDate).subscribe({
      next: (response) => {
        this.availabilityResult.set(response.data);
        this.isCheckingAvailability.set(false);
      },
      error: (err) => {
        this.isCheckingAvailability.set(false);
        // Show error message instead of assuming availability
        if (err.status === 404) {
          // Endpoint doesn't exist - show informative message
          this.toast.info('Availability Check', 'Contact the vendor directly to confirm availability for this date.');
          this.availabilityResult.set({
            available: true,
            reason: 'Please contact the vendor to confirm availability.'
          });
        } else {
          // Other error - show error toast
          this.toast.error('Error', 'Could not check availability. Please try again.');
        }
      }
    });
  }

  selectAlternativeDate(date: Date): void {
    this.availabilityDate = new Date(date).toISOString().split('T')[0];
    this.availabilityResult.set(null);
    this.checkAvailability();
  }

  bookOnSelectedDate(): void {
    this.closeAvailabilityModal();
    this.bookingForm.eventDate = this.availabilityDate;
    this.openBookingModal();
  }

  /**
   * Check if the current user is the service provider
   */
  isOwnService(): boolean {
    if (!this.auth.isAuthenticated()) return false;
    const currentUserId = this.auth.currentUser()?._id;
    const provider = this.service()?.provider;
    if (typeof provider === 'object') {
      return (provider as User)._id === currentUserId;
    }
    return provider === currentUserId;
  }

  // Reviews Methods
  loadReviews(): void {
    const serviceId = this.service()?._id;
    if (!serviceId) return;

    this.isLoadingReviews.set(true);
    this.currentReviewPage.set(1);

    this.reviewService.getServiceReviews(serviceId, 1, 5).subscribe({
      next: (response) => {
        this.reviews.set(response.data);
        this.hasMoreReviews.set(response.pagination ? response.pagination.current < response.pagination.total : false);
        this.isLoadingReviews.set(false);
      },
      error: () => {
        this.isLoadingReviews.set(false);
      }
    });
  }

  loadMoreReviews(): void {
    const serviceId = this.service()?._id;
    if (!serviceId) return;

    const nextPage = this.currentReviewPage() + 1;
    this.isLoadingMoreReviews.set(true);

    this.reviewService.getServiceReviews(serviceId, nextPage, 5).subscribe({
      next: (response) => {
        this.reviews.update(current => [...current, ...response.data]);
        this.currentReviewPage.set(nextPage);
        this.hasMoreReviews.set(response.pagination ? response.pagination.current < response.pagination.total : false);
        this.isLoadingMoreReviews.set(false);
      },
      error: () => {
        this.isLoadingMoreReviews.set(false);
      }
    });
  }

  getReviewer(review: Review): User | null {
    if (typeof review.reviewer === 'object') {
      return review.reviewer as User;
    }
    return null;
  }

  getAverageRating(category: 'quality' | 'punctuality' | 'professionalism' | 'valueForMoney'): number {
    const allReviews = this.reviews();
    if (allReviews.length === 0) return 0;

    const sum = allReviews.reduce((acc, r) => acc + (r.ratings[category] || 0), 0);
    return sum / allReviews.length;
  }

  openResponseModal(review: Review): void {
    this.selectedReviewForResponse = review;
    this.vendorResponse = '';
    this.responseModal = true;
  }

  submitVendorResponse(): void {
    if (!this.selectedReviewForResponse || !this.vendorResponse.trim()) return;

    this.isSubmittingResponse.set(true);

    this.reviewService.respondToReview(this.selectedReviewForResponse._id, this.vendorResponse).subscribe({
      next: (response) => {
        this.reviews.update(reviews =>
          reviews.map(r =>
            r._id === this.selectedReviewForResponse?._id
              ? { ...r, vendorResponse: this.vendorResponse }
              : r
          )
        );
        this.toast.success('Response Submitted', 'Your response has been added to the review.');
        this.responseModal = false;
        this.isSubmittingResponse.set(false);
      },
      error: () => {
        this.toast.error('Error', 'Failed to submit response. Please try again.');
        this.isSubmittingResponse.set(false);
      }
    });
  }

  markHelpful(review: Review): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.info('Login Required', 'Please login to mark reviews as helpful.');
      return;
    }

    this.reviewService.markHelpful(review._id).subscribe({
      next: () => {
        this.reviews.update(reviews =>
          reviews.map(r =>
            r._id === review._id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
          )
        );
        this.toast.success('Marked Helpful', 'Thank you for your feedback!');
      },
      error: () => {
        this.toast.error('Error', 'Could not mark as helpful. You may have already voted.');
      }
    });
  }

  reportReview(review: Review): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.info('Login Required', 'Please login to report reviews.');
      return;
    }

    const reason = prompt('Please provide a reason for reporting this review:');
    if (!reason) return;

    this.reviewService.reportReview(review._id, reason).subscribe({
      next: () => {
        this.toast.success('Review Reported', 'Thank you. Our team will review this.');
      },
      error: () => {
        this.toast.error('Error', 'Could not report review. Please try again.');
      }
    });
  }
}
