import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Event } from '../../../../core/models/event.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, ButtonComponent, ModalComponent],
  template: `
    <app-navbar></app-navbar>

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
      <main class="event-detail">
        <!-- Hero Image -->
        <div class="event-hero" [style.background-image]="'url(' + (event()?.coverPhoto || 'assets/images/event-placeholder.jpg') + ')'">
          <div class="event-hero__overlay"></div>
          <div class="event-hero__content container">
            <div class="event-badges">
              <span class="badge badge--primary">{{ event()?.eventType }}</span>
              @if (!event()?.isPublic) {
                <span class="badge badge--warning">Private</span>
              }
              @if (event()?.isPaid) {
                <span class="badge badge--success">₹{{ event()?.entryFee }}</span>
              } @else {
                <span class="badge badge--success">Free</span>
              }
            </div>
            <h1 class="event-title">{{ event()?.title }}</h1>
            <div class="event-meta">
              <div class="meta-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ formatDate(event()?.date) }}
              </div>
              <div class="meta-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ event()?.time }}
              </div>
              <div class="meta-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ event()?.locationName || event()?.city }}
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="event-content">
          <div class="container">
            <div class="event-layout">
              <!-- Main Info -->
              <div class="event-main">
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
                      [href]="'https://maps.google.com/?q=' + (event()?.location?.coordinates?.[1] || '') + ',' + (event()?.location?.coordinates?.[0] || '')"
                      target="_blank"
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
                      <p>{{ getOrganizer()?.eventsOrganized }} events organized</p>
                      <div class="organizer-rating">
                        ⭐ {{ getOrganizer()?.ratingAverage | number:'1.1-1' }}
                      </div>
                    </div>
                    @if (auth.isAuthenticated() && getOrganizer()?._id !== auth.currentUser()?._id) {
                      <app-button variant="secondary" size="sm">Message</app-button>
                    }
                  </div>
                </section>
              </div>

              <!-- Sidebar -->
              <aside class="event-sidebar">
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
                        <app-button variant="secondary" fullWidth (onClick)="showManageOptions = true">
                          Manage Event
                        </app-button>
                      } @else {
                        <app-button fullWidth (onClick)="rsvpModal = true">
                          @if (event()?.isPaid) {
                            Buy Ticket
                          } @else {
                            RSVP Now
                          }
                        </app-button>
                        <app-button variant="secondary" fullWidth>
                          Save Event
                        </app-button>
                      }
                    } @else {
                      <app-button routerLink="/auth/login" fullWidth>
                        Login to RSVP
                      </app-button>
                    }
                  </div>

                  <div class="sidebar-share">
                    <span class="share-label">Share event</span>
                    <div class="share-buttons">
                      <button class="share-btn" (click)="shareOnTwitter()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                      </button>
                      <button class="share-btn" (click)="shareOnWhatsApp()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                      <button class="share-btn" (click)="copyLink()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        </div>
      </main>

      <!-- RSVP Modal -->
      <app-modal
        [isOpen]="rsvpModal"
        title="RSVP to Event"
        (onClose)="rsvpModal = false"
        [showFooter]="true"
      >
        <p>Confirm your attendance to this event.</p>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="rsvpModal = false">Cancel</app-button>
          <app-button (onClick)="confirmRsvp()">Confirm RSVP</app-button>
        </div>
      </app-modal>
    } @else {
      <div class="error-state">
        <span class="error-icon">😕</span>
        <h2>Event not found</h2>
        <p>This event may have been removed or doesn't exist.</p>
        <app-button routerLink="/events">Browse Events</app-button>
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

    .event-hero {
      position: relative;
      height: 400px;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;

      @include md {
        height: 500px;
      }
    }

    .event-hero__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
    }

    .event-hero__content {
      position: relative;
      color: $text-inverse;
      padding-bottom: $spacing-8;
    }

    .event-badges {
      display: flex;
      gap: $spacing-2;
      margin-bottom: $spacing-4;
    }

    .event-title {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-4;

      @include md {
        font-size: $font-size-4xl;
      }
    }

    .event-meta {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-6;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-base;
      opacity: 0.9;
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
  `]
})
export class EventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  event = signal<Event | null>(null);
  isLoading = signal(true);
  rsvpModal = false;
  showManageOptions = false;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadEvent(slug);
    }
  }

  loadEvent(slug: string): void {
    this.eventService.getEventBySlug(slug).subscribe({
      next: (response) => {
        this.event.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
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

  confirmRsvp(): void {
    this.toast.success('RSVP Confirmed!', 'You have successfully registered for this event.');
    this.rsvpModal = false;
  }

  shareOnTwitter(): void {
    const url = window.location.href;
    const text = `Check out this event: ${this.event()?.title}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  }

  shareOnWhatsApp(): void {
    const url = window.location.href;
    const text = `Check out this event: ${this.event()?.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href);
    this.toast.success('Link Copied!', 'Event link has been copied to clipboard.');
  }
}
