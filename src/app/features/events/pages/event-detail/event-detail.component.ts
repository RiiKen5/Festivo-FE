import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { IconComponent, EVENT_TYPE_ICONS } from '../../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { formatShortDate, formatTime, plural, bookingStage } from '../../../../shared/components/listing-cards/listing-format';
import { Observable, firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { EventService } from '../../../../core/services/event.service';
import { RsvpService } from '../../../../core/services/rsvp.service';
import { BookingService } from '../../../../core/services/booking.service';
import { TaskService } from '../../../../core/services/task.service';
import { FavoriteService } from '../../../../core/services/favorite.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PaymentService, CheckoutDetails } from '../../../../core/services/payment.service';
import { AttributionService } from '../../../../core/services/attribution.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { EventPlannerComponent } from '../../components/event-planner.component';
import { InvitationCardComponent } from '../../components/invitation-card.component';
import { Event } from '../../../../core/models/event.model';
import { User } from '../../../../core/models/user.model';
import { Rsvp, RsvpStatus, GuestRsvp } from '../../../../core/models/rsvp.model';
import { Task, TaskStatus, TaskCategory, TaskPriority } from '../../../../core/models/task.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [EventPlannerComponent, InvitationCardComponent, CommonModule, RouterModule, FormsModule, ButtonComponent, ModalComponent, IconComponent, EmptyStateComponent],
  template: `

    @if (isLoading()) {
      <div class="loading-state">
        <div class="skeleton skeleton--image" style="height: 400px"></div>
        <div class="container">
          <div class="skeleton skeleton--title mt-6"></div>
          <div class="skeleton skeleton--text mt-4"></div>
          <div class="skeleton skeleton--text mt-2" style="width: 80%"></div>
        </div>
      </div>
    } @else if (event()) {
      <main class="event-detail" [class.has-mobile-cta]="showMobileCta()">
        <!-- Cover + header -->
        <div class="container event-top">
          <div class="event-cover">
            <img [src]="event()?.coverPhoto || 'assets/images/event-placeholder.svg'" [alt]="event()?.coverPhoto ? event()?.title : ''">
          </div>
          <header class="event-head">
            <div class="event-badges">
              <span class="pill pill--brand">
                <app-icon [name]="eventTypeIcon()" [size]="14"></app-icon>
                {{ eventTypeLabel() }}
              </span>
              @if (!event()?.isPublic) {
                <span class="pill"><app-icon name="shield" [size]="14"></app-icon>Private · invite only</span>
              }
              @if (event()?.status === 'cancelled') {
                <span class="pill pill--danger">Cancelled</span>
              }
            </div>
            <h1 class="event-title">{{ event()?.title }}</h1>
            <ul class="event-meta">
              <li><app-icon name="calendar" [size]="18"></app-icon>{{ formatDate(event()?.date) }}</li>
              <li><app-icon name="clock" [size]="18"></app-icon>{{ displayTime() }}</li>
              <li><app-icon name="map-pin" [size]="18"></app-icon>{{ event()?.locationName || event()?.city }}</li>
              <li>
                <app-icon name="ticket" [size]="18"></app-icon>
                @if (isTicketed()) { ₹{{ event()?.entryFee | number }} per person } @else { Free entry }
              </li>
            </ul>
          </header>
        </div>

        <!-- Main Content -->
        <div class="event-content">
          <div class="container">
            <div class="event-layout">
              <!-- Main Info -->
              <div class="event-main">
                @if (isOrganizer() && event()?._id) {
                  <app-event-planner #planner [eventId]="event()!._id" [city]="event()!.city" [isNew]="justCreated"
                                     (edit)="openEditTaskModal($any($event))" (invite)="openCard()"></app-event-planner>
                  <app-invitation-card [isOpen]="showCard()" [event]="event()" [hostName]="getOrganizer()?.name || ''"
                                       [link]="cardLink()" (closed)="showCard.set(false)"></app-invitation-card>
                }
                <section class="event-section">
                  <h2 class="section-title">About this event</h2>
                  <p class="event-description">{{ event()?.description }}</p>
                </section>

                @if (event()?.tags?.length) {
                  <section class="event-section">
                    <h2 class="section-title">Tags</h2>
                    <div class="event-tags">
                      @for (tag of event()?.tags; track tag) {
                        <span class="tag">{{ tag }}</span>
                      }
                    </div>
                  </section>
                }

                <section class="event-section">
                  <h2 class="section-title">Location</h2>
                  <div class="location-card">
                    <div class="location-info">
                      <h3>{{ event()?.locationName }}</h3>
                      <p>{{ event()?.address }}</p>
                      <p>{{ event()?.city }}</p>
                    </div>
                    <a
                      [href]="mapsUrl()"
                      target="_blank"
                      rel="noopener"
                      class="location-link"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Open in Maps
                    </a>
                  </div>
                </section>

                <!-- Organizer Info -->
                <section class="event-section">
                  <h2 class="section-title">Organizer</h2>
                  <div class="organizer-card">
                    <div class="organizer-avatar">
                      @if (getOrganizer()?.profilePhoto) {
                        <img [src]="getOrganizer()?.profilePhoto" [alt]="getOrganizer()?.name">
                      } @else {
                        <span>{{ getOrganizer()?.name?.charAt(0)?.toUpperCase() }}</span>
                      }
                    </div>
                    <div class="organizer-info">
                      <h3>{{ getOrganizer()?.name }}</h3>
                      <p>{{ organizerStat() }}</p>
                      @if (getOrganizer()?.totalRatings) {
                        <div class="organizer-rating">
                          <app-icon name="star" [size]="14"></app-icon>
                          {{ getOrganizer()?.ratingAverage | number:'1.1-1' }}
                        </div>
                      }
                    </div>
                    @if (auth.isAuthenticated() && getOrganizer()?._id !== auth.currentUser()?._id) {
                      <app-button variant="secondary" size="sm" (onClick)="messageOrganizer()">Message</app-button>
                    }
                  </div>
                </section>

                <!-- Organizer only -->
                @if (isOrganizer()) {

                  <!-- Manage Event (Organizer Only) -->
                  <section class="event-section manage-section" id="manage-event">
                    <div class="section-header">
                      <h2 class="section-title">Manage Event</h2>
                      <span class="manage-status" [class]="'manage-status--' + event()?.status">{{ statusLabel() }}</span>
                    </div>

                    <p class="manage-hint">
                      @if (!event()?.isPublished) {
                        This event is not published yet.
                        {{ event()?.isPublic ? 'Publish it to list it on Explore Events.' : 'It is private: only people with your invite link can see it.' }}
                      } @else if (event()?.isPublic) {
                        Published and listed on Explore Events.
                      } @else {
                        Published privately: only people with your invite link can see it.
                      }
                    </p>

                    <div class="manage-actions">
                      @if (isEventOpen()) {
                        @if (!event()?.isPublished) {
                          <app-button size="sm" [loading]="isManaging()" (onClick)="publishEvent()">Publish</app-button>
                        } @else {
                          <app-button size="sm" variant="secondary" [loading]="isManaging()" (onClick)="unpublishEvent()">Unpublish</app-button>
                        }
                        @if (hasEventStarted()) {
                          <app-button size="sm" variant="secondary" [loading]="isManaging()" (onClick)="completeEvent()">Mark as completed</app-button>
                        }
                        <app-button size="sm" variant="ghost" (onClick)="showCancelEventModal = true">Cancel event</app-button>
                      }
                    </div>

                    <h3 class="manage-subtitle">
                      Guests · {{ goingGuests().length }} confirmed ({{ headcount() }} people) · {{ checkedInCount() }} checked in
                    </h3>

                    @if (goingGuests().length > 0 && isEventOpen()) {
                      <div class="checkin-by-code">
                        <input class="form-input" placeholder="Check-in code" [(ngModel)]="checkInCode" (keyup.enter)="checkInWithCode()">
                        <app-button size="sm" [disabled]="!checkInCode.trim()" (onClick)="checkInWithCode()">Check in</app-button>
                      </div>
                    }

                    @if (guests().length === 0) {
                      <p class="manage-empty">No RSVPs yet. Share your invite link to get people coming.</p>
                    } @else {
                      <ul class="guest-list">
                        @for (rsvp of guests(); track rsvp._id) {
                          <li class="guest">
                            <div class="guest-info">
                              <span class="guest-name">{{ attendeeName(rsvp) }}@if (!rsvp.attendee) { <span class="guest-tag">no account</span> }</span>
                              @if (rsvp.guestPhone) { <a class="guest-phone" [href]="'tel:+91' + rsvp.guestPhone">{{ rsvp.guestPhone }}</a> }
                              <span class="guest-meta">
                                {{ rsvpStatusLabel(rsvp.status) }}
                                @if (rsvp.guestsCount) { · +{{ rsvp.guestsCount }} guest(s) }
                                @if (rsvp.paymentStatus === 'paid') { · paid ₹{{ rsvp.amountPaid }} }
                              </span>
                            </div>
                            @if (rsvp.checkedIn) {
                              <span class="guest-checked"><app-icon name="check" [size]="14"></app-icon> Checked in {{ rsvp.checkedInAt | date:'shortTime' }}</span>
                            } @else if (rsvp.status === 'going' && isEventOpen()) {
                              <app-button size="sm" variant="secondary" (onClick)="checkInGuest(rsvp)">Check in</app-button>
                            }
                          </li>
                        }
                      </ul>
                    }

                    <h3 class="manage-subtitle">Vendors booked</h3>
                    @if (eventBookings().length === 0) {
                      <p class="manage-empty">No vendors booked yet. <a routerLink="/services">Find services</a> for this event.</p>
                    } @else {
                      <ul class="guest-list">
                        @for (booking of eventBookings(); track booking._id) {
                          <li class="guest">
                            <div class="guest-info">
                              <a class="guest-name" [routerLink]="['/bookings', booking._id]">{{ booking.service?.serviceName }}</a>
                              <span class="guest-meta">{{ booking.vendor?.name }} · ₹{{ booking.priceAgreed | number }} · {{ vendorStage(booking) }}</span>
                            </div>
                          </li>
                        }
                      </ul>
                    }
                  </section>
                }
              </div>

              <!-- Sidebar -->
              <aside class="event-sidebar" id="event-actions">
                <div class="sidebar-card">
                  <div class="sidebar-stats">
                    <div class="stat">
                      <span class="stat-value">{{ event()?.currentAttendees }}</span>
                      <span class="stat-label">Attending</span>
                    </div>
                    <div class="stat">
                      <span class="stat-value">{{ event()?.maxAttendees || '∞' }}</span>
                      <span class="stat-label">Capacity</span>
                    </div>
                    <div class="stat">
                      <span class="stat-value">{{ event()?.views }}</span>
                      <span class="stat-label">Views</span>
                    </div>
                  </div>

                  @if (event()?.isPaid) {
                    <div class="sidebar-price">
                      <span class="price-label">Entry Fee</span>
                      <span class="price-value">₹{{ event()?.entryFee }}</span>
                    </div>
                  }

                  <div class="sidebar-actions">
                    @if (auth.isAuthenticated()) {
                      @if (isOrganizer()) {
                        <app-button [routerLink]="['/events', event()?.slug, 'edit']" fullWidth>
                          Edit Event
                        </app-button>
                        <app-button variant="secondary" fullWidth (onClick)="scrollToManage()">
                          Manage Event
                        </app-button>
                      } @else if (isLoadingRsvp()) {
                        <app-button fullWidth [loading]="true" [disabled]="true">
                          Loading...
                        </app-button>
                      } @else if (userRsvp()?.status === 'pending_payment') {
                        <!-- Ticket reserved but not paid -->
                        <div class="rsvp-status-card">
                          <div class="rsvp-status-header">
                            <span>Your ticket is reserved — complete payment to confirm it.</span>
                          </div>
                        </div>
                        <app-button fullWidth [loading]="isSubmittingRsvp()" (onClick)="completeTicketPayment()">
                          Pay ₹{{ ticketTotal(userRsvp()?.guestsCount || 0) }}
                        </app-button>
                        <app-button variant="ghost" fullWidth (onClick)="cancelRsvp()" [loading]="isCancellingRsvp()">
                          Cancel
                        </app-button>
                      } @else if (userRsvp()) {
                        <!-- User has already RSVP'd -->
                        <div class="rsvp-status-card">
                          <div class="rsvp-status-header">
                            <span class="rsvp-check"><app-icon name="check" [size]="14"></app-icon></span>
                            <span>{{ isTicketed() ? 'You have a ticket!' : userRsvp()?.status === 'going' ? "You're Going!" : userRsvp()?.status === 'maybe' ? "You're Maybe Going" : "You're not going" }}</span>
                          </div>
                          @if (userRsvp()?.status === 'going' && userRsvp()?.checkInCode) {
                            <div class="rsvp-code">
                              <span class="code-label">Check-in Code:</span>
                              <span class="code-value">{{ userRsvp()?.checkInCode }}</span>
                            </div>
                          }
                          @if (userRsvp()?.guestsCount && userRsvp()!.guestsCount > 0) {
                            <div class="rsvp-guests">
                              +{{ userRsvp()?.guestsCount }} guest(s)
                            </div>
                          }
                        </div>
                        @if (!isTicketed()) {
                          <app-button variant="secondary" fullWidth (onClick)="rsvpModal = true">
                            Change RSVP
                          </app-button>
                        } @else {
                          <p class="form-hint">Cancel 48+ hours before the event for a full refund.</p>
                        }
                        <app-button variant="ghost" fullWidth (onClick)="cancelRsvp()" [loading]="isCancellingRsvp()">
                          {{ isTicketed() ? 'Cancel Ticket' : 'Cancel RSVP' }}
                        </app-button>
                      } @else {
                        <!-- User hasn't RSVP'd yet -->
                        <app-button fullWidth (onClick)="rsvpModal = true">
                          @if (isTicketed()) {
                            Buy Ticket - ₹{{ event()?.entryFee }}
                          } @else {
                            RSVP Now - Free
                          }
                        </app-button>
                        <app-button variant="secondary" fullWidth (onClick)="toggleFavorite()">
                          @if (isFavorite()) {
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            Saved
                          } @else {
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            Save Event
                          }
                        </app-button>
                      }
                    } @else if (isTicketed()) {
                      <app-button [routerLink]="['/auth/login']" [queryParams]="{returnUrl: returnUrl()}" fullWidth>
                        Log in to buy a ticket
                      </app-button>
                    } @else if (guestRsvp()) {
                      <!-- RSVP saved without an account -->
                      <div class="rsvp-status-card">
                        <div class="rsvp-status-header">
                          <span class="rsvp-check"><app-icon name="check" [size]="14"></app-icon></span>
                          <span>{{ guestRsvp()!.status === 'going' ? "You're going, " + guestRsvp()!.guestName : guestRsvp()!.status === 'maybe' ? 'Maybe, ' + guestRsvp()!.guestName : "You can't go" }}</span>
                        </div>
                        @if (guestRsvp()!.status === 'going' && guestRsvp()!.checkInCode) {
                          <div class="rsvp-code">
                            <span class="code-label">Check-in Code:</span>
                            <span class="code-value">{{ guestRsvp()!.checkInCode }}</span>
                          </div>
                        }
                        @if (guestRsvp()!.guestsCount > 0) {
                          <div class="rsvp-guests">+{{ guestRsvp()!.guestsCount }} guest(s)</div>
                        }
                      </div>
                      <app-button variant="secondary" fullWidth (onClick)="openRsvp()">Change my response</app-button>
                      <p class="form-hint">Save your check-in code. You can change your answer from this browser.</p>
                    } @else {
                      <app-button fullWidth (onClick)="openRsvp()">RSVP, no sign-up needed</app-button>
                      <p class="form-hint">Already have an account? <a class="inline-link" [routerLink]="['/auth/login']" [queryParams]="{returnUrl: returnUrl()}">Log in</a></p>
                    }
                  </div>

                  @if (isOrganizer() && event()?.inviteCode) {
                    <div class="invite-box">
                      <span class="share-label">{{ event()?.isPublic ? 'Invite link' : 'Private invite link' }}</span>
                      <p class="form-hint">
                        @if (event()?.isPublic) {
                          Anyone with this link can join.
                        } @else {
                          Only people with this link can see and join this event.
                        }
                      </p>
                      <div class="share-buttons">
                        <app-button size="sm" variant="secondary" (onClick)="copyInviteLink()">Copy link</app-button>
                        <app-button size="sm" variant="secondary" (onClick)="shareInviteOnWhatsApp()">WhatsApp</app-button>
                        <app-button size="sm" variant="ghost" (onClick)="regenerateInvite()">Reset</app-button>
                      </div>
                      <app-button size="sm" fullWidth (onClick)="openCard()">Make an invitation card</app-button>
                    </div>
                  }

                  <div class="sidebar-share">
                    <span class="share-label">Share event</span>
                    <div class="share-buttons">
                      <button type="button" class="share-btn" aria-label="Share on X" (click)="shareOnTwitter()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                      </button>
                      <button type="button" class="share-btn" aria-label="Share on WhatsApp" (click)="shareOnWhatsApp()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                      <button type="button" class="share-btn" aria-label="Copy link" (click)="copyLink()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                @if (!isOrganizer()) {
                  <div class="host-cta">
                    <p class="host-cta-title">Planning your own event?</p>
                    <p class="host-cta-text">Invite guests, sell tickets, and book cake, decor and photos, with your payment held until the job is done.</p>
                    <a class="host-cta-link" routerLink="/events/create" [queryParams]="{ from: 'event' }" (click)="onHostCta()">Start planning, free</a>
                  </div>
                }
              </aside>
            </div>
          </div>
        </div>
      </main>

      @if (showMobileCta()) {
        <div class="mobile-cta">
          <div class="mobile-cta__price">
            @if (rsvpState() === 'going' || rsvpState() === 'maybe') {
              <strong>{{ rsvpState() === 'going' ? "You're going" : 'Maybe' }}</strong>
              {{ formatShortDay() }}
            } @else {
              <strong>{{ isTicketed() ? '₹' + (event()?.entryFee | number) : 'Free' }}</strong>
              {{ formatShortDay() }}
            }
          </div>
          @if (!auth.isAuthenticated() && isTicketed()) {
            <app-button [routerLink]="['/auth/login']" [queryParams]="{ returnUrl: returnUrl() }">Log in to buy</app-button>
          } @else if (!auth.isAuthenticated()) {
            <app-button [variant]="guestRsvp() ? 'secondary' : 'primary'" (onClick)="openRsvp()">{{ guestRsvp() ? 'Change RSVP' : 'RSVP' }}</app-button>
          } @else if (userRsvp()?.status === 'pending_payment') {
            <app-button [loading]="isSubmittingRsvp()" (onClick)="completeTicketPayment()">Pay to confirm</app-button>
          } @else if (userRsvp()) {
            <app-button variant="secondary" (onClick)="scrollToActions()">{{ isTicketed() ? 'View ticket' : 'View RSVP' }}</app-button>
          } @else {
            <app-button (onClick)="rsvpModal = true">{{ isTicketed() ? 'Buy ticket' : 'RSVP' }}</app-button>
          }
        </div>
      }

      <!-- Cancel Event Modal -->
      <app-modal
        [isOpen]="showCancelEventModal"
        title="Cancel Event"
        (onClose)="showCancelEventModal = false"
        [showFooter]="true"
      >
        <p>Everyone who RSVP'd will be notified. Paid tickets are refunded in full, and vendor bookings are cancelled under the booking refund policy.</p>
        <div class="form-group">
          <label class="form-label">Reason (shared with guests and vendors)</label>
          <textarea class="form-textarea" rows="3" [(ngModel)]="cancelReason" placeholder="e.g. Venue unavailable"></textarea>
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="showCancelEventModal = false">Keep event</app-button>
          <app-button variant="danger" [loading]="isManaging()" (onClick)="cancelEvent()">Cancel event</app-button>
        </div>
      </app-modal>

      <!-- RSVP Modal -->
      <app-modal
        [isOpen]="rsvpModal"
        [title]="userRsvp() || guestRsvp() ? 'Update Your RSVP' : 'RSVP to Event'"
        (onClose)="rsvpModal = false"
        [showFooter]="true"
      >
        <div class="rsvp-form">
          <div class="rsvp-event-info">
            <h4>{{ event()?.title }}</h4>
            <p>{{ formatDate(event()?.date) }} at {{ event()?.time }}</p>
          </div>

          @if (!auth.isAuthenticated()) {
            <div class="form-group">
              <label class="form-label" for="guest-name">Your name</label>
              <input id="guest-name" class="form-input" type="text" [(ngModel)]="guestName" maxlength="80" autocomplete="name" placeholder="So the host knows who's coming">
            </div>
            <div class="form-group">
              <label class="form-label" for="guest-phone">Mobile number <span class="form-hint">(optional, to change your answer from another phone)</span></label>
              <input id="guest-phone" class="form-input" type="tel" inputmode="numeric" [(ngModel)]="guestPhone" maxlength="14" autocomplete="tel" placeholder="98765 43210">
            </div>
          }

          @if (!isTicketed()) {
          <div class="form-group">
            <label class="form-label">Your Response</label>
            <div class="rsvp-options">
              <button
                type="button"
                class="rsvp-option"
                [class.active]="selectedRsvpStatus === 'going'"
                (click)="selectedRsvpStatus = 'going'"
              >
                <span class="option-icon"><app-icon name="check" [size]="16"></app-icon></span>
                <span class="option-label">Going</span>
              </button>
              <button
                type="button"
                class="rsvp-option"
                [class.active]="selectedRsvpStatus === 'maybe'"
                (click)="selectedRsvpStatus = 'maybe'"
              >
                <span class="option-icon">?</span>
                <span class="option-label">Maybe</span>
              </button>
              <button
                type="button"
                class="rsvp-option"
                [class.active]="selectedRsvpStatus === 'not_going'"
                (click)="selectedRsvpStatus = 'not_going'"
              >
                <span class="option-icon"><app-icon name="x" [size]="16"></app-icon></span>
                <span class="option-label">Can't go</span>
              </button>
            </div>
          </div>
          }

          <div class="form-group">
            <label class="form-label">Additional Guests (optional)</label>
            <div class="guests-input">
              <button type="button" class="guests-btn" (click)="decrementGuests()" [disabled]="guestsCount <= 0">-</button>
              <span class="guests-count">{{ guestsCount }}</span>
              <button type="button" class="guests-btn" (click)="incrementGuests()" [disabled]="guestsCount >= 10">+</button>
            </div>
            <p class="form-hint">You + {{ guestsCount }} guest(s) = {{ guestsCount + 1 }} total</p>
          </div>

          @if (!auth.isAuthenticated()) {
            <p class="privacy-note"><app-icon name="shield" [size]="14"></app-icon> Only the host sees your name and number. Festivo never shares them with vendors or anyone else.</p>
          }

          @if (isTicketed()) {
            <div class="rsvp-total">
              <span>Total Amount:</span>
              <span class="total-value">₹{{ ticketTotal(guestsCount) }}</span>
            </div>
          }
        </div>

        <div modal-footer>
          <app-button variant="ghost" (onClick)="closeRsvpModal()">Cancel</app-button>
          <app-button
            (onClick)="confirmRsvp()"
            [loading]="isSubmittingRsvp()"
            [disabled]="(!selectedRsvpStatus && !isTicketed()) || (!auth.isAuthenticated() && guestName.trim().length < 2)"
          >
            {{ isTicketed() ? 'Continue to Payment' : userRsvp() || guestRsvp() ? 'Update RSVP' : 'Confirm RSVP' }}
          </app-button>
        </div>
      </app-modal>

      <!-- Checklist item (add / edit) -->
      <app-modal
        [isOpen]="taskModal"
        [title]="editingTask ? 'Edit checklist item' : 'Add to your checklist'"
        (onClose)="closeTaskModal()"
        [showFooter]="true"
      >
        <div class="task-form">
          <div class="form-group">
            <label class="form-label" for="item-name">What needs to be done?</label>
            <input id="item-name" type="text" class="form-input" [(ngModel)]="taskFormData.taskName" placeholder="e.g. Book the venue, order balloons">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="item-due">Get it done by <span class="form-hint">(optional)</span></label>
              <input id="item-due" type="date" class="form-input" [(ngModel)]="taskFormData.dueDate">
            </div>
            <div class="form-group">
              <label class="form-label" for="item-priority">How important?</label>
              <select id="item-priority" class="form-select" [(ngModel)]="taskFormData.priority">
                <option value="low">Can wait</option>
                <option value="medium">Normal</option>
                <option value="high">Important</option>
                <option value="urgent">Very urgent</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="item-type">What is it about? <span class="form-hint">(optional)</span></label>
            <select id="item-type" class="form-select" [(ngModel)]="taskFormData.category">
              <option value="venue">Venue</option>
              <option value="catering">Food &amp; catering</option>
              <option value="decoration">Decoration</option>
              <option value="entertainment">Music &amp; entertainment</option>
              <option value="photography">Photos &amp; video</option>
              <option value="guest_management">Guests &amp; invitations</option>
              <option value="logistics">Travel &amp; setup</option>
              <option value="budget">Money &amp; budget</option>
              <option value="other">Something else</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="item-notes">Notes <span class="form-hint">(optional)</span></label>
            <textarea id="item-notes" class="form-textarea" [(ngModel)]="taskFormData.description" placeholder="Anything to remember, like a phone number or budget" rows="3"></textarea>
          </div>
        </div>

        <div modal-footer>
          <app-button variant="ghost" (onClick)="closeTaskModal()">Cancel</app-button>
          <app-button (onClick)="saveTask()" [loading]="isSavingTask()" [disabled]="!taskFormData.taskName.trim()">
            {{ editingTask ? 'Save' : 'Add to checklist' }}
          </app-button>
        </div>
      </app-modal>
    } @else {
      <div class="container">
        <div class="not-found-panel">
          <app-empty-state icon="calendar" title="This event isn't available" description="It may have been removed, or it's a private event. If someone invited you, open the exact invite link they shared.">
            <app-button routerLink="/events">Browse public events</app-button>
          </app-empty-state>
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
    }

    .error-state {
      @include flex-column-center;
      text-align: center;
      padding: $spacing-12;

      .error-icon {
        font-size: 4rem;
        margin-bottom: $spacing-4;
      }

      h2 {
        margin-bottom: $spacing-2;
      }

      p {
        color: $text-secondary;
        margin-bottom: $spacing-6;
      }
    }

    .event-top {
      padding-top: $spacing-6;
    }

    .event-cover {
      overflow: hidden;
      border-radius: $radius-xl;
      border: 1px solid $border-light;
      background: $neutral-100;
      aspect-ratio: 16 / 9;

      @include md {
        aspect-ratio: 21 / 8;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .event-head {
      padding: $spacing-6 0 $spacing-2;
    }

    .event-badges {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
      margin-bottom: $spacing-3;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: $radius-full;
      background: $neutral-100;
      color: $text-secondary;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;

      &--brand {
        background: $primary-50;
        color: $primary-800;
      }

      &--danger {
        background: $error-light;
        color: $error-dark;
      }
    }

    .event-title {
      font-size: 1.75rem;
      font-weight: $font-weight-bold;
      letter-spacing: -0.02em;
      line-height: 1.2;

      @include md {
        font-size: 2.25rem;
      }
    }

    .event-meta {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2 $spacing-6;
      margin-top: $spacing-4;

      li {
        display: inline-flex;
        align-items: center;
        gap: $spacing-2;
        font-size: $font-size-sm;
        color: $text-secondary;
      }

      app-icon {
        color: $primary-600;
      }
    }

    .not-found-panel {
      @include card;
      margin-top: $spacing-10;
    }

    // Primary action pinned to the bottom on phones
    .mobile-cta {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: $z-sticky;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $spacing-4;
      padding: $spacing-3 $spacing-4 calc(#{$spacing-3} + env(safe-area-inset-bottom));
      border-top: 1px solid $border-light;
      background: $bg-primary;
      box-shadow: 0 -4px 16px rgba(24, 24, 27, 0.06);

      @include lg {
        display: none;
      }
    }

    .mobile-cta__price {
      display: flex;
      flex-direction: column;
      font-size: $font-size-xs;
      color: $text-tertiary;

      strong {
        font-size: $font-size-base;
        color: $text-primary;
      }
    }

    .has-mobile-cta {
      @include max-md {
        padding-bottom: 88px;
      }
    }

    .event-content {
      padding: $spacing-8 0;
      background: $bg-secondary;
    }

    .event-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-8;

      @include lg {
        grid-template-columns: 1fr 380px;
      }
    }

    .event-section {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
      margin-bottom: $spacing-6;
    }

    .section-title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-4;
      padding-bottom: $spacing-3;
      border-bottom: 1px solid $border-light;
    }

    .event-description {
      color: $text-secondary;
      line-height: $line-height-relaxed;
      white-space: pre-wrap;
    }

    .event-tags {
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

    .location-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: $spacing-4;
    }

    .location-info {
      h3 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
      }
    }

    .location-link {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      color: $primary-600;
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
      white-space: nowrap;

      &:hover {
        color: $primary-700;
      }
    }

    .organizer-card {
      display: flex;
      align-items: center;
      gap: $spacing-4;
    }

    .organizer-avatar {
      @include avatar(56px);
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

    .organizer-info {
      flex: 1;

      h3 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
      }
    }

    .organizer-rating {
      font-size: $font-size-sm;
      margin-top: $spacing-1;
    }

    .sidebar-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
      position: sticky;
      top: calc($navbar-height + $spacing-4);
    }

    .sidebar-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-4;
      margin-bottom: $spacing-6;
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: $primary-600;
    }

    .stat-label {
      font-size: $font-size-xs;
      color: $text-secondary;
      text-transform: uppercase;
      letter-spacing: $letter-spacing-wide;
    }

    .sidebar-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-4;
      background: $primary-50;
      border-radius: $radius-default;
      margin-bottom: $spacing-6;
    }

    .price-label {
      color: $text-secondary;
    }

    .price-value {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $primary-600;
    }

    .sidebar-actions {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      margin-bottom: $spacing-6;
    }

    .host-cta {
      margin-top: $spacing-4;
      padding: $spacing-4;
      border: 1px solid $border-light;
      border-radius: $radius-lg;
      background: $bg-secondary;
    }

    .host-cta-title {
      font-weight: 600;
      margin: 0 0 $spacing-1;
    }

    .host-cta-text {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin: 0 0 $spacing-3;
    }

    .host-cta-link {
      font-weight: 600;
      color: $primary-600;
    }

    .sidebar-share {
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
        border-color: $primary-300;
        color: $primary-600;
      }
    }

    .manage-hint,
    .manage-empty {
      color: $text-secondary;
      font-size: $font-size-sm;
    }

    .manage-status {
      font-size: $font-size-xs;
      padding: 2px $spacing-2;
      border-radius: $radius-full;
      background: $neutral-100;
      text-transform: capitalize;

      &--active { background: $success-light; color: $success-dark; }
      &--cancelled { background: $error-light; color: $error-dark; }
    }

    .manage-actions {
      display: flex;
      gap: $spacing-2;
      flex-wrap: wrap;
      margin: $spacing-3 0 $spacing-6;
    }

    .manage-subtitle {
      font-size: $font-size-base;
      margin: $spacing-6 0 $spacing-3;
    }

    .checkin-by-code app-button {
      white-space: nowrap;
    }

    .checkin-by-code {
      display: flex;
      gap: $spacing-2;
      max-width: 360px;
      margin-bottom: $spacing-3;
    }

    .guest-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .guest {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-3 0;
      border-bottom: 1px solid $border-light;
    }

    .guest-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .guest-name {
      font-weight: $font-weight-medium;
    }

    .guest-tag {
      margin-left: $spacing-2;
      padding: 0 $spacing-2;
      border-radius: $radius-full;
      background: $neutral-100;
      color: $text-secondary;
      font-size: $font-size-xs;
      font-weight: $font-weight-regular;
    }

    .guest-phone {
      font-size: $font-size-xs;
    }

    .guest-meta {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .guest-checked {
      font-size: $font-size-sm;
      color: $success-dark;
      white-space: nowrap;
    }

    .invite-box {
      padding: $spacing-4 0;
      border-top: 1px solid $border-light;

      .share-buttons {
        display: flex;
        gap: $spacing-2;
        flex-wrap: wrap;
      }
    }

    // RSVP Status Card
    .inline-link {
      text-decoration: underline;
    }

    .privacy-note {
      display: flex;
      gap: $spacing-2;
      align-items: flex-start;
      margin: 0 0 $spacing-3;
      font-size: $font-size-xs;
      color: $text-secondary;
      app-icon { color: $primary-600; flex-shrink: 0; margin-top: 1px; }
    }

    .rsvp-status-card {
      background: $success-light;
      border-radius: $radius-default;
      padding: $spacing-4;
      margin-bottom: $spacing-3;
    }

    .rsvp-status-header {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-weight: $font-weight-semibold;
      color: $success-dark;
    }

    .rsvp-check {
      @include flex-center;
      width: 24px;
      height: 24px;
      background: $success;
      color: white;
      border-radius: $radius-full;
      font-size: $font-size-sm;
    }

    .rsvp-code {
      margin-top: $spacing-3;
      padding-top: $spacing-3;
      border-top: 1px solid rgba(0,0,0,0.1);
      font-size: $font-size-sm;
    }

    .code-label {
      color: $text-secondary;
    }

    .code-value {
      font-weight: $font-weight-bold;
      font-family: monospace;
      margin-left: $spacing-2;
    }

    .rsvp-guests {
      margin-top: $spacing-2;
      font-size: $font-size-sm;
      color: $success-dark;
    }

    // RSVP Modal Form
    .rsvp-form {
      padding: $spacing-2 0;
    }

    .rsvp-event-info {
      text-align: center;
      padding-bottom: $spacing-4;
      margin-bottom: $spacing-4;
      border-bottom: 1px solid $border-light;

      h4 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
      }
    }

    .form-group {
      margin-bottom: $spacing-5;
    }

    .form-label {
      display: block;
      font-weight: $font-weight-medium;
      margin-bottom: $spacing-2;
    }

    .form-hint {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-top: $spacing-2;
    }

    .rsvp-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-3;
    }

    .rsvp-option {
      @include flex-column-center;
      padding: $spacing-4;
      border: 2px solid $border-light;
      border-radius: $radius-lg;
      background: $bg-primary;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-300;
      }

      &.active {
        border-color: $primary-600;
        background: $primary-50;
      }
    }

    .option-icon {
      font-size: $font-size-xl;
      margin-bottom: $spacing-2;
    }

    .option-label {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }

    .guests-input {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-4;
    }

    .guests-btn {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-full;
      border: 1px solid $border-default;
      background: $bg-primary;
      font-size: $font-size-xl;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover:not(:disabled) {
        background: $primary-50;
        border-color: $primary-300;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .guests-count {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      min-width: 40px;
      text-align: center;
    }

    .rsvp-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-4;
      background: $primary-50;
      border-radius: $radius-default;
      margin-top: $spacing-4;
    }

    .total-value {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $primary-600;
    }

    // Checklist item form
    .task-form {
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $spacing-4;

        @include max-sm {
          grid-template-columns: 1fr;
        }
      }
    }

  `]
})
export class EventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  @ViewChild('planner') private planner?: EventPlannerComponent;
  justCreated = false;
  private router = inject(Router);
  private eventService = inject(EventService);
  private rsvpService = inject(RsvpService);
  private bookingService = inject(BookingService);
  private taskService = inject(TaskService);
  private favoriteService = inject(FavoriteService);
  private toast = inject(ToastService);
  private payments = inject(PaymentService);
  private attribution = inject(AttributionService);
  private analytics = inject(AnalyticsService);
  auth = inject(AuthService);

  // From a private invite link (?invite=...)
  private inviteCode: string | null = null;

  event = signal<Event | null>(null);
  userRsvp = signal<Rsvp | null>(null);
  // RSVP made without an account, remembered in this browser
  guestRsvp = signal<GuestRsvp | null>(null);
  guestName = '';
  guestPhone = '';
  isLoading = signal(true);
  isLoadingRsvp = signal(false);
  isFavorite = signal(false);
  isSubmittingRsvp = signal(false);
  isCancellingRsvp = signal(false);

  // Tasks
  tasks = signal<Task[]>([]);
  isLoadingTasks = signal(false);
  isSavingTask = signal(false);
  taskModal = false;
  editingTask: Task | null = null;
  taskFormData: {
    taskName: string;
    description: string;
    category: TaskCategory | '';
    priority: TaskPriority;
    dueDate: string;
  } = {
    taskName: '',
    description: '',
    category: 'other',
    priority: 'medium',
    dueDate: ''
  };

  rsvpModal = false;

  // Organizer management
  guests = signal<Rsvp[]>([]);
  eventBookings = signal<any[]>([]);
  isManaging = signal(false);
  showCancelEventModal = false;
  cancelReason = '';
  checkInCode = '';
  selectedRsvpStatus: RsvpStatus | null = null;
  guestsCount = 0;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.inviteCode = this.route.snapshot.queryParamMap.get('invite');
    this.justCreated = this.route.snapshot.queryParamMap.get('new') === '1';
    if (slug) {
      this.loadEvent(slug);
    }
  }

  loadEvent(slugOrId: string): void {
    // Links from bookings and notifications use the event id
    const request = /^[a-f0-9]{24}$/i.test(slugOrId)
      ? this.eventService.getEventById(slugOrId, this.inviteCode)
      : this.eventService.getEventBySlug(slugOrId, this.inviteCode);

    request.subscribe({
      next: (response) => {
        this.event.set(response.data);
        this.isLoading.set(false);

        // Check if favorited
        this.isFavorite.set(this.favoriteService.isFavorite(response.data._id, 'event'));

        if (!this.auth.isAuthenticated() && response.data._id) {
          this.loadGuestRsvp(response.data._id);
        }

        // Load user's RSVP status if authenticated
        if (this.auth.isAuthenticated() && response.data._id) {
          this.loadUserRsvp(response.data._id);

          // Load tasks if organizer
          const organizer = response.data.organizer;
          const organizerId = typeof organizer === 'object' ? (organizer as User)._id : organizer;
          if (organizerId === this.auth.currentUser()?._id) {
            this.loadManageData(response.data._id);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadUserRsvp(eventId: string): void {
    this.isLoadingRsvp.set(true);
    this.rsvpService.getMyRsvp(eventId).subscribe({
      next: (response) => {
        // A cancelled RSVP means the user can RSVP again
        const rsvp = response.data && response.data.status !== 'cancelled' ? response.data : null;
        this.userRsvp.set(rsvp);
        // Pre-fill form if user already has RSVP
        if (rsvp) {
          this.selectedRsvpStatus = rsvp.status;
          this.guestsCount = rsvp.guestsCount || 0;
        }
        this.isLoadingRsvp.set(false);
      },
      error: () => {
        this.isLoadingRsvp.set(false);
      }
    });
  }

  getOrganizer(): User | null {
    const organizer = this.event()?.organizer;
    if (typeof organizer === 'object') {
      return organizer as User;
    }
    return null;
  }

  isOrganizer(): boolean {
    const organizer = this.getOrganizer();
    return organizer?._id === this.auth.currentUser()?._id;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ---- Organizer management ----

  loadManageData(eventId: string): void {
    this.rsvpService.getEventRsvps(eventId).subscribe({
      next: (response) => this.guests.set(response.data.filter(r => r.status !== 'cancelled'))
    });
    this.bookingService.getEventBookings(eventId).subscribe({
      next: (response) => this.eventBookings.set(response.data)
    });
  }

  scrollToManage(): void {
    document.getElementById('manage-event')?.scrollIntoView({ behavior: 'smooth' });
  }

  goingGuests(): Rsvp[] {
    return this.guests().filter(r => r.status === 'going');
  }

  headcount(): number {
    return this.goingGuests().reduce((sum, r) => sum + 1 + (r.guestsCount || 0), 0);
  }

  checkedInCount(): number {
    return this.guests().filter(r => r.checkedIn).length;
  }

  isEventOpen(): boolean {
    return !['cancelled', 'completed'].includes(this.event()?.status || '');
  }

  hasEventStarted(): boolean {
    const date = this.event()?.date;
    return !!date && new Date(date).setHours(0, 0, 0, 0) <= Date.now();
  }

  statusLabel(): string {
    const labels: Record<string, string> = {
      draft: 'Draft', planning: 'Planning', active: 'Published', completed: 'Completed', cancelled: 'Cancelled'
    };
    return labels[this.event()?.status || ''] || '';
  }

  rsvpStatusLabel(status: RsvpStatus): string {
    const labels: Record<RsvpStatus, string> = {
      going: 'Going', maybe: 'Maybe', not_going: "Can't go", cancelled: 'Cancelled', pending_payment: 'Awaiting payment'
    };
    return labels[status];
  }

  attendeeName(rsvp: Rsvp): string {
    if (rsvp.attendee && typeof rsvp.attendee === 'object') return rsvp.attendee.name;
    return rsvp.guestName || 'Guest';
  }

  private runEventAction(request: Observable<any>, success: string): void {
    const event = this.event();
    if (!event) return;
    this.isManaging.set(true);
    request.subscribe({
      next: (response) => {
        this.isManaging.set(false);
        this.toast.success(success, response?.message);
        this.loadEvent(event._id);
      },
      error: () => this.isManaging.set(false)
    });
  }

  publishEvent(): void {
    this.runEventAction(this.eventService.publishEvent(this.event()!._id), 'Event published');
  }

  unpublishEvent(): void {
    this.runEventAction(this.eventService.unpublishEvent(this.event()!._id), 'Event unpublished');
  }

  completeEvent(): void {
    if (!confirm('Mark this event as completed? Ticket revenue will become due for payout.')) return;
    this.runEventAction(this.eventService.completeEvent(this.event()!._id), 'Event completed');
  }

  cancelEvent(): void {
    this.showCancelEventModal = false;
    this.runEventAction(this.eventService.cancelEvent(this.event()!._id, this.cancelReason || undefined), 'Event cancelled');
  }

  checkInGuest(rsvp: Rsvp): void {
    this.rsvpService.checkIn(rsvp._id).subscribe({
      next: () => {
        this.toast.success('Checked in', `${this.attendeeName(rsvp)} is checked in.`);
        this.loadManageData(this.event()!._id);
      }
    });
  }

  checkInWithCode(): void {
    const code = this.checkInCode.trim();
    if (!code) return;
    this.rsvpService.checkInByCode(this.event()!._id, code).subscribe({
      next: (response: any) => {
        this.checkInCode = '';
        this.toast.success('Checked in', `${response.data?.attendee?.name || 'Guest'} is checked in.`);
        this.loadManageData(this.event()!._id);
      }
    });
  }

  eventTypeIcon(): string {
    return EVENT_TYPE_ICONS[this.event()?.eventType || ''] || 'party';
  }

  displayTime(): string {
    return formatTime(this.event()?.time);
  }

  formatShortDay(): string {
    return formatShortDate(this.event()?.date) + ' · ' + this.displayTime();
  }

  mapsUrl(): string {
    const e = this.event();
    const query = [e?.locationName, e?.address, e?.city].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  }

  organizerStat(): string {
    const count = this.getOrganizer()?.eventsOrganized || 0;
    return count ? plural(count, 'event') + ' organized' : 'Organizer on Festivo';
  }

  // Phones get the main action pinned to the bottom of the screen
  showMobileCta(): boolean {
    return !!this.event() && !this.isOrganizer() && this.isEventOpen();
  }

  scrollToActions(): void {
    document.getElementById('event-actions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  eventTypeLabel(): string {
    const type = this.event()?.eventType || '';
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  isTicketed(): boolean {
    return (this.event()?.entryFee || 0) > 0;
  }

  ticketTotal(guests: number): number {
    return (this.event()?.entryFee || 0) * (guests + 1);
  }

  returnUrl(): string {
    const base = `/events/${this.event()?.slug}`;
    return this.inviteCode ? `${base}?invite=${this.inviteCode}` : base;
  }

  // Paid events: reserve the ticket, then pay through Razorpay
  private async buyTicket(): Promise<void> {
    const event = this.event()!;
    this.isSubmittingRsvp.set(true);
    try {
      const response: any = await firstValueFrom(this.rsvpService.createRsvp({
        eventId: event._id,
        status: 'going',
        guestsCount: this.guestsCount,
        inviteCode: this.inviteCode || undefined
      }));
      this.userRsvp.set(response.data.rsvp);
      this.rsvpModal = false;
      await this.payForTicket(response.data.checkout);
    } catch (error: any) {
      this.toast.error('Could not reserve ticket', error?.error?.message || error?.message || 'Please try again.');
    } finally {
      this.isSubmittingRsvp.set(false);
    }
  }

  async completeTicketPayment(): Promise<void> {
    const rsvp = this.userRsvp();
    if (!rsvp) return;
    this.isSubmittingRsvp.set(true);
    try {
      const checkout = await firstValueFrom(this.payments.createTicketOrder(rsvp._id));
      await this.payForTicket(checkout);
    } catch (error: any) {
      this.toast.error('Payment Failed', error?.error?.message || error?.message || 'Please try again.');
    } finally {
      this.isSubmittingRsvp.set(false);
    }
  }

  private async payForTicket(checkout: CheckoutDetails): Promise<void> {
    const user = this.auth.currentUser();
    const result = await this.payments.checkout(checkout, `Ticket: ${this.event()?.title}`, {
      name: user?.name, email: user?.email, contact: user?.phone
    });
    if (result === 'paid') {
      this.analytics.track('ticket_purchased', { eventId: this.event()?._id, amount: checkout.amount });
      this.toast.success('Ticket Confirmed!', 'See you there. Your check-in code is on this page.');
      this.loadEvent(this.event()!._id);
    } else {
      this.toast.info('Payment not completed', 'Your ticket is reserved. Complete payment to confirm it.');
    }
  }

  // Invite and share links carry UTM tags so signups from guests can be counted
  private inviteUrl(medium = 'copy'): string {
    const event = this.event();
    return this.attribution.tagged(`/events/${event?.slug}?invite=${event?.inviteCode}`, 'invite', medium);
  }

  private shareUrl(medium: string): string {
    return this.attribution.tagged(`/events/${this.event()?.slug}`, 'event_share', medium);
  }

  showCard = signal(false);

  vendorStage(booking: any): string {
    return bookingStage(booking, false).label;
  }

  openCard(): void {
    this.showCard.set(true);
  }

  // QR on the card: the private invite link, or the public page
  cardLink(): string {
    const e = this.event();
    if (!e) return '';
    return e.inviteCode && !e.isPublic ? this.inviteUrl('card') : this.shareUrl('card');
  }

  onHostCta(): void {
    this.analytics.track('host_cta_clicked', { eventId: this.event()?._id });
  }

  copyInviteLink(): void {
    this.analytics.track('invite_shared', { eventId: this.event()?._id, channel: 'copy', private: true });
    navigator.clipboard.writeText(this.inviteUrl()).then(
      () => this.toast.success('Copied', 'Invite link copied to clipboard.'),
      () => this.toast.error('Copy failed', this.inviteUrl())
    );
  }

  shareInviteOnWhatsApp(): void {
    this.analytics.track('invite_shared', { eventId: this.event()?._id, channel: 'whatsapp', private: true });
    const text = `You're invited to ${this.event()?.title}! ${this.inviteUrl('whatsapp')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  regenerateInvite(): void {
    const event = this.event();
    if (!event || !confirm('Reset the invite link? The old link will stop working.')) return;
    this.eventService.regenerateInvite(event._id).subscribe({
      next: (response) => {
        this.event.set({ ...event, inviteCode: response.data.inviteCode });
        this.toast.success('Invite link reset', 'Share the new link with your guests.');
      },
      error: () => this.toast.error('Error', 'Could not reset the invite link.')
    });
  }

  confirmRsvp(): void {
    if (!this.event()) return;
    if (this.isTicketed()) {
      this.buyTicket();
      return;
    }
    if (!this.selectedRsvpStatus) return;

    if (!this.auth.isAuthenticated()) {
      this.submitGuestRsvp();
      return;
    }

    this.isSubmittingRsvp.set(true);

    const existingRsvp = this.userRsvp();

    if (existingRsvp) {
      // Update existing RSVP
      this.rsvpService.updateRsvp(existingRsvp._id, {
        status: this.selectedRsvpStatus,
        guestsCount: this.guestsCount
      }).subscribe({
        next: (response) => {
          this.userRsvp.set(response.data);
          this.toast.success('RSVP Updated!', 'Your response has been updated.');
          this.rsvpModal = false;
          this.isSubmittingRsvp.set(false);
        },
        error: (error) => {
          const message = error.error?.message || 'Failed to update RSVP. Please try again.';
          this.toast.error('Update Failed', message);
          this.isSubmittingRsvp.set(false);
        }
      });
    } else {
      // Create new RSVP
      this.rsvpService.createRsvp({
        eventId: this.event()!._id,
        status: this.selectedRsvpStatus,
        guestsCount: this.guestsCount,
        inviteCode: this.inviteCode || undefined
      }).subscribe({
        next: (response) => {
          this.userRsvp.set(response.data);
          // Update attendee count locally
          const currentEvent = this.event();
          if (currentEvent && this.selectedRsvpStatus === 'going') {
            this.event.set({
              ...currentEvent,
              currentAttendees: currentEvent.currentAttendees + 1 + this.guestsCount
            });
          }
          this.toast.success('RSVP Confirmed!', 'You have successfully registered for this event.');
          this.rsvpModal = false;
          this.isSubmittingRsvp.set(false);
        },
        error: (error) => {
          const message = error.error?.message || 'Failed to RSVP. Please try again.';
          this.toast.error('RSVP Failed', message);
          this.isSubmittingRsvp.set(false);
        }
      });
    }
  }

  cancelRsvp(): void {
    const rsvp = this.userRsvp();
    if (!rsvp) return;

    this.isCancellingRsvp.set(true);

    this.rsvpService.cancelRsvp(rsvp._id).subscribe({
      next: (response: any) => {
        // Update attendee count locally
        const currentEvent = this.event();
        if (currentEvent && rsvp.status === 'going') {
          const reduction = 1 + (rsvp.guestsCount || 0);
          this.event.set({
            ...currentEvent,
            currentAttendees: Math.max(0, currentEvent.currentAttendees - reduction)
          });
        }
        this.userRsvp.set(null);
        this.selectedRsvpStatus = null;
        this.guestsCount = 0;
        this.toast.success('Cancelled', response?.message || 'Your registration has been cancelled.');
        this.isCancellingRsvp.set(false);
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to cancel RSVP. Please try again.';
        this.toast.error('Cancel Failed', message);
        this.isCancellingRsvp.set(false);
      }
    });
  }

  // Going / maybe / ... for whoever is viewing: signed-in or guest
  rsvpState(): string | null {
    return this.userRsvp()?.status || this.guestRsvp()?.status || null;
  }

  openRsvp(): void {
    const g = this.guestRsvp();
    if (g) {
      this.selectedRsvpStatus = g.status === 'cancelled' ? 'going' : g.status;
      this.guestsCount = g.guestsCount || 0;
      this.guestName = this.guestName || g.guestName;
    } else if (!this.selectedRsvpStatus) {
      this.selectedRsvpStatus = 'going';
    }
    this.rsvpModal = true;
  }

  private guestTokenKey(eventId: string): string {
    return `festivo_guest_rsvp_${eventId}`;
  }

  private loadGuestRsvp(eventId: string): void {
    let token: string | null = null;
    try { token = localStorage.getItem(this.guestTokenKey(eventId)); } catch { /* storage blocked */ }
    if (!token) return;
    this.rsvpService.getGuestRsvp(token).subscribe({
      next: res => this.guestRsvp.set(res.data),
      error: () => { try { localStorage.removeItem(this.guestTokenKey(eventId)); } catch { /* ignore */ } }
    });
  }

  private submitGuestRsvp(): void {
    const event = this.event();
    if (!event || !this.selectedRsvpStatus) return;
    const key = this.guestTokenKey(event._id);
    let token: string | undefined;
    try { token = localStorage.getItem(key) || undefined; } catch { /* storage blocked */ }
    const before = this.guestRsvp();

    this.isSubmittingRsvp.set(true);
    this.rsvpService.guestRsvp({
      eventId: event._id,
      inviteCode: this.inviteCode || undefined,
      name: this.guestName.trim(),
      phone: this.guestPhone.trim() || undefined,
      status: this.selectedRsvpStatus as 'going' | 'maybe' | 'not_going',
      guestsCount: this.guestsCount,
      guestToken: token
    }).subscribe({
      next: res => {
        try { localStorage.setItem(key, res.data.guestToken); } catch { /* storage blocked */ }
        const g = res.data.rsvp;
        // Keep the headcount on the page in step with the change
        const held = (x: GuestRsvp | null) => x && x.status === 'going' ? 1 + (x.guestsCount || 0) : 0;
        this.event.set({ ...event, currentAttendees: Math.max(0, event.currentAttendees - held(before) + held(g)) });
        this.guestRsvp.set(g);
        this.rsvpModal = false;
        this.isSubmittingRsvp.set(false);
        this.toast.success(g.status === 'going' ? "You're on the list" : 'Response saved',
          g.status === 'going' ? `Your check-in code is ${g.checkInCode}.` : 'The host can see your answer.');
      },
      // The app's error handler shows the message
      error: () => this.isSubmittingRsvp.set(false)
    });
  }

  closeRsvpModal(): void {
    this.rsvpModal = false;
    // Reset form if no existing RSVP
    if (!this.userRsvp()) {
      this.selectedRsvpStatus = null;
      this.guestsCount = 0;
    } else {
      // Reset to existing values
      this.selectedRsvpStatus = this.userRsvp()!.status;
      this.guestsCount = this.userRsvp()!.guestsCount || 0;
    }
  }

  incrementGuests(): void {
    if (this.guestsCount < 10) {
      this.guestsCount++;
    }
  }

  decrementGuests(): void {
    if (this.guestsCount > 0) {
      this.guestsCount--;
    }
  }

  shareOnTwitter(): void {
    this.analytics.track('invite_shared', { eventId: this.event()?._id, channel: 'x' });
    const url = this.shareUrl('x');
    const text = `Check out this event: ${this.event()?.title}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  }

  shareOnWhatsApp(): void {
    this.analytics.track('invite_shared', { eventId: this.event()?._id, channel: 'whatsapp' });
    const url = this.shareUrl('whatsapp');
    const text = `Check out this event: ${this.event()?.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  }

  copyLink(): void {
    this.analytics.track('invite_shared', { eventId: this.event()?._id, channel: 'copy' });
    navigator.clipboard.writeText(this.shareUrl('copy'));
    this.toast.success('Link Copied!', 'Event link has been copied to clipboard.');
  }

  // Task Methods
  loadTasks(eventId: string): void {
    this.isLoadingTasks.set(true);
    this.taskService.getEventTasks(eventId).subscribe({
      next: (response) => {
        this.tasks.set(response.data);
        this.isLoadingTasks.set(false);
      },
      error: () => {
        this.isLoadingTasks.set(false);
      }
    });
  }

  getCompletedTasksCount(): number {
    return this.tasks().filter(t => t.status === 'done').length;
  }

  getTaskCompletionPercent(): number {
    const total = this.tasks().length;
    if (total === 0) return 0;
    return (this.getCompletedTasksCount() / total) * 100;
  }

  formatCategory(category: TaskCategory): string {
    const labels: Record<TaskCategory, string> = {
      'venue': 'Venue',
      'catering': 'Catering',
      'decoration': 'Decoration',
      'entertainment': 'Entertainment',
      'photography': 'Photography',
      'guest_management': 'Guest Management',
      'logistics': 'Logistics',
      'budget': 'Budget',
      'other': 'Other'
    };
    return labels[category] || category;
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  }

  toggleTaskStatus(task: Task): void {
    const newStatus: TaskStatus = task.status === 'done' ? 'pending' : 'done';

    this.taskService.updateTaskStatus(task._id, newStatus).subscribe({
      next: (response) => {
        this.tasks.update(tasks =>
          tasks.map(t => t._id === task._id ? response.data : t)
        );
      },
      error: () => {
        this.toast.error('Could not update your checklist', 'Please try again.');
      }
    });
  }

  openAddTaskModal(): void {
    this.editingTask = null;
    this.taskFormData = {
      taskName: '',
      description: '',
      category: 'other',
      priority: 'medium',
      dueDate: ''
    };
    this.taskModal = true;
  }

  openEditTaskModal(task: Task): void {
    this.editingTask = task;
    this.taskFormData = {
      taskName: task.taskName,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    };
    this.taskModal = true;
  }

  closeTaskModal(): void {
    this.taskModal = false;
    this.editingTask = null;
  }

  saveTask(): void {
    if (!this.taskFormData.taskName || !this.taskFormData.category || !this.event()) return;

    this.isSavingTask.set(true);

    if (this.editingTask) {
      // Update existing task
      this.taskService.updateTask(this.editingTask._id, {
        taskName: this.taskFormData.taskName,
        description: this.taskFormData.description || undefined,
        category: this.taskFormData.category as TaskCategory,
        priority: this.taskFormData.priority,
        dueDate: this.taskFormData.dueDate || undefined
      }).subscribe({
        next: (response) => {
          this.tasks.update(tasks =>
            tasks.map(t => t._id === this.editingTask?._id ? response.data : t)
          );
          this.planner?.reload();
          this.toast.success('Checklist updated');
          this.closeTaskModal();
          this.isSavingTask.set(false);
        },
        error: () => {
          this.toast.error('Error', 'Failed to update task.');
          this.isSavingTask.set(false);
        }
      });
    } else {
      // Create new task
      this.taskService.createTask({
        eventId: this.event()!._id,
        taskName: this.taskFormData.taskName,
        description: this.taskFormData.description || undefined,
        category: this.taskFormData.category as TaskCategory,
        priority: this.taskFormData.priority,
        dueDate: this.taskFormData.dueDate || undefined
      }).subscribe({
        next: (response) => {
          this.tasks.update(tasks => [...tasks, response.data]);
          this.planner?.reload();
          this.toast.success('Added to your checklist');
          this.closeTaskModal();
          this.isSavingTask.set(false);
        },
        error: () => {
          this.toast.error('Error', 'Failed to create task.');
          this.isSavingTask.set(false);
        }
      });
    }
  }

  deleteTask(task: Task): void {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(task._id).subscribe({
      next: () => {
        this.tasks.update(tasks => tasks.filter(t => t._id !== task._id));
        this.toast.success('Task Deleted', 'Task has been removed.');
      },
      error: () => {
        this.toast.error('Error', 'Failed to delete task.');
      }
    });
  }

  messageOrganizer(): void {
    const organizerId = this.getOrganizer()?._id;
    if (organizerId) {
      this.router.navigate(['/messages', organizerId]);
    }
  }

  toggleFavorite(): void {
    const eventData = this.event();
    if (!eventData) return;

    this.favoriteService.toggleFavorite({
      id: eventData._id,
      type: 'event',
      name: eventData.title,
      image: eventData.coverPhoto
    }).subscribe(result => {
      this.isFavorite.set(result.isFavorite);
      if (result.isFavorite) {
        this.toast.success('Saved!', 'Event added to your favorites');
      } else {
        this.toast.info('Removed', 'Event removed from favorites');
      }
    });
  }
}
