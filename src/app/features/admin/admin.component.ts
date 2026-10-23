import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ToastService } from '../../core/services/toast.service';
import { AdminService, AdminStats, GrowthMetrics, PayoutItem } from '../../core/services/admin.service';

type Tab = 'overview' | 'growth' | 'payouts' | 'verification' | 'reviews';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent],
  template: `

    <main class="admin-page">
      <div class="container">
        <h1>Admin</h1>

        <nav class="tabs">
          <button [class.active]="tab() === 'overview'" (click)="select('overview')">Overview</button>
          <button [class.active]="tab() === 'growth'" (click)="select('growth')">Growth</button>
          <button [class.active]="tab() === 'payouts'" (click)="select('payouts')">
            Payouts @if (stats()?.payoutsDue?.count) { <span class="count">{{ stats()?.payoutsDue?.count }}</span> }
          </button>
          <button [class.active]="tab() === 'verification'" (click)="select('verification')">
            Vendor verification @if (stats()?.pendingVerification) { <span class="count">{{ stats()?.pendingVerification }}</span> }
          </button>
          <button [class.active]="tab() === 'reviews'" (click)="select('reviews')">
            Flagged reviews @if (stats()?.flaggedReviews) { <span class="count">{{ stats()?.flaggedReviews }}</span> }
          </button>
        </nav>

        @switch (tab()) {
          @case ('overview') {
            @if (stats(); as s) {
              <div class="stat-grid">
                <div class="stat"><span class="label">Platform revenue (30d)</span><span class="value">₹{{ s.money.last30Days.platformRevenue | number:'1.0-0' }}</span></div>
                <div class="stat"><span class="label">Collected online (30d)</span><span class="value">₹{{ s.money.last30Days.collected | number:'1.0-0' }}</span></div>
                <div class="stat"><span class="label">Payouts due</span><span class="value">₹{{ s.payoutsDue.amount | number:'1.0-0' }}</span></div>
                <div class="stat"><span class="label">Platform revenue (all time)</span><span class="value">₹{{ s.money.allTime.platformRevenue | number:'1.0-0' }}</span></div>
                <div class="stat"><span class="label">Users</span><span class="value">{{ s.users.total | number }}</span><span class="sub">+{{ s.users.last30Days }} in 30d</span></div>
                <div class="stat"><span class="label">Active vendors</span><span class="value">{{ s.vendors | number }}</span></div>
                <div class="stat"><span class="label">Events</span><span class="value">{{ s.events | number }}</span></div>
                <div class="stat"><span class="label">Completed bookings</span><span class="value">{{ (s.bookings['completed'] || 0) | number }}</span><span class="sub">{{ s.bookings['pending'] || 0 }} pending · {{ s.bookings['confirmed'] || 0 }} confirmed</span></div>
              </div>
              <p class="muted">Refunded all time: ₹{{ s.money.allTime.refunded | number:'1.0-0' }}</p>
            } @else {
              <p class="muted">Loading…</p>
            }
          }

          @case ('growth') {
            <div class="growth-head">
              <label>Period
                <select class="form-input" [ngModel]="growthDays()" (ngModelChange)="loadGrowth($event)">
                  <option [ngValue]="7">Last 7 days</option>
                  <option [ngValue]="30">Last 30 days</option>
                  <option [ngValue]="90">Last 90 days</option>
                </select>
              </label>
            </div>
            @if (growth(); as g) {
              <div class="stat-grid">
                <div class="stat"><span class="label">Completed paid bookings</span><span class="value">{{ g.funnel.completedPaidBookings | number }}</span><span class="sub">North star · ₹{{ g.funnel.completedPaidGmv | number:'1.0-0' }} GMV</span></div>
                <div class="stat"><span class="label">New signups</span><span class="value">{{ g.signups | number }}</span></div>
                <div class="stat"><span class="label">Booking requests</span><span class="value">{{ g.funnel.bookingRequests | number }}</span><span class="sub">{{ g.funnel.paidBookings }} payments received</span></div>
                <div class="stat"><span class="label">Events created</span><span class="value">{{ g.funnel.eventsCreated | number }}</span><span class="sub">{{ g.funnel.eventsWithThreeGuests }} with 3+ guests going</span></div>
                <div class="stat"><span class="label">Active vendors</span><span class="value">{{ g.supply.activeVendors | number }}</span><span class="sub">{{ g.supply.vendorsWithAcceptedBooking }} have accepted a booking (all time)</span></div>
              </div>

              <h2 class="growth-title">Where new users came from</h2>
              <p class="muted">First visit source (UTM tag, referring site, or direct). "Activated" means the user requested a booking, listed a service, or created an event.</p>
              @if (g.bySource.length === 0) {
                <p class="empty">No signups in this period.</p>
              } @else {
                <div class="table-wrap">
                  <table class="growth-table">
                    <thead><tr><th scope="col">Source</th><th scope="col">Signups</th><th scope="col">Requested booking</th><th scope="col">Listed service</th><th scope="col">Created event</th><th scope="col">Activated</th></tr></thead>
                    <tbody>
                      @for (r of g.bySource; track r.source) {
                        <tr>
                          <th scope="row">{{ r.source === 'unknown' ? 'not tracked (older accounts)' : r.source }}</th>
                          <td>{{ r.signups }}</td>
                          <td>{{ r.requestedBooking }}</td>
                          <td>{{ r.listedService }}</td>
                          <td>{{ r.createdEvent }}</td>
                          <td>{{ r.activated }} <span class="muted">({{ r.activated / r.signups | percent:'1.0-0' }})</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            } @else {
              <p class="muted">Loading…</p>
            }
          }

          @case ('payouts') {
            <p class="muted">Send each payout by UPI or bank transfer, then record the UTR/reference here. The payee is notified.</p>
            @if (payouts().length === 0) {
              <p class="empty">Nothing to pay out right now.</p>
            }
            @for (p of payouts(); track p._id) {
              <div class="row-card">
                <div class="row-main">
                  <strong>₹{{ p.payeeAmount | number:'1.0-2' }}</strong> to {{ p.payee.name }}
                  <div class="muted">
                    {{ p.kind === 'ticket' ? 'Ticket sales' : 'Booking' }} · {{ p.event?.title }} ·
                    paid ₹{{ p.amount | number:'1.0-2' }}, fee ₹{{ p.platformFee | number:'1.0-2' }}
                    @if (p.refundedAmount) { , refunded ₹{{ p.refundedAmount | number:'1.0-2' }} }
                  </div>
                  <div class="payee-details">
                    @if (p.payee.payoutDetails; as d) {
                      @if (d.method === 'upi') {
                        UPI: <code>{{ d.upiId }}</code>
                      } @else {
                        Bank: <code>{{ d.accountHolderName }} · {{ d.accountNumber }} · {{ d.ifsc }}</code>
                      }
                    } @else {
                      <span class="warning">No payout details — contact {{ p.payee.email }} {{ p.payee.phone }}</span>
                    }
                  </div>
                </div>
                <div class="row-actions">
                  <input class="form-input" placeholder="UTR / reference" [(ngModel)]="references[p._id]">
                  <app-button size="sm" [disabled]="!references[p._id]" (onClick)="markPaid(p)">Mark paid</app-button>
                </div>
              </div>
            }
          }

          @case ('verification') {
            <p class="muted">Check the vendor's portfolio, phone and business details before verifying. Verified services show a badge.</p>
            @if (services().length === 0) {
              <p class="empty">Nothing waiting for verification.</p>
            }
            @for (s of services(); track s._id) {
              <div class="row-card">
                <div class="row-main">
                  <a [routerLink]="['/services', s.slug]" target="_blank"><strong>{{ s.serviceName }}</strong></a>
                  <div class="muted">
                    {{ s.category }} · {{ s.city }} · ₹{{ s.basePrice | number }} · by {{ s.provider?.name }}
                    ({{ s.provider?.email }}{{ s.provider?.phone ? ', ' + s.provider.phone : '' }}{{ s.provider?.phoneVerified ? ' (phone verified)' : '' }})
                  </div>
                  @if (s.businessName || s.gstNumber) {
                    <div class="muted">{{ s.businessName }} {{ s.gstNumber ? '· GST ' + s.gstNumber : '' }}</div>
                  }
                </div>
                <div class="row-actions">
                  <app-button size="sm" (onClick)="verify(s)">Verify</app-button>
                </div>
              </div>
            }
          }

          @case ('reviews') {
            @if (reviews().length === 0) {
              <p class="empty">No flagged reviews.</p>
            }
            @for (r of reviews(); track r._id) {
              <div class="row-card">
                <div class="row-main">
                  <strong>{{ r.rating }}/5</strong> for {{ r.service?.serviceName }} by {{ r.reviewer?.name }}
                  <p>{{ r.reviewText }}</p>
                  <div class="muted">
                    @if (r.flagReason) { Flagged: {{ r.flagReason }} }
                    @for (rep of r.reports; track $index) { · Reported: {{ rep.reason }} }
                  </div>
                </div>
                <div class="row-actions">
                  <app-button size="sm" variant="secondary" (onClick)="moderate(r, true)">Keep</app-button>
                  <app-button size="sm" variant="danger" (onClick)="moderate(r, false)">Remove</app-button>
                </div>
              </div>
            }
          }
        }
      </div>
    </main>
  `,
  styles: [`
    @use '../../../styles/variables' as *;

    .admin-page {
      padding: $spacing-8 0;
      background: $bg-secondary;
      min-height: calc(100vh - #{$navbar-height});
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 $spacing-4;
    }

    .tabs {
      display: flex;
      gap: $spacing-2;
      flex-wrap: wrap;
      margin: $spacing-4 0 $spacing-6;

      button {
        border: 1px solid $border-default;
        background: $bg-primary;
        border-radius: $radius-full;
        padding: $spacing-2 $spacing-4;
        cursor: pointer;
        font-size: $font-size-sm;

        &.active {
          background: $primary-600;
          border-color: $primary-600;
          color: $text-inverse;
        }
      }

      .count {
        margin-left: $spacing-1;
        font-weight: $font-weight-bold;
      }
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: $spacing-4;
      margin-bottom: $spacing-4;
    }

    .stat,
    .row-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      padding: $spacing-4;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: $spacing-1;

      .label, .sub { font-size: $font-size-sm; color: $text-secondary; }
      .value { font-size: $font-size-2xl; font-weight: $font-weight-bold; font-variant-numeric: tabular-nums; }
    }

    .row-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: $spacing-4;
      margin-bottom: $spacing-3;
      flex-wrap: wrap;
    }

    .row-main {
      flex: 1 1 360px;
      min-width: 0;

      p { margin: $spacing-1 0; }
    }

    .row-actions {
      display: flex;
      gap: $spacing-2;
      align-items: center;

      .form-input { width: 180px; }
    }

    .payee-details {
      margin-top: $spacing-1;
      font-size: $font-size-sm;
    }

    .growth-head {
      margin-bottom: $spacing-4;

      label { display: inline-flex; align-items: center; gap: $spacing-2; font-size: $font-size-sm; color: $text-secondary; }
      .form-input { width: auto; }
    }

    .growth-title { font-size: $font-size-lg; margin: $spacing-8 0 $spacing-1; }

    .table-wrap { overflow-x: auto; margin-top: $spacing-4; }

    .growth-table {
      width: 100%;
      border-collapse: collapse;
      font-size: $font-size-sm;
      background: $bg-primary;

      th, td { padding: $spacing-3; text-align: right; border-bottom: 1px solid $border-light; white-space: nowrap; }
      th:first-child { text-align: left; }
      thead th { color: $text-secondary; font-weight: $font-weight-semibold; }
      td { font-variant-numeric: tabular-nums; }
    }

    .muted { color: $text-secondary; font-size: $font-size-sm; }
    .warning { color: $warning-dark; }
    .empty { color: $text-secondary; padding: $spacing-8 0; text-align: center; }
  `]
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  tab = signal<Tab>('overview');
  stats = signal<AdminStats | null>(null);
  payouts = signal<PayoutItem[]>([]);
  services = signal<any[]>([]);
  reviews = signal<any[]>([]);
  references: Record<string, string> = {};
  growth = signal<GrowthMetrics | null>(null);
  growthDays = signal(30);

  ngOnInit(): void {
    this.loadStats();
  }

  select(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'growth') this.loadGrowth(this.growthDays());
    if (tab === 'payouts') this.admin.getPayouts().subscribe(p => this.payouts.set(p));
    if (tab === 'verification') this.admin.getUnverifiedServices().subscribe(s => this.services.set(s));
    if (tab === 'reviews') this.admin.getFlaggedReviews().subscribe(r => this.reviews.set(r));
  }

  loadGrowth(days: number): void {
    this.growthDays.set(days);
    this.growth.set(null);
    this.admin.getGrowth(days).subscribe(g => this.growth.set(g));
  }

  private loadStats(): void {
    this.admin.getStats().subscribe(s => this.stats.set(s));
  }

  markPaid(payout: PayoutItem): void {
    const reference = this.references[payout._id]?.trim();
    if (!reference) return;
    this.admin.markPayoutPaid(payout._id, reference).subscribe(() => {
      this.payouts.update(list => list.filter(p => p._id !== payout._id));
      this.toast.success('Payout recorded', `${payout.payee.name} has been notified.`);
      this.loadStats();
    });
  }

  verify(service: any): void {
    this.admin.verifyService(service._id).subscribe(() => {
      this.services.update(list => list.filter(s => s._id !== service._id));
      this.toast.success('Verified', `${service.serviceName} is now verified.`);
      this.loadStats();
    });
  }

  moderate(review: any, keep: boolean): void {
    this.admin.moderateReview(review._id, keep, keep ? undefined : 'Removed for violating our review guidelines').subscribe(() => {
      this.reviews.update(list => list.filter(r => r._id !== review._id));
      this.toast.success(keep ? 'Review kept' : 'Review removed');
      this.loadStats();
    });
  }
}
