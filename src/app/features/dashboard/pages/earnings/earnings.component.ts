import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ToastService } from '../../../../core/services/toast.service';
import {
  PaymentService,
  PaymentRecord,
  EarningsSummary,
  PayoutDetails
} from '../../../../core/services/payment.service';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, ButtonComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="earnings-page">
      <div class="container">
        <a routerLink="/dashboard" class="back-link">← Dashboard</a>
        <h1>Earnings &amp; Payouts</h1>
        <p class="subtitle">
          Money paid online for your services and event tickets. Festivo holds each payment until the
          booking is completed (or your event takes place), then pays you out minus the platform fee.
        </p>

        <div class="summary-grid">
          <div class="summary-card">
            <span class="summary-label">Held until completion</span>
            <span class="summary-value">₹{{ summary().held | number:'1.0-2' }}</span>
          </div>
          <div class="summary-card summary-card--due">
            <span class="summary-label">Payout due</span>
            <span class="summary-value">₹{{ summary().payoutDue | number:'1.0-2' }}</span>
          </div>
          <div class="summary-card summary-card--paid">
            <span class="summary-label">Paid out</span>
            <span class="summary-value">₹{{ summary().paidOut | number:'1.0-2' }}</span>
          </div>
        </div>

        <section class="card">
          <h2>Where should we pay you?</h2>
          @if (!payout.method) {
            <p class="warning">Add payout details so we can send your earnings.</p>
          }
          <div class="method-toggle">
            <label><input type="radio" name="method" value="upi" [(ngModel)]="payout.method"> UPI</label>
            <label><input type="radio" name="method" value="bank" [(ngModel)]="payout.method"> Bank account</label>
          </div>

          @if (payout.method === 'upi') {
            <div class="form-group">
              <label>UPI ID</label>
              <input class="form-input" [(ngModel)]="payout.upiId" placeholder="name@okaxis">
            </div>
          } @else if (payout.method === 'bank') {
            <div class="form-group">
              <label>Account holder name</label>
              <input class="form-input" [(ngModel)]="payout.accountHolderName">
            </div>
            <div class="form-group">
              <label>Account number</label>
              <input class="form-input" [(ngModel)]="payout.accountNumber" inputmode="numeric">
            </div>
            <div class="form-group">
              <label>IFSC</label>
              <input class="form-input" [(ngModel)]="payout.ifsc" placeholder="HDFC0001234">
            </div>
          }

          @if (payout.method) {
            <app-button [loading]="isSaving()" (onClick)="savePayout()">Save payout details</app-button>
          }
        </section>

        <section class="card">
          <h2>Payment history</h2>
          @if (isLoading()) {
            <p class="muted">Loading…</p>
          } @else if (records().length === 0) {
            <p class="muted">No online payments yet. Once organizers pay you through Festivo they will appear here.</p>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>For</th>
                    <th class="num">Paid</th>
                    <th class="num">Fee</th>
                    <th class="num">You get</th>
                    <th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of records(); track r._id) {
                    <tr>
                      <td>{{ (r.paidAt || r.createdAt) | date:'mediumDate' }}</td>
                      <td>{{ r.kind === 'ticket' ? 'Ticket' : 'Booking' }} · {{ r.event?.title }}</td>
                      <td class="num">
                        ₹{{ r.amount | number:'1.0-2' }}
                        @if (r.refundedAmount) { <small>(₹{{ r.refundedAmount | number:'1.0-2' }} refunded)</small> }
                      </td>
                      <td class="num">₹{{ r.platformFee | number:'1.0-2' }}</td>
                      <td class="num">₹{{ r.payeeAmount | number:'1.0-2' }}</td>
                      <td>
                        <span class="pill" [class]="'pill--' + r.payoutStatus">{{ payoutLabel(r) }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;

    .earnings-page {
      padding: $spacing-8 0;
      background: $bg-secondary;
      min-height: calc(100vh - #{$navbar-height});
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 $spacing-4;
    }

    .back-link {
      color: $text-secondary;
      text-decoration: none;
      font-size: $font-size-sm;
    }

    h1 {
      margin: $spacing-2 0;
    }

    .subtitle,
    .muted {
      color: $text-secondary;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: $spacing-4;
      margin: $spacing-6 0;
    }

    .summary-card,
    .card {
      background: $bg-primary;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      padding: $spacing-5;
    }

    .card {
      margin-bottom: $spacing-6;

      h2 {
        font-size: $font-size-lg;
        margin: 0 0 $spacing-4;
      }
    }

    .summary-card {
      display: flex;
      flex-direction: column;
      gap: $spacing-1;
      border-top: 4px solid $neutral-300;

      &--due { border-top-color: $warning; }
      &--paid { border-top-color: $success; }
    }

    .summary-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .summary-value {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
    }

    .warning {
      color: $warning-dark;
    }

    .method-toggle {
      display: flex;
      gap: $spacing-6;
      margin-bottom: $spacing-4;
    }

    .form-group {
      margin-bottom: $spacing-4;
      max-width: 420px;

      label {
        display: block;
        font-size: $font-size-sm;
        margin-bottom: $spacing-1;
      }
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: $font-size-sm;

      th, td {
        text-align: left;
        padding: $spacing-3 $spacing-2;
        border-bottom: 1px solid $border-light;
        white-space: nowrap;
      }

      th {
        color: $text-secondary;
        font-weight: $font-weight-medium;
      }

      .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      small {
        display: block;
        color: $text-secondary;
      }
    }

    .pill {
      padding: 2px $spacing-2;
      border-radius: $radius-full;
      background: $neutral-100;
      font-size: $font-size-xs;

      &--pending { background: $warning-light; color: $warning-dark; }
      &--paid { background: $success-light; color: $success-dark; }
    }
  `]
})
export class EarningsComponent implements OnInit {
  private payments = inject(PaymentService);
  private toast = inject(ToastService);

  records = signal<PaymentRecord[]>([]);
  summary = signal<EarningsSummary>({ held: 0, payoutDue: 0, paidOut: 0 });
  isLoading = signal(true);
  isSaving = signal(false);

  payout: Partial<PayoutDetails> = {};

  ngOnInit(): void {
    this.payments.getMyPayments('payee').subscribe({
      next: (response) => {
        this.records.set(response.data);
        if (response.summary) this.summary.set(response.summary);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.payments.getPayoutDetails().subscribe({
      next: (details) => {
        if (details) this.payout = { ...details };
      }
    });
  }

  savePayout(): void {
    this.isSaving.set(true);
    this.payments.savePayoutDetails(this.payout as PayoutDetails).subscribe({
      next: (details) => {
        this.payout = { ...details };
        this.isSaving.set(false);
        this.toast.success('Saved', 'Your payout details have been saved.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error('Could not save', err.error?.message || 'Please check the details.');
      }
    });
  }

  payoutLabel(record: PaymentRecord): string {
    const labels: Record<PaymentRecord['payoutStatus'], string> = {
      not_due: 'Held',
      pending: 'Due',
      paid: `Paid${record.payoutReference ? ' · ' + record.payoutReference : ''}`,
      not_applicable: 'Refunded'
    };
    return labels[record.payoutStatus];
  }
}
