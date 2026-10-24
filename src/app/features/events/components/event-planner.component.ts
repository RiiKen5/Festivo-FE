import { Component, EventEmitter, Input, OnChanges, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EventService } from '../../../core/services/event.service';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { EventPlan, PlanTask } from '../../../core/models/event-plan.model';
import { Booking } from '../../../core/models/booking.model';
import { Service, ServiceCategory } from '../../../core/models/service.model';
import { User } from '../../../core/models/user.model';

const CATEGORY_WORDS: Record<ServiceCategory, string> = {
  food: 'cake & food', decor: 'decorators', photography: 'photographers', music: 'music & DJs',
  cleanup: 'cleanup help', entertainment: 'entertainers', venue: 'venues', other: 'vendors'
};

const BOOKING_WORDS: Record<string, string> = {
  pending: 'Requested · waiting for reply', confirmed: 'Accepted', in_progress: 'Accepted',
  completed: 'Done', cancelled: 'Cancelled', refunded: 'Cancelled'
};

/**
 * The organizer's planning view: checklist with progress, and for each item
 * that needs a vendor either the booking made or vendors to request, so the
 * whole event can be planned from one screen.
 */
@Component({
  selector: 'app-event-planner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent],
  template: `
    <section class="planner" aria-labelledby="planner-title">
      <div class="planner__head">
        <div>
          <h2 id="planner-title">Plan your event</h2>
          <p class="planner__sub">
            @if (total()) { {{ doneCount() }} of {{ total() }} done } @else { Add the things you need to sort out }
          </p>
        </div>
        @if (total()) {
          <div class="ring" [style.--p]="percent()" role="img" [attr.aria-label]="percent() + '% done'"><span>{{ percent() }}%</span></div>
        }
      </div>

      @if (isNew) {
        <p class="planner__welcome">
          <app-icon name="sparkles" [size]="16"></app-icon>
          We've added a checklist for this event. Tick things off as you go, and request vendors right here.
        </p>
      }

      @if (loading()) {
        <p class="planner__muted">Loading your plan…</p>
      } @else {
        <ol class="items">
          @for (t of tasks(); track t._id) {
            <li class="item" [class.item--done]="isDone(t)">
              <button type="button" class="check" [class.check--on]="isDone(t)" (click)="toggle(t)"
                      [attr.aria-label]="(isDone(t) ? 'Mark not done: ' : 'Mark done: ') + t.taskName" [disabled]="!!bookingFor(t)">
                @if (isDone(t)) { <app-icon name="check" [size]="14"></app-icon> }
              </button>
              <div class="item__body">
                <div class="item__row">
                  <span class="item__name">{{ t.taskName }}</span>
                  @if (t.dueDate && !isDone(t)) {
                    <span class="item__due" [class.item__due--late]="isLate(t)">{{ isLate(t) ? 'Overdue · ' : 'By ' }}{{ t.dueDate | date:'d MMM' }}</span>
                  }
                  <span class="item__tools">
                    <button type="button" class="tool" (click)="edit.emit(t)" [attr.aria-label]="'Edit ' + t.taskName"><app-icon name="edit" [size]="14"></app-icon></button>
                    <button type="button" class="tool" (click)="remove(t)" [attr.aria-label]="'Remove ' + t.taskName"><app-icon name="trash" [size]="14"></app-icon></button>
                  </span>
                </div>

                @if (bookingFor(t); as b) {
                  <a class="booked" [class.booked--wait]="b.status === 'pending' || bookingWords(b).includes('due')" [routerLink]="['/bookings', b._id]">
                    <app-icon name="store" [size]="14"></app-icon>
                    {{ vendorName(b) }} · {{ bookingWords(b) }}
                  </a>
                } @else if (t.serviceCategory && !isDone(t)) {
                  @if (suggestionsFor(t).length) {
                    <div class="picks" role="list" [attr.aria-label]="'Suggested ' + words(t.serviceCategory)">
                      @for (s of suggestionsFor(t); track s._id) {
                        <div class="pick" role="listitem">
                          <span class="pick__name">{{ s.serviceName }}@if (s.isVerified) {<app-icon name="shield-check" [size]="13" class="pick__ok" aria-label="Verified"></app-icon>}</span>
                          <span class="pick__meta">
                            from ₹{{ s.basePrice | number }}
                            @if (s.totalRatings) { · ★ {{ s.ratingAverage | number:'1.1-1' }} }
                          </span>
                          <a class="pick__go" [routerLink]="['/services', s.slug]" [queryParams]="{ event: eventId }">Request</a>
                        </div>
                      }
                    </div>
                    <a class="more" routerLink="/services" [queryParams]="{ category: t.serviceCategory, city: city }">See all {{ words(t.serviceCategory) }} in {{ city }}</a>
                  } @else {
                    <a class="more" routerLink="/services" [queryParams]="{ category: t.serviceCategory }">No {{ words(t.serviceCategory) }} listed in {{ city }} yet · browse all</a>
                  }
                }
              </div>
            </li>
          }
        </ol>

        <form class="add" (submit)="$event.preventDefault(); add()">
          <label class="visually-hidden" for="planner-add">Add a checklist item</label>
          <input id="planner-add" type="text" [(ngModel)]="newItem" name="newItem" maxlength="200" placeholder="Add something to your checklist…">
          <button type="submit" [disabled]="!newItem.trim() || adding()">Add</button>
        </form>
      }
    </section>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .planner { @include card; padding: $spacing-5; }
    .planner__head { display: flex; justify-content: space-between; align-items: center; gap: $spacing-4;
      h2 { font-size: $font-size-xl; } }
    .planner__sub, .planner__muted { margin: 2px 0 0; color: $text-secondary; font-size: $font-size-sm; }
    .planner__welcome { display: flex; gap: $spacing-2; align-items: flex-start; margin: $spacing-4 0 0; padding: $spacing-3;
      border-radius: $radius-default; background: $primary-50; color: $primary-800; font-size: $font-size-sm; }

    .ring { --p: 0; flex-shrink: 0; width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center;
      background: conic-gradient($primary-600 calc(var(--p) * 1%), $neutral-200 0);
      span { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: $bg-primary;
        font-size: $font-size-xs; font-weight: $font-weight-semibold; } }

    .items { list-style: none; margin: $spacing-4 0 0; padding: 0; }
    .item { display: flex; gap: $spacing-3; padding: $spacing-3 0; border-top: 1px solid $border-light;
      &--done .item__name { color: $text-muted; text-decoration: line-through; } }
    .check { flex-shrink: 0; width: 22px; height: 22px; margin-top: 1px; border: 2px solid $neutral-300; border-radius: 6px;
      background: $bg-primary; color: $text-inverse; display: grid; place-items: center; cursor: pointer;
      &--on { background: $success; border-color: $success; }
      &:disabled { cursor: default; } }
    .item__body { flex: 1; min-width: 0; }
    .item__row { display: flex; flex-wrap: wrap; align-items: center; gap: $spacing-1 $spacing-3; }
    .item__name { font-weight: $font-weight-medium; }
    .item__due { font-size: $font-size-xs; color: $text-secondary; &--late { color: $error-dark; font-weight: $font-weight-semibold; } }
    .item__tools { margin-left: auto; display: flex; gap: 2px; }
    .tool { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: $radius-sm; background: none;
      color: $text-muted; cursor: pointer; &:hover { background: $neutral-100; color: $text-primary; } }

    .booked { display: inline-flex; align-items: center; gap: $spacing-1; margin-top: $spacing-2; padding: 2px $spacing-2;
      border-radius: $radius-full; background: $success-light; color: $success-dark; font-size: $font-size-xs; font-weight: $font-weight-medium;
      &--wait { background: $warning-light; color: $warning-dark; } }

    .picks { display: grid; gap: $spacing-2; margin-top: $spacing-2; grid-template-columns: 1fr;
      @include sm { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); } }
    .pick { display: flex; flex-direction: column; gap: 2px; padding: $spacing-2 $spacing-3; border: 1px solid $border-light;
      border-radius: $radius-default; font-size: $font-size-sm; }
    .pick__name { display: flex; align-items: center; gap: 4px; font-weight: $font-weight-medium; @include truncate; }
    .pick__ok { color: $primary-600; flex-shrink: 0; }
    .pick__meta { color: $text-secondary; font-size: $font-size-xs; }
    .pick__go { margin-top: 2px; font-weight: $font-weight-semibold; }
    .more { display: inline-block; margin-top: $spacing-2; font-size: $font-size-xs; font-weight: $font-weight-medium; }

    .add { display: flex; gap: $spacing-2; margin-top: $spacing-3; padding-top: $spacing-3; border-top: 1px solid $border-light;
      input { flex: 1; min-width: 0; @include input-base; @include input-sm; }
      button { padding: 0 $spacing-4; border: 0; border-radius: $radius-default; background: $neutral-100; font-weight: $font-weight-semibold;
        cursor: pointer; &:disabled { color: $text-muted; cursor: default; } } }
  `]
})
export class EventPlannerComponent implements OnChanges {
  @Input({ required: true }) eventId!: string;
  @Input() city = '';
  /** Just created: explain the checklist once. */
  @Input() isNew = false;
  @Output() edit = new EventEmitter<PlanTask>();

  private eventService = inject(EventService);
  private taskService = inject(TaskService);
  private toast = inject(ToastService);

  loading = signal(true);
  adding = signal(false);
  plan = signal<EventPlan>({ tasks: [], bookings: [], suggestions: {} });
  newItem = '';

  tasks = computed(() => this.plan().tasks);
  total = computed(() => this.tasks().length);
  doneCount = computed(() => this.tasks().filter(t => this.isDone(t)).length);
  percent = computed(() => this.total() ? Math.round(this.doneCount() / this.total() * 100) : 0);

  ngOnChanges(): void {
    if (this.eventId) this.reload();
  }

  reload(): void {
    this.eventService.getPlan(this.eventId).subscribe({
      next: res => { this.plan.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  // A live booking for the item's vendor category counts as done
  bookingFor(t: PlanTask): Booking | null {
    if (!t.serviceCategory) return null;
    return this.plan().bookings.find(b =>
      (b.service as Service)?.category === t.serviceCategory && !['cancelled', 'refunded'].includes(b.status)) || null;
  }

  isDone(t: PlanTask): boolean {
    const b = this.bookingFor(t);
    return t.status === 'done' || (!!b && b.status !== 'pending');
  }

  isLate(t: PlanTask): boolean {
    return !!t.dueDate && new Date(t.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  suggestionsFor(t: PlanTask): Service[] {
    return (t.serviceCategory && this.plan().suggestions[t.serviceCategory]) || [];
  }

  words(c: ServiceCategory): string {
    return CATEGORY_WORDS[c] || 'vendors';
  }

  bookingWords(b: Booking): string {
    if ((b.status === 'confirmed' || b.status === 'in_progress') && b.pricePaid < b.priceAgreed) return 'Accepted · payment due';
    return BOOKING_WORDS[b.status] || b.status;
  }

  vendorName(b: Booking): string {
    return (b.vendor as User)?.name || (b.service as Service)?.serviceName || 'Vendor';
  }

  toggle(t: PlanTask): void {
    const status = t.status === 'done' ? 'pending' : 'done';
    this.patch(t._id, { status });
    this.taskService.updateTaskStatus(t._id, status).subscribe({
      error: () => { this.patch(t._id, { status: t.status }); this.toast.error('Could not update', 'Please try again.'); }
    });
  }

  add(): void {
    const name = this.newItem.trim();
    if (!name) return;
    this.adding.set(true);
    this.taskService.createTask({ eventId: this.eventId, taskName: name, category: 'other' }).subscribe({
      next: res => {
        this.plan.update(p => ({ ...p, tasks: [...p.tasks, res.data as PlanTask] }));
        this.newItem = '';
        this.adding.set(false);
      },
      error: () => { this.adding.set(false); this.toast.error('Could not add', 'Please try again.'); }
    });
  }

  remove(t: PlanTask): void {
    if (!confirm(`Remove "${t.taskName}" from your checklist?`)) return;
    this.taskService.deleteTask(t._id).subscribe({
      next: () => this.plan.update(p => ({ ...p, tasks: p.tasks.filter(x => x._id !== t._id) })),
      error: () => this.toast.error('Could not remove', 'Please try again.')
    });
  }

  private patch(id: string, change: Partial<PlanTask>): void {
    this.plan.update(p => ({ ...p, tasks: p.tasks.map(x => x._id === id ? { ...x, ...change } : x) }));
  }
}
