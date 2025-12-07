import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { EventService } from '../../../../core/services/event.service';
import { ToastService } from '../../../../core/services/toast.service';
import { EventType, VibeScore } from '../../../../core/models/event.model';
import { CustomValidators } from '../../../../shared/validators/custom-validators';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NavbarComponent, ButtonComponent, InputComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="create-event">
      <div class="container">
        <div class="create-header">
          <h1>{{ isEditMode() ? 'Edit Event' : 'Create New Event' }}</h1>
          <p>{{ isEditMode() ? 'Update your event details' : 'Fill in the details to create your event' }}</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="create-form">
          <!-- Step 1: Basic Info -->
          <section class="form-section">
            <h2 class="section-title">
              <span class="step-number">1</span>
              Basic Information
            </h2>

            <div class="form-grid">
              <div class="form-group form-group--full">
                <app-input
                  label="Event Title"
                  placeholder="Give your event a catchy name"
                  formControlName="title"
                  [error]="getError('title')"
                  required
                ></app-input>
              </div>

              <div class="form-group">
                <label class="form-label">Event Type</label>
                <div class="type-grid">
                  @for (type of eventTypes; track type.value) {
                    <label
                      class="type-option"
                      [class.type-option--selected]="form.get('eventType')?.value === type.value"
                    >
                      <input type="radio" formControlName="eventType" [value]="type.value">
                      <span class="type-icon">{{ type.icon }}</span>
                      <span class="type-label">{{ type.label }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="form-group form-group--full">
                <label class="form-label">Description</label>
                <textarea
                  class="form-textarea"
                  formControlName="description"
                  placeholder="Tell people what your event is about..."
                  rows="5"
                ></textarea>
                @if (getError('description')) {
                  <span class="form-error">{{ getError('description') }}</span>
                }
              </div>
            </div>
          </section>

          <!-- Step 2: Date & Time -->
          <section class="form-section">
            <h2 class="section-title">
              <span class="step-number">2</span>
              Date & Time
            </h2>

            <div class="form-grid">
              <div class="form-group">
                <app-input
                  type="text"
                  label="Date"
                  placeholder="YYYY-MM-DD"
                  formControlName="date"
                  [error]="getError('date')"
                  required
                ></app-input>
              </div>

              <div class="form-group">
                <app-input
                  type="text"
                  label="Time"
                  placeholder="HH:MM"
                  formControlName="time"
                  [error]="getError('time')"
                  required
                ></app-input>
              </div>

              <div class="form-group">
                <app-input
                  type="text"
                  label="End Date (Optional)"
                  placeholder="YYYY-MM-DD"
                  formControlName="endDate"
                ></app-input>
              </div>
            </div>
          </section>

          <!-- Step 3: Location -->
          <section class="form-section">
            <h2 class="section-title">
              <span class="step-number">3</span>
              Location
            </h2>

            <div class="form-grid">
              <div class="form-group">
                <app-input
                  label="Venue Name"
                  placeholder="e.g., My House, Sunset Lounge"
                  formControlName="locationName"
                  [error]="getError('locationName')"
                  required
                ></app-input>
              </div>

              <div class="form-group">
                <app-input
                  label="City"
                  placeholder="e.g., Mumbai"
                  formControlName="city"
                  [error]="getError('city')"
                  required
                ></app-input>
              </div>

              <div class="form-group form-group--full">
                <app-input
                  label="Address"
                  placeholder="Full address of the venue"
                  formControlName="address"
                  [error]="getError('address')"
                  required
                ></app-input>
              </div>
            </div>
          </section>

          <!-- Step 4: Capacity & Pricing -->
          <section class="form-section">
            <h2 class="section-title">
              <span class="step-number">4</span>
              Capacity & Pricing
            </h2>

            <div class="form-grid">
              <div class="form-group">
                <app-input
                  type="number"
                  label="Expected Guests"
                  placeholder="e.g., 50"
                  formControlName="expectedGuests"
                  [error]="getError('expectedGuests')"
                  required
                ></app-input>
              </div>

              <div class="form-group">
                <app-input
                  type="number"
                  label="Max Capacity (Optional)"
                  placeholder="Leave empty for unlimited"
                  formControlName="maxAttendees"
                ></app-input>
              </div>

              <div class="form-group">
                <app-input
                  type="number"
                  label="Budget (INR)"
                  placeholder="e.g., 50000"
                  formControlName="budget"
                ></app-input>
              </div>
            </div>

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" formControlName="isPaid">
                <span>This is a paid event</span>
              </label>
            </div>

            @if (form.get('isPaid')?.value) {
              <div class="form-group" style="max-width: 200px;">
                <app-input
                  type="number"
                  label="Entry Fee (INR)"
                  placeholder="e.g., 500"
                  formControlName="entryFee"
                ></app-input>
              </div>
            }
          </section>

          <!-- Step 5: Settings -->
          <section class="form-section">
            <h2 class="section-title">
              <span class="step-number">5</span>
              Event Settings
            </h2>

            <div class="form-group">
              <label class="form-label">Event Vibe</label>
              <div class="vibe-grid">
                @for (vibe of vibeOptions; track vibe.value) {
                  <label
                    class="vibe-option"
                    [class.vibe-option--selected]="form.get('vibeScore')?.value === vibe.value"
                  >
                    <input type="radio" formControlName="vibeScore" [value]="vibe.value">
                    <span class="vibe-icon">{{ vibe.icon }}</span>
                    <span class="vibe-label">{{ vibe.label }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" formControlName="isPublic">
                <span>Make this event public (visible to everyone)</span>
              </label>
            </div>

            <div class="form-group">
              <app-input
                label="Tags (comma separated)"
                placeholder="e.g., music, outdoor, networking"
                formControlName="tags"
              ></app-input>
            </div>
          </section>

          <!-- Actions -->
          <div class="form-actions">
            <app-button variant="ghost" type="button" routerLink="/dashboard/events">
              Cancel
            </app-button>
            <div class="action-buttons">
              <app-button
                variant="secondary"
                type="button"
                (onClick)="saveDraft()"
                [loading]="isSavingDraft()"
              >
                Save Draft
              </app-button>
              <app-button
                type="submit"
                [loading]="isSubmitting()"
                [disabled]="form.invalid"
              >
                {{ isEditMode() ? 'Update Event' : 'Create Event' }}
              </app-button>
            </div>
          </div>
        </form>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .create-event {
      min-height: calc(100vh - $navbar-height);
      background: $bg-secondary;
      padding: $spacing-8 0;
    }

    .create-header {
      margin-bottom: $spacing-8;

      h1 {
        @include heading-2;
        margin-bottom: $spacing-2;
      }

      p {
        color: $text-secondary;
      }
    }

    .create-form {
      max-width: 800px;
    }

    .form-section {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
      margin-bottom: $spacing-6;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-6;
      padding-bottom: $spacing-4;
      border-bottom: 1px solid $border-light;
    }

    .step-number {
      @include flex-center;
      width: 32px;
      height: 32px;
      background: $bg-gradient-primary;
      color: $text-inverse;
      border-radius: $radius-full;
      font-size: $font-size-sm;
      font-weight: $font-weight-bold;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-5;

      @include md {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .form-group {
      &--full {
        grid-column: 1 / -1;
      }
    }

    .form-label {
      @include form-label;
    }

    .form-textarea {
      @include input-base;
      padding: $spacing-4;
      resize: vertical;
      min-height: 120px;
    }

    .form-error {
      @include form-error;
    }

    .type-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-3;

      @include sm {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .type-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-4;
      border: 2px solid $border-light;
      border-radius: $radius-lg;
      cursor: pointer;
      transition: all $transition-fast;
      text-align: center;

      input { display: none; }

      &:hover {
        border-color: $primary-300;
        background: $primary-50;
      }

      &--selected {
        border-color: $primary-600;
        background: $primary-50;
      }
    }

    .type-icon {
      font-size: 1.5rem;
      margin-bottom: $spacing-2;
    }

    .type-label {
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }

    .vibe-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-3;

      @include sm {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .vibe-option {
      @extend .type-option;
    }

    .vibe-icon {
      @extend .type-icon;
    }

    .vibe-label {
      @extend .type-label;
    }

    .form-checkbox {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      cursor: pointer;

      input {
        width: 18px;
        height: 18px;
        accent-color: $primary-600;
      }

      span {
        font-size: $font-size-sm;
      }
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: $spacing-6;
    }

    .action-buttons {
      display: flex;
      gap: $spacing-3;
    }
  `]
})
export class EventCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private toast = inject(ToastService);

  isEditMode = signal(false);
  isSubmitting = signal(false);
  isSavingDraft = signal(false);
  eventId = '';

  eventTypes = [
    { value: 'birthday' as EventType, label: 'Birthday', icon: '🎂' },
    { value: 'house_party' as EventType, label: 'House Party', icon: '🏠' },
    { value: 'meetup' as EventType, label: 'Meetup', icon: '🤝' },
    { value: 'wedding' as EventType, label: 'Wedding', icon: '💒' },
    { value: 'corporate' as EventType, label: 'Corporate', icon: '💼' },
    { value: 'farewell' as EventType, label: 'Farewell', icon: '👋' },
    { value: 'other' as EventType, label: 'Other', icon: '🎉' }
  ];

  vibeOptions = [
    { value: 'chill' as VibeScore, label: 'Chill', icon: '😌' },
    { value: 'party' as VibeScore, label: 'Party', icon: '🎉' },
    { value: 'networking' as VibeScore, label: 'Networking', icon: '🤝' },
    { value: 'formal' as VibeScore, label: 'Formal', icon: '👔' }
  ];

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100), CustomValidators.noScript()]],
    eventType: ['house_party', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000), CustomValidators.noScript()]],
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
    vibeScore: ['party'],
    isPublic: [true],
    tags: ['', [Validators.maxLength(200)]]
  }, {
    validators: [
      CustomValidators.dateRange('date', 'endDate'),
      CustomValidators.maxGreaterThanExpected('expectedGuests', 'maxAttendees')
    ]
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug && this.route.snapshot.url.some(s => s.path === 'edit')) {
      this.isEditMode.set(true);
      this.loadEvent(slug);
    }
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
          vibeScore: event.vibeScore,
          isPublic: event.isPublic,
          tags: event.tags?.join(', ') || ''
        });
      }
    });
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
      if (control.errors['min']) return `Value must be at least ${control.errors['min'].min}`;
      if (control.errors['max']) return `Value cannot exceed ${control.errors['max'].max}`;
      if (control.errors['pastDate']) return 'Date cannot be in the past';
      if (control.errors['dateRange']) return 'End date must be after start date';
      if (control.errors['invalidDateFormat']) return 'Use format YYYY-MM-DD';
      if (control.errors['invalidTime']) return 'Use format HH:MM (e.g., 14:30)';
      if (control.errors['positiveNumber']) return 'Must be a positive number';
      if (control.errors['minPrice']) return `Minimum price is ₹${control.errors['minPrice'].min}`;
      if (control.errors['maxPrice']) return `Maximum price is ₹${control.errors['maxPrice'].max}`;
      if (control.errors['maxLessThanExpected']) return 'Max capacity must be greater than expected guests';
      if (control.errors['scriptInjection']) return 'Invalid characters detected';
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formData = this.prepareFormData();

    const request = this.isEditMode()
      ? this.eventService.updateEvent(this.eventId, formData)
      : this.eventService.createEvent(formData);

    request.subscribe({
      next: (response) => {
        this.toast.success(
          this.isEditMode() ? 'Event Updated!' : 'Event Created!',
          this.isEditMode() ? 'Your event has been updated successfully.' : 'Your event has been created successfully.'
        );
        this.router.navigate(['/events', response.data.slug]);
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  saveDraft(): void {
    this.isSavingDraft.set(true);
    const formData = this.prepareFormData();

    this.eventService.createEvent(formData).subscribe({
      next: (response) => {
        this.toast.success('Draft Saved!', 'Your event has been saved as a draft.');
        this.router.navigate(['/dashboard/events']);
      },
      error: () => {
        this.isSavingDraft.set(false);
      }
    });
  }

  private prepareFormData(): any {
    const values = this.form.value;
    return {
      title: values.title,
      eventType: values.eventType,
      description: values.description,
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
      vibeScore: values.vibeScore,
      isPublic: values.isPublic,
      tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []
    };
  }
}
