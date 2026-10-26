import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AvailabilityService, CalendarBooking, dayKey } from '../../../../core/services/availability.service';
import { ServiceService } from '../../../../core/services/service.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Service } from '../../../../core/models/service.model';
import { bookingStatusLabel } from '../../../../shared/components/listing-cards/listing-format';

interface Cell { key: string; date: number; inMonth: boolean; past: boolean; }

// Same defaults as the API: one event at a time for these, no limit for the rest
const ONE_A_DAY = ['decor', 'photography', 'music', 'entertainment', 'venue'];

/**
 * The vendor's month: bookings per day, and days they've blocked because
 * they're busy elsewhere. Blocked and full days can't be requested.
 */
@Component({
  selector: 'app-vendor-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, ButtonComponent],
  template: `
    <main class="cal-page">
      <div class="container">
        <header class="head">
          <div>
            <h1>My calendar</h1>
            <p>Block the days you're busy with other work. Customers can't request you on blocked days, or on days you're already fully booked.</p>
          </div>
        </header>

        <div class="layout">
          <section class="month" aria-labelledby="month-title">
            <div class="month__nav">
              <button type="button" class="nav-btn" (click)="shift(-1)" [disabled]="isCurrentMonth()" aria-label="Previous month">
                <app-icon name="arrow-left" [size]="18"></app-icon>
              </button>
              <h2 id="month-title">{{ monthLabel() }}</h2>
              <button type="button" class="nav-btn" (click)="shift(1)" aria-label="Next month">
                <app-icon name="arrow-right" [size]="18"></app-icon>
              </button>
            </div>

            <!-- Each day is a button with its full date in the label; the weekday row is visual only -->
            <div class="grid" role="group" [attr.aria-label]="monthLabel()">
              @for (d of weekdays; track d) { <span class="wd" aria-hidden="true">{{ d }}</span> }
              @for (c of cells(); track c.key) {
                <button type="button" class="day"
                        [class.day--out]="!c.inMonth" [class.day--past]="c.past" [class.day--blocked]="isBlocked(c.key)"
                        [class.day--sel]="selected() === c.key" [class.day--today]="c.key === today"
                        [attr.aria-pressed]="selected() === c.key" [attr.aria-current]="c.key === today ? 'date' : null" [attr.aria-label]="dayLabel(c)"
                        (click)="select(c)">
                  <span class="day__n">{{ c.date }}</span>
                  @if (isBlocked(c.key)) {
                    <span class="day__tag day__tag--blocked">Blocked</span>
                  } @else if (bookingsOn(c.key).length) {
                    <span class="day__tag" [class.day__tag--req]="!acceptedOn(c.key)">{{ countLabel(c.key) }}</span>
                  }
                </button>
              }
            </div>

            <ul class="legend" aria-label="Legend">
              <li><span class="sw sw--booked"></span>Booked</li>
              <li><span class="sw sw--req"></span>Requests only</li>
              <li><span class="sw sw--blocked"></span>Blocked by you</li>
            </ul>
          </section>

          <aside class="side">
            @if (selected(); as key) {
              <section class="panel" aria-live="polite">
                <h2>{{ longDate(key) }}</h2>
                @if (bookingsOn(key).length) {
                  <ul class="list">
                    @for (b of bookingsOn(key); track b._id) {
                      <li><a [routerLink]="['/bookings', b._id]">{{ b.service }}</a><span>{{ b.event }} · {{ statusLabel(b.status) }}</span></li>
                    }
                  </ul>
                } @else {
                  <p class="muted">No bookings on this day.</p>
                }
                @if (!isPast(key)) {
                  @if (isBlocked(key)) {
                    <app-button fullWidth variant="secondary" [loading]="saving()" (onClick)="toggle(key)">Unblock this day</app-button>
                  } @else {
                    <app-button fullWidth [loading]="saving()" (onClick)="toggle(key)">Block this day</app-button>
                    @if (bookingsOn(key).length) { <p class="muted small">Blocking doesn't cancel bookings you already have.</p> }
                  }
                }
              </section>
            } @else {
              <section class="panel"><p class="muted">Tap a day to see its bookings or block it.</p></section>
            }

            <section class="panel" aria-labelledby="cap-title">
              <h2 id="cap-title">Bookings per day</h2>
              <p class="muted small">Once a day has this many accepted bookings, it's shown as full and customers pick another date.</p>
              @for (s of services(); track s._id) {
                <label class="cap">
                  <span>{{ s.serviceName }}</span>
                  <select class="form-select" [ngModel]="capacityOf(s)" (ngModelChange)="setCapacity(s, $event)">
                    <option [ngValue]="1">1 a day</option>
                    <option [ngValue]="2">2 a day</option>
                    <option [ngValue]="3">3 a day</option>
                    <option [ngValue]="5">5 a day</option>
                    <option [ngValue]="10">10 a day</option>
                    <option [ngValue]="0">No limit</option>
                  </select>
                </label>
              } @empty {
                <p class="muted small">Add a service first. <a class="inline-link" routerLink="/services/create">List a service</a></p>
              }
            </section>
          </aside>
        </div>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .cal-page { padding: $spacing-8 0; background: $bg-secondary; min-height: calc(100vh - #{$navbar-height}); }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 $spacing-4; }
    .head { margin-bottom: $spacing-6; h1 { font-size: $font-size-2xl; } p { margin: $spacing-1 0 0; color: $text-secondary; max-width: 60ch; } }
    .layout { display: grid; gap: $spacing-5; @include lg { grid-template-columns: minmax(0, 1fr) 320px; align-items: start; } }

    .month { @include card; padding: $spacing-4; }
    .month__nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: $spacing-3;
      h2 { font-size: $font-size-lg; } }
    .nav-btn { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid $border-light; border-radius: $radius-default;
      background: $bg-primary; cursor: pointer; &:disabled { opacity: 0.4; cursor: default; } }

    .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
    .wd { padding: $spacing-1 0; text-align: center; font-size: $font-size-xs; font-weight: $font-weight-semibold; color: $text-secondary; }
    .day { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-height: 64px; padding: 6px; min-width: 0;
      border: 1px solid $border-light; border-radius: $radius-default; background: $bg-primary; text-align: left; cursor: pointer;
      &:hover { border-color: $primary-300; }
      &--out { background: $neutral-50; border-style: dashed; .day__n { color: $text-secondary; } }
      &--past { background: $neutral-50; .day__n { color: $text-secondary; } }
      &--today .day__n { color: $primary-700; font-weight: $font-weight-bold; }
      &--blocked { background: repeating-linear-gradient(135deg, $neutral-100, $neutral-100 6px, $bg-primary 6px, $bg-primary 12px); }
      &--sel { border-color: $primary-600; box-shadow: 0 0 0 2px rgba($primary-600, 0.25); }
      @include max-sm { min-height: 48px; padding: 4px; } }
    .day__n { font-size: $font-size-sm; }
    .day__tag { max-width: 100%; padding: 1px 6px; border-radius: $radius-full; background: $success-light; color: $success-dark;
      font-size: 11px; font-weight: $font-weight-medium; @include truncate;
      &--req { background: $warning-light; color: $warning-dark; }
      &--blocked { background: $neutral-200; color: $text-secondary; }
      @include max-sm { font-size: 0; width: 8px; height: 8px; padding: 0; } }

    .legend { display: flex; flex-wrap: wrap; gap: $spacing-4; margin: $spacing-3 0 0; padding: 0; list-style: none;
      li { display: inline-flex; align-items: center; gap: $spacing-2; font-size: $font-size-xs; color: $text-secondary; } }
    .sw { width: 12px; height: 12px; border-radius: 3px;
      &--booked { background: $success-light; border: 1px solid $success; }
      &--req { background: $warning-light; border: 1px solid $warning; }
      &--blocked { background: $neutral-200; border: 1px solid $neutral-300; } }

    .side { display: flex; flex-direction: column; gap: $spacing-4; }
    .panel { @include card; padding: $spacing-4; h2 { font-size: $font-size-base; margin-bottom: $spacing-3; } }
    .list { margin: 0 0 $spacing-4; padding: 0; list-style: none;
      li { display: flex; flex-direction: column; padding: $spacing-2 0; border-bottom: 1px solid $border-light; }
      a { font-weight: $font-weight-medium; } span { font-size: $font-size-xs; color: $text-secondary; } }
    .muted { margin: 0 0 $spacing-3; color: $text-secondary; }
    .small { font-size: $font-size-xs; }
    .inline-link { text-decoration: underline; }
    .cap { display: flex; align-items: center; justify-content: space-between; gap: $spacing-3; padding: $spacing-2 0;
      font-size: $font-size-sm; span { @include truncate; } select { width: 130px; flex-shrink: 0; } }
  `]
})
export class VendorCalendarComponent implements OnInit {
  private availability = inject(AvailabilityService);
  private serviceService = inject(ServiceService);
  private toast = inject(ToastService);

  readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly today = dayKey(new Date());

  month = signal(this.monthStart(new Date()));
  blocked = signal<Set<string>>(new Set());
  days = signal<Record<string, CalendarBooking[]>>({});
  services = signal<Service[]>([]);
  selected = signal<string | null>(null);
  saving = signal(false);

  monthLabel = computed(() => this.month().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));

  // Six weeks starting on the Monday on or before the 1st
  cells = computed<Cell[]>(() => {
    const first = this.month();
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = this.localKey(d);
      return { key, date: d.getDate(), inMonth: d.getMonth() === first.getMonth(), past: key < this.today };
    });
  });

  ngOnInit(): void {
    this.load();
    this.serviceService.getMyServices().subscribe({ next: res => this.services.set(res.data || []) });
  }

  shift(by: number): void {
    const m = new Date(this.month());
    m.setMonth(m.getMonth() + by);
    this.month.set(m);
    this.selected.set(null);
    this.load();
  }

  isCurrentMonth(): boolean {
    return this.localKey(this.month()).slice(0, 7) === this.today.slice(0, 7);
  }

  select(c: Cell): void {
    this.selected.set(c.key);
  }

  toggle(key: string): void {
    const unblock = this.isBlocked(key);
    this.saving.set(true);
    this.availability.updateMyCalendar(unblock ? { unblock: [key] } : { block: [key] }).subscribe({
      next: blocked => {
        this.blocked.set(new Set(blocked));
        this.saving.set(false);
        this.toast.success(unblock ? 'Day unblocked' : 'Day blocked', unblock ? 'Customers can request you on this day again.' : "Customers won't be able to request you on this day.");
      },
      error: err => {
        this.saving.set(false);
        this.toast.error('Could not update your calendar', err.error?.error?.message || 'Please try again.');
      }
    });
  }

  capacityOf(s: Service): number {
    return Number.isInteger(s.dailyCapacity) ? s.dailyCapacity! : (ONE_A_DAY.includes(s.category) ? 1 : 0);
  }

  setCapacity(s: Service, value: number): void {
    this.serviceService.updateService(s._id, { dailyCapacity: value }).subscribe({
      next: () => {
        this.services.update(list => list.map(x => x._id === s._id ? { ...x, dailyCapacity: value } : x));
        this.toast.success('Saved', value ? `${s.serviceName}: up to ${value} a day.` : `${s.serviceName}: no daily limit.`);
      },
      error: () => this.toast.error('Could not save', 'Please try again.')
    });
  }

  isBlocked(key: string): boolean { return this.blocked().has(key); }
  isPast(key: string): boolean { return key < this.today; }
  bookingsOn(key: string): CalendarBooking[] { return this.days()[key] || []; }
  acceptedOn(key: string): number { return this.bookingsOn(key).filter(b => b.status !== 'pending').length; }
  statusLabel(s: string): string { return bookingStatusLabel(s); }

  countLabel(key: string): string {
    const accepted = this.acceptedOn(key);
    const requests = this.bookingsOn(key).length - accepted;
    return accepted ? `${accepted} booked` : `${requests} request${requests > 1 ? 's' : ''}`;
  }

  dayLabel(c: Cell): string {
    const parts = [this.longDate(c.key)];
    if (this.isBlocked(c.key)) parts.push('blocked');
    if (this.bookingsOn(c.key).length) parts.push(this.countLabel(c.key));
    return parts.join(', ');
  }

  longDate(key: string): string {
    return new Date(`${key}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private load(): void {
    const cells = this.cells();
    this.availability.myCalendar(cells[0].key, cells[cells.length - 1].key).subscribe({
      next: cal => { this.blocked.set(new Set(cal.blocked)); this.days.set(cal.days); },
      error: () => this.toast.error('Could not load your calendar', 'Please refresh the page.')
    });
  }

  private monthStart(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private localKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
