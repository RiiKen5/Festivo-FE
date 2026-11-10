import { CitySelectComponent } from '../../../../shared/components/city-select/city-select.component';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { EventService } from '../../../../core/services/event.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { EventType, VibeScore } from '../../../../core/models/event.model';
import { CustomValidators } from '../../../../shared/validators/custom-validators';

interface Step { title: string; lead: string; fields: string[]; }

// One question per screen. Only what an event needs is asked up front;
// the rest is optional on the last step and can be added later.
const STEPS: Step[] = [
  { title: 'What are you celebrating?', lead: 'Pick the occasion and give it a name.', fields: ['eventType', 'title'] },
  { title: 'When and where?', lead: 'Vendors use this to check they are free and nearby.', fields: ['date', 'time', 'endDate', 'locationName', 'city', 'address'] },
  { title: "Who's coming?", lead: 'A rough guest count is fine. You can change it later.', fields: ['expectedGuests', 'maxAttendees', 'budget', 'entryFee'] },
  { title: 'Make it yours', lead: 'All optional. Add a photo and a few words for your guests.', fields: ['description'] }
];

const TYPE_DEFAULTS: Record<EventType, { placeholder: string; public: boolean }> = {
  birthday: { placeholder: 'e.g. Riya turns 5', public: false },
  house_party: { placeholder: 'e.g. Saturday night at ours', public: false },
  meetup: { placeholder: 'e.g. Pune founders meetup', public: true },
  wedding: { placeholder: "e.g. Aditi & Karan's wedding", public: false },
  corporate: { placeholder: 'e.g. Team offsite 2026', public: false },
  farewell: { placeholder: 'e.g. Farewell for Asha', public: false },
  other: { placeholder: 'e.g. Diwali get-together', public: false }
};

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CitySelectComponent, IconComponent, CommonModule, RouterModule, ReactiveFormsModule, ButtonComponent, InputComponent, ImageUploadComponent],
  template: `
    <main class="wizard">
      <header class="wizard__top">
        <div class="wizard__bar container">
          <a class="wizard__close" [routerLink]="isEditMode() ? ['/events', slug] : '/dashboard'" aria-label="Close without saving">
            <app-icon name="x" [size]="20"></app-icon>
          </a>
          <p class="wizard__count">{{ isEditMode() ? 'Edit event' : 'New event' }} · Step {{ step() + 1 }} of {{ steps.length }}</p>
          <span class="wizard__spacer"></span>
        </div>
        <div class="progress" role="progressbar" aria-label="Progress" [attr.aria-valuenow]="step() + 1" aria-valuemin="1" [attr.aria-valuemax]="steps.length">
          <span class="progress__fill" [style.width.%]="(step() + 1) / steps.length * 100"></span>
        </div>
      </header>

      <div class="wizard__body container">
        <form [formGroup]="form" (ngSubmit)="primary()" class="wizard__form" novalidate>
          @if (isEditMode()) {
            <nav class="jump" aria-label="Sections">
              @for (s of steps; track s.title; let i = $index) {
                <button type="button" class="jump__item" [class.jump__item--on]="step() === i" [attr.aria-current]="step() === i ? 'step' : null" (click)="go(i)">{{ s.title }}</button>
              }
            </nav>
          }

          <h1 class="wizard__title">{{ current().title }}</h1>
          <p class="wizard__lead">{{ current().lead }}</p>

          @switch (step()) {
            @case (0) {
              <section class="pane">
                <div class="types" role="radiogroup" aria-label="Occasion">
                  @for (type of eventTypes; track type.value) {
                    <label class="type-option" [class.type-option--selected]="form.get('eventType')?.value === type.value">
                      <input type="radio" formControlName="eventType" [value]="type.value" (change)="typeChanged()">
                      <span class="type-option__icon" aria-hidden="true"><app-icon [name]="type.icon" [size]="22"></app-icon></span>
                      <span class="type-option__label">{{ type.label }}</span>
                    </label>
                  }
                </div>
                <app-input
                  label="Name your event"
                  [placeholder]="titlePlaceholder()"
                  formControlName="title"
                  [error]="getError('title')"
                  required
                ></app-input>
              </section>
            }

            @case (1) {
              <section class="pane">
                <div class="row">
                  <app-input type="date" label="Date" formControlName="date" [error]="getError('date')" required></app-input>
                  <app-input type="time" label="Start time" formControlName="time" [error]="getError('time')" required></app-input>
                </div>
                @if (showEndDate() || form.get('endDate')?.value) {
                  <app-input type="date" label="Ends on (for events over several days)" formControlName="endDate" [error]="getError('endDate')"></app-input>
                } @else {
                  <button type="button" class="add-link" (click)="showEndDate.set(true)"><app-icon name="plus" [size]="16"></app-icon>Runs over several days?</button>
                }
                <app-input label="Venue" placeholder="e.g. Home, The Flour Works" formControlName="locationName" [error]="getError('locationName')" required></app-input>
                <app-city-select label="City" placeholder="Search city" formControlName="city" [error]="getError('city')" hint="We'll suggest vendors in this city" required></app-city-select>
                <app-input label="Address" placeholder="Street and area" formControlName="address" [error]="getError('address')" hint="Only shared with guests and vendors you book" required></app-input>
              </section>
            }

            @case (2) {
              <section class="pane">
                <div>
                  <app-input type="number" label="How many guests?" placeholder="e.g. 25" formControlName="expectedGuests" [error]="getError('expectedGuests')" required></app-input>
                  <div class="quick" aria-label="Quick pick">
                    @for (n of guestPresets; track n) {
                      <button type="button" class="quick__btn" [class.quick__btn--on]="+form.get('expectedGuests')?.value === n" (click)="form.patchValue({ expectedGuests: n })">{{ n }}</button>
                    }
                  </div>
                </div>

                <fieldset class="choices">
                  <legend>Who can see it?</legend>
                  <button type="button" class="choice" [class.choice--on]="!form.get('isPublic')?.value" [attr.aria-pressed]="!form.get('isPublic')?.value" (click)="setPublic(false)">
                    <app-icon name="link" [size]="20"></app-icon>
                    <span><strong>Invite only</strong><small>Only people with your link can see and RSVP</small></span>
                  </button>
                  <button type="button" class="choice" [class.choice--on]="form.get('isPublic')?.value" [attr.aria-pressed]="!!form.get('isPublic')?.value" (click)="setPublic(true)">
                    <app-icon name="users" [size]="20"></app-icon>
                    <span><strong>Public</strong><small>Listed on Yaay so anyone nearby can join</small></span>
                  </button>
                </fieldset>

                <fieldset class="choices">
                  <legend>Entry</legend>
                  <button type="button" class="choice" [class.choice--on]="!form.get('isPaid')?.value" [attr.aria-pressed]="!form.get('isPaid')?.value" (click)="form.patchValue({ isPaid: false })">
                    <app-icon name="gift" [size]="20"></app-icon>
                    <span><strong>Free</strong><small>Guests just RSVP</small></span>
                  </button>
                  <button type="button" class="choice" [class.choice--on]="form.get('isPaid')?.value" [attr.aria-pressed]="!!form.get('isPaid')?.value" (click)="form.patchValue({ isPaid: true })">
                    <app-icon name="ticket" [size]="20"></app-icon>
                    <span><strong>Sell tickets</strong><small>Guests pay online, you're paid after the event</small></span>
                  </button>
                </fieldset>

                @if (form.get('isPaid')?.value) {
                  <div class="paid">
                    <app-input type="number" label="Ticket price (₹)" placeholder="e.g. 499" formControlName="entryFee" [error]="getError('entryFee')"></app-input>
                    <fieldset class="fee-payer">
                      <legend>Yaay's {{ ticketFeePercent() }}% ticket fee</legend>
                      <label class="radio">
                        <input type="radio" formControlName="ticketFeePaidBy" value="host">
                        <span>I pay it. Guests pay ₹{{ entryFee() | number }}, you get ₹{{ hostGetsIfHostPays() | number:'1.0-2' }} a ticket.</span>
                      </label>
                      <label class="radio">
                        <input type="radio" formControlName="ticketFeePaidBy" value="guest">
                        <span>Guests pay it. Guests pay ₹{{ guestPaysIfGuestPays() | number:'1.0-2' }}, you get the full ₹{{ entryFee() | number }}.</span>
                      </label>
                    </fieldset>
                  </div>
                }

                @if (form.get('isPublic')?.value || form.get('isPaid')?.value) {
                  <app-input type="number" label="Limit spots (optional)" placeholder="No limit" formControlName="maxAttendees" [error]="getError('maxAttendees')"></app-input>
                }
                <app-input type="number" label="Budget for vendors (optional, ₹)" placeholder="e.g. 20000" formControlName="budget" [error]="getError('budget')" hint="Only you see this. It helps us suggest vendors that fit."></app-input>
              </section>
            }

            @case (3) {
              <section class="pane">
                <div class="cover">
                  @if (form.get('coverPhoto')?.value) {
                    <div class="cover__preview">
                      <img [src]="form.get('coverPhoto')?.value" alt="Event cover">
                      <button type="button" class="cover__remove" (click)="form.patchValue({ coverPhoto: '' })">Remove</button>
                    </div>
                  }
                  <app-image-upload
                    [label]="form.get('coverPhoto')?.value ? 'Replace photo' : 'Add a cover photo'"
                    (uploaded)="form.patchValue({ coverPhoto: $event })"
                  ></app-image-upload>
                </div>
                <div>
                  <label class="form-label" for="ev-desc">A note for your guests</label>
                  <textarea id="ev-desc" class="form-textarea" formControlName="description" rows="4" placeholder="What to expect, dress code, what to bring…"></textarea>
                  @if (getError('description')) {
                    <span class="form-error">{{ getError('description') }}</span>
                  }
                </div>
                <fieldset class="vibes">
                  <legend class="form-label">The mood</legend>
                  @for (vibe of vibeOptions; track vibe.value) {
                    <label class="vibe" [class.vibe--on]="form.get('vibeScore')?.value === vibe.value">
                      <input type="radio" formControlName="vibeScore" [value]="vibe.value">
                      <app-icon [name]="vibe.icon" [size]="16"></app-icon>{{ vibe.label }}
                    </label>
                  }
                </fieldset>
              </section>
            }
          }

          <div class="actions">
            <div class="actions__inner container">
              @if (step() > 0) {
                <app-button variant="ghost" (onClick)="back()" icon="arrow-left">Back</app-button>
              } @else {
                <span></span>
              }
              <div class="actions__main">
                @if (isEditMode()) {
                  @if (!isLast()) {
                    <app-button variant="secondary" (onClick)="next()">Next</app-button>
                  }
                  <app-button type="submit" [loading]="isSubmitting()">Save changes</app-button>
                } @else {
                  <app-button type="submit" [loading]="isSubmitting()" [icon]="isLast() ? undefined : 'arrow-right'" iconPosition="right">
                    {{ isLast() ? 'Create event' : 'Continue' }}
                  </app-button>
                }
              </div>
            </div>
          </div>
        </form>

        <!-- What guests will see, filled in as you go -->
        <aside class="preview" aria-hidden="true">
          <p class="preview__label">Preview</p>
          <div class="invite">
            <div class="invite__cover" [attr.data-type]="v().eventType">
              @if (v().coverPhoto) {
                <img [src]="v().coverPhoto" alt="">
              } @else {
                <app-icon [name]="typeIcon()" [size]="40"></app-icon>
              }
              <span class="invite__badge">{{ v().isPublic ? 'Public' : 'Invite only' }}</span>
            </div>
            <div class="invite__body">
              <p class="invite__kind">{{ typeLabel() }}</p>
              <h2 class="invite__title" [class.invite__title--empty]="!v().title">{{ v().title || 'Your event' }}</h2>
              <p class="invite__line"><app-icon name="calendar" [size]="16"></app-icon>{{ whenText() || 'Date and time' }}</p>
              <p class="invite__line"><app-icon name="map-pin" [size]="16"></app-icon>{{ whereText() || 'Venue' }}</p>
              <div class="invite__foot">
                <span>{{ v().expectedGuests ? v().expectedGuests + ' guests' : 'Guests' }}</span>
                <strong>{{ v().isPaid && entryFee() ? '₹' + (entryFee() | number) : 'Free' }}</strong>
              </div>
            </div>
          </div>
          @if (!isEditMode()) {
            <p class="preview__next">Next, we'll make you a checklist and suggest vendors in your city.</p>
          }
        </aside>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .wizard {
      min-height: calc(100vh - $navbar-height);
      background: $bg-primary;
      padding-bottom: calc(96px + var(--bottom-nav, 0px));
    }

    .wizard__top {
      position: sticky;
      top: $navbar-height;
      z-index: 5;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(8px);
    }

    .wizard__bar {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      height: 52px;
    }

    .wizard__close {
      display: inline-grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: $radius-full;
      color: $text-secondary;
      &:hover { background: $neutral-100; color: $text-primary; }
    }

    .wizard__count {
      margin: 0;
      flex: 1;
      text-align: center;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: $text-secondary;
    }

    .wizard__spacer { width: 36px; }

    .progress {
      height: 3px;
      background: $neutral-100;
    }

    .progress__fill {
      display: block;
      height: 100%;
      background: $primary-600;
      border-radius: 0 3px 3px 0;
      transition: width 0.35s cubic-bezier(.2, .8, .2, 1);
    }

    .wizard__body {
      display: grid;
      gap: $spacing-12;
      padding-top: $spacing-10;

      @include lg {
        grid-template-columns: minmax(0, 560px) 340px;
        justify-content: center;
        gap: $spacing-16;
        padding-top: $spacing-12;
      }
    }

    .wizard__form { min-width: 0; }

    .wizard__title {
      font-family: $font-family-display;
      font-size: 1.875rem;
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: $neutral-900;

      @include md { font-size: 2.25rem; }
    }

    .wizard__lead {
      margin: $spacing-2 0 $spacing-8;
      color: $text-secondary;
    }

    .pane {
      display: grid;
      gap: $spacing-6;
      animation: pane-in 0.35s cubic-bezier(.2, .8, .2, 1);
    }

    @keyframes pane-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }

    .row {
      display: grid;
      gap: $spacing-4;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }

    .jump {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
      margin-bottom: $spacing-8;
    }

    .jump__item {
      padding: 6px $spacing-3;
      border: 1px solid $border-default;
      border-radius: $radius-full;
      background: $bg-primary;
      font-size: $font-size-sm;
      color: $text-secondary;

      &--on { border-color: $primary-600; background: $primary-50; color: $primary-800; }
    }

    // Occasion tiles
    .types {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: $spacing-3;
    }

    .type-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-4 $spacing-2;
      border: 1.5px solid $border-light;
      border-radius: $radius-xl;
      cursor: pointer;
      text-align: center;
      transition: border-color $transition-fast, background-color $transition-fast, transform $transition-fast;

      input { @include visually-hidden; }

      &:hover { border-color: $primary-300; }
      &:active { transform: scale(0.97); }
      &:has(input:focus-visible) { box-shadow: $focus-ring; }

      &--selected {
        border-color: $primary-600;
        background: $primary-50;

        .type-option__icon { background: $primary-600; color: $text-inverse; }
      }
    }

    .type-option__icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: $radius-full;
      background: $neutral-100;
      color: $text-primary;
      transition: background-color $transition-fast, color $transition-fast;
    }

    .type-option__label {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }

    .add-link {
      display: inline-flex;
      align-items: center;
      gap: $spacing-1;
      justify-self: start;
      margin-top: -$spacing-3;
      color: $primary-700;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }

    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
      margin-top: $spacing-2;
    }

    .quick__btn {
      min-width: 52px;
      height: 34px;
      padding: 0 $spacing-3;
      border: 1px solid $border-default;
      border-radius: $radius-full;
      font-size: $font-size-sm;
      color: $text-secondary;

      &--on { border-color: $primary-600; background: $primary-50; color: $primary-800; }
    }

    .choices {
      display: grid;
      gap: $spacing-3;
      border: 0;
      padding: 0;

      @include sm { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }

      legend {
        @include form-label;
        float: left;
        width: 100%;
        grid-column: 1 / -1;
      }
    }

    .choice {
      display: flex;
      align-items: flex-start;
      gap: $spacing-3;
      padding: $spacing-4;
      border: 1.5px solid $border-light;
      border-radius: $radius-xl;
      background: $bg-primary;
      text-align: left;
      color: $text-secondary;
      transition: border-color $transition-fast, background-color $transition-fast;

      &:hover { border-color: $primary-300; }

      strong { display: block; color: $text-primary; font-size: $font-size-base; }
      small { display: block; margin-top: 2px; font-size: $font-size-sm; line-height: 1.4; }

      &--on {
        border-color: $primary-600;
        background: $primary-50;
        color: $primary-700;
      }
    }

    .paid {
      display: grid;
      gap: $spacing-4;
      padding: $spacing-4;
      border-radius: $radius-xl;
      background: $neutral-50;
    }

    .fee-payer {
      display: grid;
      gap: $spacing-2;
      border: 0;
      padding: 0;

      legend { @include form-label; }
    }

    .radio {
      display: flex;
      gap: $spacing-3;
      align-items: flex-start;
      font-size: $font-size-sm;
      cursor: pointer;

      input { margin-top: 3px; accent-color: $primary-600; }
    }

    .cover__preview {
      position: relative;
      margin-bottom: $spacing-3;

      img { width: 100%; max-height: 240px; object-fit: cover; border-radius: $radius-xl; }
    }

    .cover__remove {
      position: absolute;
      top: $spacing-2;
      right: $spacing-2;
      padding: $spacing-1 $spacing-3;
      border-radius: $radius-full;
      background: rgba(0, 0, 0, 0.6);
      color: $text-inverse;
    }

    .form-label { @include form-label; }
    .form-error { @include form-error; display: block; }

    .vibes {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
      border: 0;
      padding: 0;

      legend { width: 100%; }
    }

    .vibe {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 $spacing-3;
      border: 1px solid $border-default;
      border-radius: $radius-full;
      font-size: $font-size-sm;
      color: $text-secondary;
      cursor: pointer;

      input { @include visually-hidden; }
      &:has(input:focus-visible) { box-shadow: $focus-ring; }
      &--on { border-color: $primary-600; background: $primary-50; color: $primary-800; }
    }

    // Bottom action bar, above the phone navigation
    .actions {
      position: fixed;
      left: 0;
      right: 0;
      bottom: var(--bottom-nav, 0px);
      z-index: 6;
      border-top: 1px solid $border-light;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(8px);
    }

    .actions__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $spacing-3;
      height: 72px;
    }

    .actions__main {
      display: flex;
      gap: $spacing-2;
    }

    // Live preview
    .preview {
      display: none;

      @include lg {
        display: block;
        position: sticky;
        top: calc(#{$navbar-height} + 88px);
        align-self: start;
      }
    }

    .preview__label {
      margin: 0 0 $spacing-3;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: $text-tertiary;
    }

    .preview__next {
      margin: $spacing-4 0 0;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .invite {
      overflow: hidden;
      border: 1px solid $border-light;
      border-radius: $radius-2xl;
      background: $bg-primary;
      box-shadow: 0 24px 48px -24px rgba(85, 36, 58, 0.35);
    }

    .invite__cover {
      position: relative;
      display: grid;
      place-items: center;
      height: 170px;
      color: rgba(255, 255, 255, 0.95);
      background: linear-gradient(135deg, #bb5782, #6b2b46);

      &[data-type=birthday] { background: linear-gradient(135deg, #f59e0b, #db2777); }
      &[data-type=house_party] { background: linear-gradient(135deg, #8b5cf6, #db2777); }
      &[data-type=meetup] { background: linear-gradient(135deg, #0ea5e9, #6366f1); }
      &[data-type=wedding] { background: linear-gradient(135deg, #e11d48, #9f1239); }
      &[data-type=corporate] { background: linear-gradient(135deg, #334155, #0f172a); }
      &[data-type=farewell] { background: linear-gradient(135deg, #14b8a6, #0f766e); }

      img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    }

    .invite__badge {
      position: absolute;
      top: $spacing-3;
      left: $spacing-3;
      padding: 4px 10px;
      border-radius: $radius-full;
      background: rgba(255, 255, 255, 0.92);
      color: $text-primary;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
    }

    .invite__body { padding: $spacing-5; }

    .invite__kind {
      margin: 0;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: $primary-700;
    }

    .invite__title {
      margin: $spacing-1 0 $spacing-4;
      font-family: $font-family-display;
      font-size: $font-size-2xl;
      font-weight: 600;
      line-height: 1.2;
      overflow-wrap: anywhere;

      &--empty { color: $neutral-500; }
    }

    .invite__line {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      margin: 0 0 $spacing-2;
      font-size: $font-size-sm;
      color: $text-secondary;

      app-icon { color: $text-tertiary; }
    }

    .invite__foot {
      display: flex;
      justify-content: space-between;
      margin-top: $spacing-4;
      padding-top: $spacing-4;
      border-top: 1px solid $border-light;
      font-size: $font-size-sm;
      color: $text-secondary;

      strong { color: $text-primary; }
    }
  `]
})
export class EventCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private toast = inject(ToastService);
  private payments = inject(PaymentService);
  ticketFeePercent = signal(5);

  steps = STEPS;
  step = signal(0);
  current = computed(() => this.steps[this.step()]);
  isLast = computed(() => this.step() === this.steps.length - 1);
  showEndDate = signal(false);
  guestPresets = [10, 25, 50, 100, 200];

  isEditMode = signal(false);
  isSubmitting = signal(false);
  eventId = '';
  slug = '';
  // Visibility follows the occasion until the host picks it themselves
  private publicChosen = false;

  eventTypes = [
    { value: 'birthday' as EventType, label: 'Birthday', icon: 'cake' },
    { value: 'house_party' as EventType, label: 'House party', icon: 'home' },
    { value: 'wedding' as EventType, label: 'Wedding', icon: 'heart' },
    { value: 'meetup' as EventType, label: 'Meetup', icon: 'users' },
    { value: 'corporate' as EventType, label: 'Corporate', icon: 'briefcase' },
    { value: 'farewell' as EventType, label: 'Farewell', icon: 'gift' },
    { value: 'other' as EventType, label: 'Other', icon: 'party' }
  ];

  vibeOptions = [
    { value: 'chill' as VibeScore, label: 'Chill', icon: 'coffee' },
    { value: 'party' as VibeScore, label: 'Party', icon: 'party' },
    { value: 'networking' as VibeScore, label: 'Networking', icon: 'users' },
    { value: 'formal' as VibeScore, label: 'Formal', icon: 'briefcase' }
  ];

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), CustomValidators.noScript()]],
    eventType: ['birthday', Validators.required],
    description: ['', [Validators.maxLength(2000), CustomValidators.noScript()]],
    date: ['', [Validators.required, CustomValidators.dateFormat(), CustomValidators.futureDate()]],
    time: ['', [Validators.required, CustomValidators.timeFormat()]],
    endDate: ['', [CustomValidators.dateFormat()]],
    locationName: ['', [Validators.required, Validators.maxLength(100), CustomValidators.noScript()]],
    city: ['', [Validators.required, Validators.maxLength(50)]],
    address: ['', [Validators.required, Validators.maxLength(200), CustomValidators.noScript()]],
    expectedGuests: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
    maxAttendees: ['', [Validators.min(1), Validators.max(50000)]],
    budget: ['', [CustomValidators.positiveNumber(), CustomValidators.priceRange(0, 100000000)]],
    isPaid: [false],
    entryFee: [0, [CustomValidators.positiveNumber()]],
    ticketFeePaidBy: ['host'],
    vibeScore: ['party'],
    isPublic: [false],
    tags: ['', [Validators.maxLength(200)]],
    coverPhoto: ['']
  }, {
    validators: [
      CustomValidators.dateRange('date', 'endDate'),
      CustomValidators.maxGreaterThanExpected('expectedGuests', 'maxAttendees')
    ]
  });

  v = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  titlePlaceholder = computed(() => TYPE_DEFAULTS[this.v().eventType as EventType]?.placeholder || 'Give it a name');
  typeLabel = computed(() => this.eventTypes.find(t => t.value === this.v().eventType)?.label || 'Event');
  typeIcon = computed(() => this.eventTypes.find(t => t.value === this.v().eventType)?.icon || 'party');
  whenText = computed(() => {
    const { date, time } = this.v();
    if (!date) return '';
    const d = new Date(date + 'T' + (time || '00:00'));
    if (isNaN(d.getTime())) return '';
    const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return time ? `${day} · ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : day;
  });
  whereText = computed(() => [this.v().locationName, this.v().city].filter(Boolean).join(', '));

  entryFee(): number {
    return Number(this.form?.get('entryFee')?.value) || 0;
  }

  hostGetsIfHostPays(): number {
    return Math.round(this.entryFee() * (100 - this.ticketFeePercent())) / 100;
  }

  guestPaysIfGuestPays(): number {
    return Math.round(this.entryFee() * (100 + this.ticketFeePercent())) / 100;
  }

  ngOnInit(): void {
    this.payments.getConfig().subscribe(config => this.ticketFeePercent.set(config.ticketFeePercent));
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug && this.route.snapshot.url.some(s => s.path === 'edit')) {
      this.isEditMode.set(true);
      this.publicChosen = true;
      this.slug = slug;
      this.loadEvent(slug);
      return;
    }
    // Links like /events/create?type=wedding start on that occasion
    const type = this.route.snapshot.queryParamMap.get('type') as EventType | null;
    if (type && this.eventTypes.some(t => t.value === type)) this.form.patchValue({ eventType: type });
    this.typeChanged();
  }

  loadEvent(slug: string): void {
    this.eventService.getEventBySlug(slug).subscribe({
      next: (response) => {
        const event = response.data;
        this.eventId = event._id;
        this.form.patchValue({
          title: event.title,
          eventType: event.eventType,
          description: event.description,
          date: new Date(event.date).toISOString().split('T')[0],
          time: event.time,
          endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
          locationName: event.locationName,
          city: event.city,
          address: event.address,
          expectedGuests: event.expectedGuests,
          maxAttendees: event.maxAttendees || '',
          budget: event.budget || '',
          isPaid: event.isPaid,
          entryFee: event.entryFee || 0,
          ticketFeePaidBy: event.ticketFeePaidBy || 'host',
          vibeScore: event.vibeScore,
          isPublic: event.isPublic,
          coverPhoto: event.coverPhoto || '',
          tags: event.tags?.join(', ') || ''
        });
      }
    });
  }

  typeChanged(): void {
    if (this.publicChosen) return;
    const type = this.form.get('eventType')?.value as EventType;
    this.form.patchValue({ isPublic: TYPE_DEFAULTS[type]?.public ?? false });
  }

  setPublic(value: boolean): void {
    this.publicChosen = true;
    this.form.patchValue({ isPublic: value });
  }

  /** Marks this step's fields touched; true when they are all valid. */
  private stepValid(i = this.step()): boolean {
    const controls = this.steps[i].fields.map(f => this.form.get(f)!).filter(Boolean);
    controls.forEach(c => { c.markAsTouched(); c.updateValueAndValidity({ emitEvent: false }); });
    return controls.every(c => c.valid);
  }

  next(): void {
    if (!this.stepValid()) return;
    this.go(this.step() + 1);
  }

  back(): void {
    this.go(this.step() - 1);
  }

  go(i: number): void {
    if (i < 0 || i >= this.steps.length) return;
    this.step.set(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Enter key and the main button: next step, or save on the last one. */
  primary(): void {
    if (this.isEditMode() || this.isLast()) this.onSubmit();
    else this.next();
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['minlength']) return `At least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
      if (control.errors['min']) return `Must be at least ${control.errors['min'].min}`;
      if (control.errors['max']) return `Cannot be more than ${control.errors['max'].max}`;
      if (control.errors['pastDate']) return 'Pick a date from today on';
      if (control.errors['dateRange']) return 'End date must be after the start date';
      if (control.errors['invalidDateFormat']) return 'Use format YYYY-MM-DD';
      if (control.errors['invalidTime']) return 'Use format HH:MM (e.g., 14:30)';
      if (control.errors['positiveNumber']) return 'Must be a positive number';
      if (control.errors['minPrice']) return `Minimum is ₹${control.errors['minPrice'].min}`;
      if (control.errors['maxPrice']) return `Maximum is ₹${control.errors['maxPrice'].max}`;
      if (control.errors['maxLessThanExpected']) return 'Must be more than the number of guests';
      if (control.errors['scriptInjection']) return 'Invalid characters detected';
    }
    return '';
  }

  onSubmit(): void {
    // Send the host to the first step that still needs something
    const bad = this.steps.findIndex((_, i) => !this.stepValid(i));
    if (bad !== -1) { this.go(bad); return; }

    this.isSubmitting.set(true);
    const formData = this.prepareFormData();

    const request = this.isEditMode()
      ? this.eventService.updateEvent(this.eventId, formData)
      : this.eventService.createEvent(formData);

    request.subscribe({
      next: (response) => {
        this.toast.success(
          this.isEditMode() ? 'Event updated' : 'Event created',
          this.isEditMode() ? 'Your changes are saved.' : 'Your planning checklist is ready below.'
        );
        this.router.navigate(['/events', response.data.slug], this.isEditMode() ? {} : { queryParams: { new: 1 } });
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  private prepareFormData(): any {
    const values = this.form.value;
    const description = (values.description || '').trim() ||
      `${this.typeLabel()} at ${values.locationName}, ${values.city}.`;
    return {
      title: values.title,
      eventType: values.eventType,
      description,
      date: values.date,
      time: values.time,
      endDate: values.endDate || undefined,
      locationName: values.locationName,
      city: values.city,
      address: values.address,
      expectedGuests: Number(values.expectedGuests),
      maxAttendees: values.maxAttendees ? Number(values.maxAttendees) : undefined,
      budget: values.budget ? Number(values.budget) : undefined,
      isPaid: values.isPaid,
      entryFee: values.isPaid ? Number(values.entryFee) : 0,
      ticketFeePaidBy: values.ticketFeePaidBy,
      vibeScore: values.vibeScore,
      isPublic: values.isPublic,
      coverPhoto: values.coverPhoto || undefined,
      tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []
    };
  }
}
