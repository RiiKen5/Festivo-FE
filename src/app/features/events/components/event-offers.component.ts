import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastService } from '../../../core/services/toast.service';
import { Offer, OfferService, OfferSettings } from '../../../core/services/offer.service';
import { categoryLabel } from '../../../shared/components/listing-cards/listing-format';

const NEEDS = ['food', 'decor', 'photography', 'music', 'entertainment', 'venue', 'cleanup', 'other'];

/**
 * Organizer only: let vendors nearby find this event and send offers, then
 * accept one (it becomes a confirmed booking) or decline.
 */
@Component({
  selector: 'app-event-offers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent],
  template: `
    <section class="event-section offers" id="offers" aria-labelledby="offers-title">
      <h2 class="section-title" id="offers-title">Offers from vendors</h2>

      @if (settings(); as s) {
        @if (!s.open || editing()) {
          <p class="hint">
            Let vendors in {{ city }} send you their price for what you need. They see the type of event, the date,
            the city and the number of guests, never your name, address or phone.
          </p>
          <fieldset class="needs">
            <legend>What do you need?</legend>
            @for (n of needOptions; track n) {
              <label class="chip" [class.chip--on]="needs.has(n)">
                <input type="checkbox" [checked]="needs.has(n)" (change)="toggle(n)"> {{ label(n) }}
              </label>
            }
          </fieldset>
          <label class="note">Anything vendors should know? (optional)
            <input id="offers-note" class="form-input" maxlength="300" [(ngModel)]="note" placeholder="e.g. Unicorn theme, eggless only, budget around ₹3,000">
          </label>
          <div class="actions">
            <app-button size="sm" [loading]="saving()" [disabled]="!upcoming || needs.size === 0" (onClick)="save(true)">
              {{ s.open ? 'Save' : 'Ask vendors for offers' }}
            </app-button>
            @if (editing()) {
              <app-button size="sm" variant="ghost" (onClick)="editing.set(false)">Cancel</app-button>
            }
          </div>
          @if (!upcoming) {
            <p class="hint">Only upcoming events can get offers.</p>
          }
        } @else {
          <p class="status">
            Vendors can send offers for: <strong>{{ needsLabel(s.needs) }}</strong>
            @if (s.note) { <span class="hint"> · "{{ s.note }}"</span> }
          </p>
          <div class="actions">
            <app-button size="sm" variant="secondary" (onClick)="startEdit()">Change</app-button>
            <app-button size="sm" variant="ghost" [loading]="saving()" (onClick)="save(false)">Stop offers</app-button>
          </div>
        }

        @if (offers().length) {
          <ul class="offer-list">
            @for (o of offers(); track o._id) {
              <li class="offer" [class.offer--done]="o.status !== 'pending'">
                <div class="offer__main">
                  <a class="offer__name" [routerLink]="['/services', o.service?.slug]">{{ o.service?.serviceName }}</a>
                  @if (o.service?.isVerified) { <span class="badge">Verified</span> }
                  <div class="hint">
                    {{ label(o.service?.category || '') }}
                    @if (o.service?.totalRatings) { · ★ {{ o.service?.ratingAverage | number:'1.1-1' }} ({{ o.service?.totalRatings }}) }
                    @if (o.service?.noShowCount) { · {{ o.service?.noShowCount }} verified no-show(s) }
                  </div>
                  <p class="offer__msg">{{ o.message }}</p>
                </div>
                <div class="offer__side">
                  <strong class="offer__price">₹{{ o.price | number }}</strong>
                  @if (o.status === 'pending') {
                    <app-button size="sm" [loading]="busy() === o._id" (onClick)="accept(o)">Accept</app-button>
                    <app-button size="sm" variant="ghost" [disabled]="busy() === o._id" (onClick)="decline(o)">Decline</app-button>
                  } @else if (o.status === 'accepted') {
                    <a class="hint" [routerLink]="['/bookings', o.booking]">Accepted · open booking</a>
                  } @else {
                    <span class="hint">Declined</span>
                  }
                </div>
              </li>
            }
          </ul>
        } @else if (s.open) {
          <p class="hint">No offers yet. Vendors who offer what you need will appear here, and we'll notify you.</p>
        }
      }
    </section>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;
    .hint { color: $text-secondary; font-size: $font-size-sm; margin: 0 0 $spacing-3; }
    .status { margin: 0 0 $spacing-3; font-size: $font-size-sm; overflow-wrap: anywhere; }
    .needs { border: 0; padding: 0; margin: 0 0 $spacing-3; display: flex; flex-wrap: wrap; gap: $spacing-2;
      legend { font-size: $font-size-sm; font-weight: $font-weight-medium; margin-bottom: $spacing-2; } }
    .chip { display: inline-flex; align-items: center; gap: $spacing-1; padding: $spacing-1 $spacing-3; border: 1px solid $border-light;
      border-radius: $radius-full; font-size: $font-size-sm; cursor: pointer; background: $bg-primary;
      input { accent-color: $primary-600; }
      &--on { border-color: $primary-600; background: $primary-50; }
      &:focus-within { outline: 2px solid $primary-500; outline-offset: 2px; } }
    .note { display: flex; flex-direction: column; gap: $spacing-1; font-size: $font-size-sm; font-weight: $font-weight-medium; margin-bottom: $spacing-3; }
    .actions { display: flex; gap: $spacing-2; flex-wrap: wrap; margin-bottom: $spacing-3; }
    .offer-list { list-style: none; margin: $spacing-3 0 0; padding: 0; display: grid; gap: $spacing-3; }
    .offer { display: flex; gap: $spacing-4; justify-content: space-between; flex-wrap: wrap; padding: $spacing-3;
      border: 1px solid $border-light; border-radius: $radius-md; background: $bg-primary;
      &--done { opacity: 0.75; } }
    .offer__main { flex: 1 1 260px; min-width: 0; .hint { margin: 0; } }
    .offer__name { font-weight: $font-weight-semibold; color: $primary-700; }
    .offer__msg { margin: $spacing-2 0 0; font-size: $font-size-sm; overflow-wrap: anywhere; }
    .offer__side { display: flex; align-items: center; gap: $spacing-2; flex-wrap: wrap; }
    .offer__price { font-size: $font-size-lg; margin-right: $spacing-2; }
    .badge { margin-left: $spacing-2; padding: 1px $spacing-2; border-radius: $radius-full; background: $success-light; color: $success-dark; font-size: $font-size-xs; }
  `]
})
export class EventOffersComponent implements OnChanges {
  @Input({ required: true }) eventId!: string;
  @Input() city = '';
  @Input() upcoming = true;

  private offerService = inject(OfferService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly needOptions = NEEDS;
  settings = signal<OfferSettings | null>(null);
  offers = signal<Offer[]>([]);
  editing = signal(false);
  saving = signal(false);
  busy = signal<string | null>(null);
  needs = new Set<string>();
  note = '';

  label = categoryLabel;

  ngOnChanges(): void {
    if (this.eventId) this.load();
  }

  private load(): void {
    this.offerService.getForEvent(this.eventId).subscribe(({ settings, offers }) => {
      this.settings.set(settings || { open: false, needs: [] });
      this.offers.set(offers);
      this.needs = new Set(settings?.needs || []);
      this.note = settings?.note || '';
    });
  }

  needsLabel(needs: string[]): string {
    return needs.length ? needs.map(categoryLabel).join(', ') : 'any services';
  }

  toggle(need: string): void {
    this.needs.has(need) ? this.needs.delete(need) : this.needs.add(need);
  }

  startEdit(): void {
    const s = this.settings();
    this.needs = new Set(s?.needs || []);
    this.note = s?.note || '';
    this.editing.set(true);
  }

  save(open: boolean): void {
    this.saving.set(true);
    this.offerService.updateSettings(this.eventId, { open, needs: [...this.needs], note: this.note.trim() || undefined }).subscribe({
      next: settings => {
        this.saving.set(false);
        this.editing.set(false);
        this.settings.set(settings);
        this.toast.success(open ? 'Vendors can send offers' : 'Offers stopped',
          open ? "We'll notify you when an offer comes in." : 'Vendors no longer see this event.');
      },
      error: () => this.saving.set(false)
    });
  }

  accept(offer: Offer): void {
    if (!confirm(`Accept ${offer.service?.serviceName} for ₹${offer.price.toLocaleString('en-IN')}? It becomes a confirmed booking.`)) return;
    this.busy.set(offer._id);
    this.offerService.accept(offer._id).subscribe({
      next: ({ booking }) => {
        this.busy.set(null);
        this.toast.success('Offer accepted', 'Your booking is confirmed.');
        this.router.navigate(['/bookings', booking._id]);
      },
      error: () => this.busy.set(null)
    });
  }

  decline(offer: Offer): void {
    this.busy.set(offer._id);
    this.offerService.decline(offer._id).subscribe({
      next: () => {
        this.busy.set(null);
        this.offers.update(list => list.map(o => o._id === offer._id ? { ...o, status: 'declined' } : o));
      },
      error: () => this.busy.set(null)
    });
  }
}
