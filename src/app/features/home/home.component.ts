import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { EventService } from '../../core/services/event.service';
import { ServiceService } from '../../core/services/service.service';
import { Event } from '../../core/models/event.model';
import { Service } from '../../core/models/service.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, ButtonComponent, CardComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__container">
        <div class="hero__content">
          <h1 class="hero__title">
            Plan events that<br>
            <span class="hero__highlight">people remember</span>
          </h1>
          <p class="hero__subtitle">
            The all-in-one platform to create, manage, and discover amazing events.
            Connect with trusted vendors and make every celebration unforgettable.
          </p>
          <div class="hero__actions">
            <app-button routerLink="/events" size="lg">Explore Events</app-button>
            <app-button routerLink="/auth/register" variant="secondary" size="lg">Get Started Free</app-button>
          </div>
          <div class="hero__stats">
            <div class="hero__stat">
              <span class="hero__stat-value">10K+</span>
              <span class="hero__stat-label">Events Created</span>
            </div>
            <div class="hero__stat">
              <span class="hero__stat-value">50K+</span>
              <span class="hero__stat-label">Happy Guests</span>
            </div>
            <div class="hero__stat">
              <span class="hero__stat-value">1K+</span>
              <span class="hero__stat-label">Verified Vendors</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="hero__cards">
            <div class="hero__card hero__card--1">🎂 Birthday Party</div>
            <div class="hero__card hero__card--2">💒 Wedding</div>
            <div class="hero__card hero__card--3">🎉 House Party</div>
            <div class="hero__card hero__card--4">🤝 Corporate Event</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Everything you need to plan the perfect event</h2>
          <p class="section-subtitle">From planning to execution, we've got you covered</p>
        </div>
        <div class="features__grid">
          <div class="feature-card">
            <div class="feature-card__icon">📅</div>
            <h3 class="feature-card__title">Event Management</h3>
            <p class="feature-card__desc">Create, manage, and track all your events in one place with our intuitive dashboard.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">🛠️</div>
            <h3 class="feature-card__title">Vendor Marketplace</h3>
            <p class="feature-card__desc">Browse and book verified vendors for catering, decoration, photography, and more.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">💰</div>
            <h3 class="feature-card__title">Budget Tracking</h3>
            <p class="feature-card__desc">Keep your spending on track with real-time budget monitoring and expense tracking.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">📋</div>
            <h3 class="feature-card__title">Task Management</h3>
            <p class="feature-card__desc">Never miss a detail with task lists, reminders, and collaboration tools.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">🎫</div>
            <h3 class="feature-card__title">RSVP & Check-in</h3>
            <p class="feature-card__desc">Manage guest lists, send invitations, and streamline check-in with QR codes.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">💬</div>
            <h3 class="feature-card__title">Real-time Messaging</h3>
            <p class="feature-card__desc">Communicate seamlessly with vendors and guests through our built-in messaging.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Upcoming Events Section -->
    <section class="events-section section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Discover upcoming events</h2>
            <p class="section-subtitle">Find and join exciting events happening near you</p>
          </div>
          <a routerLink="/events" class="section-link">View all events →</a>
        </div>
        <div class="events-grid">
          @if (isLoadingEvents()) {
            @for (i of [1,2,3,4]; track i) {
              <div class="skeleton-card">
                <div class="skeleton skeleton--image"></div>
                <div class="skeleton-content">
                  <div class="skeleton skeleton--title"></div>
                  <div class="skeleton skeleton--text"></div>
                  <div class="skeleton skeleton--text" style="width: 60%"></div>
                </div>
              </div>
            }
          } @else {
            @for (event of upcomingEvents(); track event._id) {
              <app-card
                [title]="event.title"
                [subtitle]="formatEventDate(event.date)"
                [image]="event.coverPhoto || 'assets/images/event-placeholder.jpg'"
                [badge]="event.eventType"
                badgeType="primary"
                hoverable
                clickable
                [routerLink]="['/events', event.slug]"
              >
                <div class="event-card-content">
                  <p class="event-location">📍 {{ event.locationName || event.city }}</p>
                  <div class="event-meta">
                    <span>👥 {{ event.currentAttendees }}/{{ event.maxAttendees || '∞' }}</span>
                    @if (event.isPaid) {
                      <span class="event-price">₹{{ event.entryFee }}</span>
                    } @else {
                      <span class="event-free">Free</span>
                    }
                  </div>
                </div>
              </app-card>
            }
          }
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section class="services-section section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Top-rated vendors</h2>
            <p class="section-subtitle">Book trusted professionals for your next event</p>
          </div>
          <a routerLink="/services" class="section-link">Browse all services →</a>
        </div>
        <div class="services-grid">
          @if (isLoadingServices()) {
            @for (i of [1,2,3,4]; track i) {
              <div class="skeleton-card">
                <div class="skeleton skeleton--image"></div>
                <div class="skeleton-content">
                  <div class="skeleton skeleton--title"></div>
                  <div class="skeleton skeleton--text"></div>
                </div>
              </div>
            }
          } @else {
            @for (service of topServices(); track service._id) {
              <app-card
                [title]="service.serviceName"
                [subtitle]="service.category | titlecase"
                [image]="service.coverImage || 'assets/images/service-placeholder.jpeg'"
                [badge]="service.isVerified ? 'Verified' : ''"
                badgeType="success"
                hoverable
                clickable
                [routerLink]="['/services', service.slug]"
              >
                <div class="service-card-content">
                  <div class="service-rating">
                    <span class="rating-stars">⭐</span>
                    <span>{{ service.ratingAverage | number:'1.1-1' }}</span>
                    <span class="rating-count">({{ service.totalRatings }})</span>
                  </div>
                  <div class="service-price">
                    <span class="price-value">₹{{ service.basePrice | number }}</span>
                    <span class="price-unit">{{ formatPriceUnit(service.priceUnit) }}</span>
                  </div>
                </div>
              </app-card>
            }
          }
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta section">
      <div class="container">
        <div class="cta__content">
          <h2 class="cta__title">Ready to create your next event?</h2>
          <p class="cta__subtitle">Join thousands of organizers making memories with Festivo</p>
          <div class="cta__actions">
            <app-button routerLink="/auth/register" size="lg">Start Planning Free</app-button>
            <app-button routerLink="/services" variant="ghost" size="lg">Become a Vendor</app-button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <a routerLink="/" class="footer__logo">
              <span class="footer__logo-icon">🎉</span>
              <span class="footer__logo-text">Festivo</span>
            </a>
            <p class="footer__tagline">Making every celebration unforgettable</p>
          </div>
          <div class="footer__links">
            <h4>Platform</h4>
            <a routerLink="/events">Explore Events</a>
            <a routerLink="/services">Find Services</a>
            <a routerLink="/auth/register">Create Account</a>
          </div>
          <div class="footer__links">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Contact</a>
            <a href="#">Blog</a>
          </div>
          <div class="footer__links">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
        <div class="footer__bottom">
          <p>© 2024 Festivo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    // Hero Section
    .hero {
      background: $bg-gradient-hero;
      color: $text-inverse;
      overflow: hidden;
    }

    .hero__container {
      @include container;
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-12;
      padding: $spacing-12 $spacing-4;
      min-height: calc(100vh - $navbar-height);
      align-items: center;

      @include lg {
        grid-template-columns: 1fr 1fr;
        padding: $spacing-16 $spacing-8;
      }
    }

    .hero__title {
      font-size: $font-size-4xl;
      font-weight: $font-weight-extrabold;
      line-height: 1.1;
      margin-bottom: $spacing-6;

      @include md {
        font-size: $font-size-5xl;
      }

      @include lg {
        font-size: $font-size-6xl;
      }
    }

    .hero__highlight {
      background: linear-gradient(135deg, $secondary-300 0%, $secondary-500 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero__subtitle {
      font-size: $font-size-lg;
      opacity: 0.9;
      margin-bottom: $spacing-8;
      max-width: 540px;

      @include md {
        font-size: $font-size-xl;
      }
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-4;
      margin-bottom: $spacing-10;
    }

    .hero__stats {
      display: flex;
      gap: $spacing-8;
    }

    .hero__stat {
      text-align: center;
    }

    .hero__stat-value {
      display: block;
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;

      @include md {
        font-size: $font-size-3xl;
      }
    }

    .hero__stat-label {
      font-size: $font-size-sm;
      opacity: 0.8;
    }

    .hero__visual {
      display: none;

      @include lg {
        display: block;
        position: relative;
        height: 400px;
      }
    }

    .hero__cards {
      position: relative;
      height: 100%;
    }

    .hero__card {
      position: absolute;
      padding: $spacing-4 $spacing-6;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: $radius-lg;
      font-weight: $font-weight-semibold;
      box-shadow: $shadow-lg;

      &--1 { top: 10%; left: 10%; animation: float 6s ease-in-out infinite; }
      &--2 { top: 30%; right: 10%; animation: float 6s ease-in-out infinite 1s; }
      &--3 { bottom: 30%; left: 20%; animation: float 6s ease-in-out infinite 2s; }
      &--4 { bottom: 10%; right: 20%; animation: float 6s ease-in-out infinite 3s; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    // Section styles
    .section {
      @include section;
    }

    .section-header {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
      margin-bottom: $spacing-10;

      @include md {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-end;
      }
    }

    .section-title {
      @include heading-2;
    }

    .section-subtitle {
      color: $text-secondary;
      font-size: $font-size-lg;
    }

    .section-link {
      color: $primary-600;
      font-weight: $font-weight-medium;
      white-space: nowrap;

      &:hover {
        color: $primary-700;
      }
    }

    // Features
    .features__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-6;

      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }

      @include lg {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .feature-card {
      @include card;
      text-align: center;
    }

    .feature-card__icon {
      font-size: 2.5rem;
      margin-bottom: $spacing-4;
    }

    .feature-card__title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-2;
    }

    .feature-card__desc {
      color: $text-secondary;
      font-size: $font-size-sm;
    }

    // Events & Services Grid
    .events-grid,
    .services-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-6;

      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }

      @include lg {
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

    .event-card-content,
    .service-card-content {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
    }

    .event-location {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .event-meta {
      display: flex;
      justify-content: space-between;
      font-size: $font-size-sm;
    }

    .event-price {
      color: $primary-600;
      font-weight: $font-weight-semibold;
    }

    .event-free {
      color: $success;
      font-weight: $font-weight-medium;
    }

    .service-rating {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      font-size: $font-size-sm;
    }

    .rating-count {
      color: $text-muted;
    }

    .service-price {
      display: flex;
      align-items: baseline;
      gap: $spacing-1;
    }

    .price-value {
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: $primary-600;
    }

    .price-unit {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    // Services Section Background
    .services-section {
      background: $bg-tertiary;
    }

    // CTA Section
    .cta {
      background: $bg-gradient-hero;
      color: $text-inverse;
      text-align: center;
    }

    .cta__content {
      max-width: 640px;
      margin: 0 auto;
    }

    .cta__title {
      @include heading-2;
      margin-bottom: $spacing-4;
    }

    .cta__subtitle {
      font-size: $font-size-lg;
      opacity: 0.9;
      margin-bottom: $spacing-8;
    }

    .cta__actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: $spacing-4;
    }

    // Footer
    .footer {
      background: $neutral-900;
      color: $text-inverse;
      padding: $spacing-16 0 $spacing-8;
    }

    .footer__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-8;
      margin-bottom: $spacing-12;

      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }

      @include lg {
        grid-template-columns: 2fr 1fr 1fr 1fr;
      }
    }

    .footer__logo {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      margin-bottom: $spacing-4;
      text-decoration: none;
    }

    .footer__logo-icon {
      font-size: 1.5rem;
    }

    .footer__logo-text {
      font-family: $font-family-heading;
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $text-inverse;
    }

    .footer__tagline {
      color: $neutral-400;
    }

    .footer__links {
      h4 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-4;
      }

      a {
        display: block;
        color: $neutral-400;
        margin-bottom: $spacing-2;
        transition: color $transition-fast;

        &:hover {
          color: $text-inverse;
        }
      }
    }

    .footer__bottom {
      padding-top: $spacing-8;
      border-top: 1px solid $neutral-800;
      text-align: center;
      color: $neutral-500;
      font-size: $font-size-sm;
    }
  `]
})
export class HomeComponent implements OnInit {
  private eventService = inject(EventService);
  private serviceService = inject(ServiceService);

  upcomingEvents = signal<Event[]>([]);
  topServices = signal<Service[]>([]);
  isLoadingEvents = signal(true);
  isLoadingServices = signal(true);

  ngOnInit(): void {
    this.loadUpcomingEvents();
    this.loadTopServices();
  }

  loadUpcomingEvents(): void {
    this.eventService.getUpcomingEvents().subscribe({
      next: (response) => {
        this.upcomingEvents.set(response.data.slice(0, 4));
        this.isLoadingEvents.set(false);
      },
      error: () => {
        this.isLoadingEvents.set(false);
      }
    });
  }

  loadTopServices(): void {
    this.serviceService.getTopRatedServices().subscribe({
      next: (response) => {
        this.topServices.set(response.data.slice(0, 4));
        this.isLoadingServices.set(false);
      },
      error: () => {
        this.isLoadingServices.set(false);
      }
    });
  }

  formatEventDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
