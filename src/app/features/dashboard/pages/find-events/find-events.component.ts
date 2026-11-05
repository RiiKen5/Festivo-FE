import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ToastService } from '../../../../core/services/toast.service';
import { Lead, LeadService, Offer, OfferService, OfferStatus } from '../../../../core/services/offer.service';
import { categoryLabel, eventTypeLabel, formatTime } from '../../../../shared/components/listing-cards/listing-format';

const STATUS: Record<OfferStatus, string> = {
  pending: 'Waiting for the organizer', accepted: 'Accepted · now a booking', declined: 'Declined', withdrawn: 'Withdrawn'
};

/**
 * Upcoming events whose organizers asked for vendor offers, in the vendor's
 * city and for their kind of service. The vendor sends a price and a note;
 * if the organizer accepts, it becomes a confirmed booking.
 */
@Component({
  selector: 'app-find-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, ModalComponent],
  template: `
    <main class="leads-page">
      <div class="container">
        <header class="head">
          <h1>Find events</h1>
          <p>Organizers planning events near you who asked vendors to send offers. Send your price and a short note. If they accept, it's a confirmed booking.</p>
        </header>

        <nav class="tabs" aria-label="Find events">
          <button type="button" [class.active]="view() === 'events'" (click)="view.set('events')">Events ({{ leads().length }})</button>
          <button type="button" [class.active]="view() === 'sent'" (click)="showSent()">Offers you sent</button>
        </nav>

        @if (view() === 'events') {
          @if (loading()) {
            <p class="muted">Loading…</p>
          } @else if (!services().length) {
            <div class="empty">
              <p>List a service first. You'll see events that need it here.</p>
              <app-button routerLink="/services/create">List a service</app-button>
            </div>
          } @else if (!leads().length) {
            <div class="empty">
              <p>No events near you are asking for offers right now. Check back soon, or share your QR card so customers find you.</p>
              <app-button variant="secondary" routerLink="/dashboard/my-services">My services</app-button>
            </div>
          }
          @for (lead of leads(); track lead._id) {
            <article class="lead">
              <div class="lead__main">
                <h2>{{ lead.title || eventTypeLabel(lead.eventType) }}</h2>
                <p class="lead__meta">
                  {{ lead.date | date:'EEE d MMM':'+0530' }}{{ lead.time ? ' · ' + formatTime(lead.time) : '' }}
                  · {{ lead.city }} · {{ lead.expectedGuests }} guests
                </p>
                <p class="lead__needs">
                  Looking for: {{ lead.needs.length ? needsLabel(lead.needs) : 'any services' }}
                </p>
                @if (lead.note) {
                  <p class="lead__note">"{{ lead.note }}"</p>
                }
                @for (o of lead.myOffers; track o._id) {
                  <p class="sent" [class.sent--ok]="o.status === 'accepted'">
                    You offered {{ serviceName(o.service) }} for ₹{{ o.price | number }} · {{ statusLabel(o.status) }}
                  </p>
                }
              </div>
              @if (offerable(lead).length) {
                <app-button size="sm" (onClick)="startOffer(lead)">Send offer</app-button>
              }
            </article>
          }
        } @else {
          @if (sent() === null) {
            <p class="muted">Loading…</p>
          } @else if (!sent()!.length) {
            <p class="empty">You haven't sent any offers yet.</p>
          }
          @for (o of sent() || []; track o._id) {
            <article class="lead">
              <div class="lead__main">
                <h2>{{ o.service?.serviceName }} · ₹{{ o.price | number }}</h2>
                <p class="lead__meta">
                  {{ eventTypeLabel(o.event?.eventType) }} · {{ o.event?.date | date:'EEE d MMM':'+0530' }} · {{ o.event?.city }}
                </p>
                <p class="sent" [class.sent--ok]="o.status === 'accepted'">{{ statusLabel(o.status) }}</p>
              </div>
              @if (o.status === 'accepted' && o.booking) {
                <app-button size="sm" variant="secondary" [routerLink]="['/bookings', o.booking]">Open booking</app-button>
              } @else if (o.status === 'pending') {
                <app-button size="sm" variant="ghost" (onClick)="withdraw(o)">Withdraw</app-button>
              }
            </article>
          }
        }
      </div>
    </main>

    <app-modal [isOpen]="!!offering()" title="Send an offer" (onClose)="offering.set(null)" [showFooter]="true">
      @if (offering(); as lead) {
        <p class="muted">
          {{ lead.title || eventTypeLabel(lead.eventType) }} · {{ lead.date | date:'EEE d MMM':'+0530' }} · {{ lead.expectedGuests }} guests.
          The organizer sees your service page, price and note.
        </p>
        <label class="field">Service
          <select id="offer-service" class="form-input" [(ngModel)]="serviceId" (ngModelChange)="suggestPrice(lead)">
            @for (s of offerable(lead); track s._id) {
              <option [value]="s._id">{{ s.serviceName }}</option>
            }
          </select>
        </label>
        <label class="field">Your price for this event (₹)
          <input id="offer-price" class="form-input" type="number" min="1" [(ngModel)]="price">
        </label>
        <label class="field">What you'll do
          <textarea id="offer-message" class="form-input" rows="4" maxlength="500" [(ngModel)]="message"
                    placeholder="e.g. 2 kg unicorn-theme cake, eggless, delivered by 5 pm"></textarea>
          <span class="hint">{{ message.trim().length }}/500 · at least 10 characters</span>
        </label>
      }
      <div modal-footer>
        <app-button variant="ghost" (onClick)="offering.set(null)">Cancel</app-button>
        <app-button [loading]="sending()" [disabled]="!serviceId || !(price > 0) || message.trim().length < 10" (onClick)="send()">Send offer</app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .leads-page { padding: $spacing-8 0; background: $bg-secondary; min-height: calc(100vh - #{$navbar-height}); }
    .container { max-width: 860px; margin: 0 auto; padding: 0 $spacing-4; }
    .head { margin-bottom: $spacing-5; h1 { font-size: $font-size-2xl; } p { margin: $spacing-1 0 0; color: $text-secondary; max-width: 60ch; } }

    .tabs { display: flex; gap: $spacing-2; margin-bottom: $spacing-4; flex-wrap: wrap;
      button { padding: $spacing-2 $spacing-4; border: 1px solid $border-light; border-radius: $radius-full; background: $bg-primary;
        font-size: $font-size-sm; cursor: pointer;
        &.active { background: $primary-600; border-color: $primary-600; color: #fff; } } }

    .lead { @include card; display: flex; gap: $spacing-4; align-items: flex-start; justify-content: space-between;
      padding: $spacing-4; margin-bottom: $spacing-3; flex-wrap: wrap; }
    .lead__main { flex: 1 1 320px; min-width: 0;
      h2 { font-size: $font-size-lg; margin: 0; }
      p { margin: $spacing-1 0 0; } }
    .lead__meta, .lead__needs { font-size: $font-size-sm; color: $text-secondary; }
    .lead__needs { color: $text-primary; }
    .lead__note { font-size: $font-size-sm; font-style: italic; overflow-wrap: anywhere; }
    .sent { font-size: $font-size-sm; color: $warning-dark; &--ok { color: $success-dark; } }

    .field { display: flex; flex-direction: column; gap: $spacing-1; margin-top: $spacing-3; font-size: $font-size-sm; font-weight: $font-weight-medium; }
    .hint { font-weight: $font-weight-regular; color: $text-secondary; font-size: $font-size-xs; }
    .muted { color: $text-secondary; font-size: $font-size-sm; }
    .empty { @include card; padding: $spacing-6; text-align: center; color: $text-secondary;
      p { margin: 0 0 $spacing-4; } }
  `]
})
export class FindEventsComponent implements OnInit {
  private offers = inject(OfferService);
  private toast = inject(ToastService);

  view = signal<'events' | 'sent'>('events');
  loading = signal(true);
  services = signal<LeadService[]>([]);
  leads = signal<Lead[]>([]);
  sent = signal<Offer[] | null>(null);
  offering = signal<Lead | null>(null);
  sending = signal(false);

  serviceId = '';
  price = 0;
  message = '';

  eventTypeLabel = eventTypeLabel;
  formatTime = formatTime;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.offers.getLeads().subscribe({
      next: ({ services, leads }) => {
        this.services.set(services);
        this.leads.set(leads);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  showSent(): void {
    this.view.set('sent');
    this.offers.getMine().subscribe(list => this.sent.set(list));
  }

  needsLabel(needs: string[]): string {
    return needs.map(categoryLabel).join(', ');
  }

  serviceName(id: string): string {
    return this.services().find(s => s._id === id)?.serviceName || 'your service';
  }

  statusLabel(status: OfferStatus): string {
    return STATUS[status];
  }

  // The vendor's services this event asks for and that haven't been offered yet
  offerable(lead: Lead): LeadService[] {
    const taken = new Set(lead.myOffers.filter(o => o.status === 'pending' || o.status === 'accepted').map(o => o.service));
    return this.services().filter(s => !taken.has(s._id) && (!lead.needs.length || lead.needs.includes(s.category)));
  }

  startOffer(lead: Lead): void {
    this.serviceId = this.offerable(lead)[0]?._id || '';
    this.message = '';
    this.suggestPrice(lead);
    this.offering.set(lead);
  }

  suggestPrice(lead: Lead): void {
    const s = this.services().find(x => x._id === this.serviceId);
    this.price = s ? s.basePrice * (s.priceUnit === 'per_person' ? lead.expectedGuests : 1) : 0;
  }

  send(): void {
    const lead = this.offering();
    if (!lead) return;
    this.sending.set(true);
    this.offers.send(lead._id, this.serviceId, Number(this.price), this.message.trim()).subscribe({
      next: () => {
        this.sending.set(false);
        this.offering.set(null);
        this.toast.success('Offer sent', "We'll let you know when the organizer answers.");
        this.load();
      },
      error: () => this.sending.set(false)
    });
  }

  withdraw(offer: Offer): void {
    this.offers.withdraw(offer._id).subscribe(() => {
      this.sent.update(list => (list || []).map(o => o._id === offer._id ? { ...o, status: 'withdrawn' } : o));
      this.load();
    });
  }
}
