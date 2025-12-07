import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ServiceService } from '../../../../core/services/service.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ServiceCategory, PriceUnit, ServiceCreateData } from '../../../../core/models/service.model';
import { CustomValidators } from '../../../../shared/validators/custom-validators';

@Component({
  selector: 'app-service-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NavbarComponent,
    ButtonComponent,
    InputComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <main class="service-create-page">
      <div class="container">
        <div class="page-header">
          <button class="back-btn" routerLink="/dashboard/my-services">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to My Services
          </button>
          <h1>{{ isEditMode() ? 'Edit Service' : 'Create New Service' }}</h1>
          <p>{{ isEditMode() ? 'Update your service details' : 'Add a new service to your portfolio' }}</p>
        </div>

        <form [formGroup]="serviceForm" (ngSubmit)="onSubmit()" class="service-form">
          <!-- Basic Info Section -->
          <section class="form-section">
            <h2>Basic Information</h2>

            <div class="form-group">
              <app-input
                label="Service Name"
                formControlName="serviceName"
                placeholder="e.g., Premium Catering Services"
                [error]="getError('serviceName')"
              ></app-input>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category <span class="required">*</span></label>
                <select class="form-select" formControlName="category">
                  <option value="">Select a category</option>
                  @for (cat of categories; track cat.value) {
                    <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                  }
                </select>
                @if (getError('category')) {
                  <span class="error-text">{{ getError('category') }}</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label">Business Name (Optional)</label>
                <input
                  type="text"
                  class="form-input"
                  formControlName="businessName"
                  placeholder="Your business name"
                >
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description <span class="required">*</span></label>
              <textarea
                class="form-textarea"
                formControlName="description"
                placeholder="Describe your service in detail..."
                rows="5"
              ></textarea>
              @if (getError('description')) {
                <span class="error-text">{{ getError('description') }}</span>
              }
            </div>
          </section>

          <!-- Pricing Section -->
          <section class="form-section">
            <h2>Pricing</h2>

            <div class="form-row">
              <div class="form-group">
                <app-input
                  type="number"
                  label="Base Price"
                  formControlName="basePrice"
                  placeholder="Enter amount"
                  [error]="getError('basePrice')"
                ></app-input>
              </div>

              <div class="form-group">
                <label class="form-label">Price Unit <span class="required">*</span></label>
                <select class="form-select" formControlName="priceUnit">
                  <option value="">Select unit</option>
                  @for (unit of priceUnits; track unit.value) {
                    <option [value]="unit.value">{{ unit.label }}</option>
                  }
                </select>
                @if (getError('priceUnit')) {
                  <span class="error-text">{{ getError('priceUnit') }}</span>
                }
              </div>
            </div>

            <div class="pricing-info">
              <span class="info-icon">💡</span>
              <p>Set a competitive base price. You can negotiate final prices with clients based on their requirements.</p>
            </div>
          </section>

          <!-- Location Section -->
          <section class="form-section">
            <h2>Service Location</h2>

            <div class="form-row">
              <div class="form-group">
                <app-input
                  label="City"
                  formControlName="city"
                  placeholder="e.g., Mumbai"
                  [error]="getError('city')"
                ></app-input>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Service Areas</label>
              <p class="form-hint">Add areas where you provide services</p>

              <div class="service-areas-input">
                <input
                  type="text"
                  class="form-input"
                  placeholder="Type an area and press Enter"
                  (keydown.enter)="addServiceArea($event)"
                  #areaInput
                >
              </div>

              <div class="service-areas-list">
                @for (area of serviceAreas(); track area; let i = $index) {
                  <span class="area-tag">
                    {{ area }}
                    <button type="button" class="remove-tag" (click)="removeServiceArea(i)">×</button>
                  </span>
                }
              </div>
            </div>
          </section>

          <!-- Tags Section -->
          <section class="form-section">
            <h2>Tags & Keywords</h2>
            <p class="section-desc">Add tags to help customers find your service</p>

            <div class="form-group">
              <div class="tags-input">
                <input
                  type="text"
                  class="form-input"
                  placeholder="Type a tag and press Enter"
                  (keydown.enter)="addTag($event)"
                  #tagInput
                >
              </div>

              <div class="tags-list">
                @for (tag of tags(); track tag; let i = $index) {
                  <span class="tag">
                    {{ tag }}
                    <button type="button" class="remove-tag" (click)="removeTag(i)">×</button>
                  </span>
                }
              </div>

              <div class="suggested-tags">
                <span class="suggested-label">Suggested:</span>
                @for (tag of suggestedTags; track tag) {
                  <button
                    type="button"
                    class="suggested-tag"
                    [class.added]="tags().includes(tag)"
                    (click)="toggleSuggestedTag(tag)"
                  >
                    {{ tag }}
                  </button>
                }
              </div>
            </div>
          </section>

          <!-- Portfolio Section -->
          <section class="form-section">
            <h2>Portfolio Images</h2>
            <p class="section-desc">Add images to showcase your work (URLs for now)</p>

            <div class="form-group">
              <app-input
                label="Cover Image URL"
                formControlName="coverImage"
                placeholder="https://example.com/image.jpg"
              ></app-input>
            </div>

            <div class="form-group">
              <label class="form-label">Portfolio Images</label>
              <div class="portfolio-input">
                <input
                  type="text"
                  class="form-input"
                  placeholder="Paste image URL and press Enter"
                  (keydown.enter)="addPortfolioImage($event)"
                  #portfolioInput
                >
              </div>

              <div class="portfolio-preview">
                @for (img of portfolioImages(); track img; let i = $index) {
                  <div class="portfolio-item">
                    <img [src]="img" alt="Portfolio" (error)="onImageError($event)">
                    <button type="button" class="remove-img" (click)="removePortfolioImage(i)">×</button>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- Form Actions -->
          <div class="form-actions">
            <app-button type="button" variant="secondary" routerLink="/dashboard/my-services">
              Cancel
            </app-button>
            <app-button type="submit" [loading]="isSubmitting()" [disabled]="serviceForm.invalid">
              {{ isEditMode() ? 'Update Service' : 'Create Service' }}
            </app-button>
          </div>
        </form>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .service-create-page {
      min-height: calc(100vh - $navbar-height);
      background: $bg-secondary;
      padding: $spacing-8 0;
    }

    .page-header {
      margin-bottom: $spacing-8;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      color: $text-secondary;
      font-size: $font-size-sm;
      margin-bottom: $spacing-4;
      background: none;
      border: none;
      cursor: pointer;
      transition: color $transition-fast;

      &:hover {
        color: $primary-600;
      }
    }

    .page-header h1 {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-2;
    }

    .page-header p {
      color: $text-secondary;
    }

    .service-form {
      max-width: 800px;
    }

    .form-section {
      @include card;
      margin-bottom: $spacing-6;

      h2 {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-4;
        padding-bottom: $spacing-3;
        border-bottom: 1px solid $border-light;
      }
    }

    .section-desc {
      color: $text-secondary;
      font-size: $font-size-sm;
      margin-top: -$spacing-2;
      margin-bottom: $spacing-4;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-4;

      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .form-group {
      margin-bottom: $spacing-5;
    }

    .form-label {
      @include form-label;
    }

    .required {
      color: $error;
    }

    .form-input,
    .form-select,
    .form-textarea {
      @include input-base;
      @include input-md;
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
    }

    .form-hint {
      font-size: $font-size-sm;
      color: $text-muted;
      margin-bottom: $spacing-2;
    }

    .error-text {
      display: block;
      color: $error;
      font-size: $font-size-sm;
      margin-top: $spacing-1;
    }

    .pricing-info {
      display: flex;
      align-items: flex-start;
      gap: $spacing-3;
      padding: $spacing-4;
      background: $info-light;
      border-radius: $radius-default;
      margin-top: $spacing-4;

      .info-icon {
        font-size: 1.25rem;
      }

      p {
        font-size: $font-size-sm;
        color: $info-dark;
        margin: 0;
      }
    }

    .service-areas-list,
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
      margin-top: $spacing-3;
    }

    .area-tag,
    .tag {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-1 $spacing-3;
      background: $primary-50;
      color: $primary-700;
      border-radius: $radius-full;
      font-size: $font-size-sm;
    }

    .remove-tag {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: $primary-200;
      color: $primary-700;
      border: none;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;

      &:hover {
        background: $primary-300;
      }
    }

    .suggested-tags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: $spacing-2;
      margin-top: $spacing-4;
    }

    .suggested-label {
      font-size: $font-size-sm;
      color: $text-muted;
    }

    .suggested-tag {
      padding: $spacing-1 $spacing-3;
      background: $neutral-100;
      border: 1px solid $border-light;
      border-radius: $radius-full;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-300;
        background: $primary-50;
      }

      &.added {
        background: $primary-100;
        border-color: $primary-300;
        color: $primary-700;
      }
    }

    .portfolio-preview {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: $spacing-3;
      margin-top: $spacing-4;
    }

    .portfolio-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: $radius-default;
      overflow: hidden;
      background: $neutral-100;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-img {
        position: absolute;
        top: $spacing-2;
        right: $spacing-2;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        opacity: 0;
        transition: opacity $transition-fast;
      }

      &:hover .remove-img {
        opacity: 1;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: $spacing-4;
      padding-top: $spacing-4;
    }
  `]
})
export class ServiceCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private serviceService = inject(ServiceService);
  private toast = inject(ToastService);

  isEditMode = signal(false);
  isSubmitting = signal(false);
  serviceId = signal<string | null>(null);
  serviceAreas = signal<string[]>([]);
  tags = signal<string[]>([]);
  portfolioImages = signal<string[]>([]);

  categories = [
    { value: 'food' as ServiceCategory, label: 'Food & Catering', icon: '🍽️' },
    { value: 'decor' as ServiceCategory, label: 'Decoration', icon: '🎨' },
    { value: 'photography' as ServiceCategory, label: 'Photography', icon: '📸' },
    { value: 'music' as ServiceCategory, label: 'Music & DJ', icon: '🎵' },
    { value: 'entertainment' as ServiceCategory, label: 'Entertainment', icon: '🎭' },
    { value: 'venue' as ServiceCategory, label: 'Venues', icon: '🏛️' },
    { value: 'cleanup' as ServiceCategory, label: 'Cleanup', icon: '🧹' },
    { value: 'other' as ServiceCategory, label: 'Other', icon: '✨' }
  ];

  priceUnits = [
    { value: 'per_event' as PriceUnit, label: 'Per Event' },
    { value: 'per_hour' as PriceUnit, label: 'Per Hour' },
    { value: 'per_day' as PriceUnit, label: 'Per Day' },
    { value: 'per_person' as PriceUnit, label: 'Per Person' }
  ];

  suggestedTags = [
    'premium', 'budget-friendly', 'vegetarian', 'vegan', 'outdoor',
    'indoor', 'wedding', 'birthday', 'corporate', 'professional'
  ];

  serviceForm: FormGroup = this.fb.group({
    serviceName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), CustomValidators.noScript()]],
    category: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000), CustomValidators.noScript()]],
    basePrice: ['', [Validators.required, Validators.min(1), Validators.max(10000000), CustomValidators.positiveNumber()]],
    priceUnit: ['', Validators.required],
    city: ['', [Validators.required, Validators.maxLength(50)]],
    businessName: ['', [Validators.maxLength(100), CustomValidators.noScript()]],
    coverImage: ['', [CustomValidators.url()]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.serviceId.set(id);
      this.loadService(id);
    }
  }

  loadService(id: string): void {
    this.serviceService.getServiceById(id).subscribe({
      next: (response) => {
        const service = response.data;
        this.serviceForm.patchValue({
          serviceName: service.serviceName,
          category: service.category,
          description: service.description,
          basePrice: service.basePrice,
          priceUnit: service.priceUnit,
          city: service.city,
          businessName: service.businessName || '',
          coverImage: service.coverImage || ''
        });
        this.serviceAreas.set(service.serviceAreas || []);
        this.tags.set(service.tags || []);
        this.portfolioImages.set(service.portfolioImages || []);
      },
      error: () => {
        this.toast.error('Error', 'Failed to load service');
        this.router.navigate(['/dashboard/my-services']);
      }
    });
  }

  getError(field: string): string {
    const control = this.serviceForm.get(field);
    if (control?.touched && control.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
      if (control.errors['min']) return `Value must be at least ₹${control.errors['min'].min}`;
      if (control.errors['max']) return `Value cannot exceed ₹${control.errors['max'].max}`;
      if (control.errors['positiveNumber']) return 'Must be a positive number';
      if (control.errors['invalidUrl']) return 'Please enter a valid URL';
      if (control.errors['scriptInjection']) return 'Invalid characters detected';
    }
    return '';
  }

  addServiceArea(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && !this.serviceAreas().includes(value)) {
      this.serviceAreas.update(areas => [...areas, value]);
      input.value = '';
    }
  }

  removeServiceArea(index: number): void {
    this.serviceAreas.update(areas => areas.filter((_, i) => i !== index));
  }

  addTag(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim().toLowerCase();
    if (value && !this.tags().includes(value)) {
      this.tags.update(tags => [...tags, value]);
      input.value = '';
    }
  }

  removeTag(index: number): void {
    this.tags.update(tags => tags.filter((_, i) => i !== index));
  }

  toggleSuggestedTag(tag: string): void {
    if (this.tags().includes(tag)) {
      this.tags.update(tags => tags.filter(t => t !== tag));
    } else {
      this.tags.update(tags => [...tags, tag]);
    }
  }

  addPortfolioImage(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && !this.portfolioImages().includes(value)) {
      this.portfolioImages.update(images => [...images, value]);
      input.value = '';
    }
  }

  removePortfolioImage(index: number): void {
    this.portfolioImages.update(images => images.filter((_, i) => i !== index));
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder.jpg';
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      Object.keys(this.serviceForm.controls).forEach(key => {
        this.serviceForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.serviceForm.value;
    const data: ServiceCreateData = {
      serviceName: formValue.serviceName,
      category: formValue.category,
      description: formValue.description,
      basePrice: Number(formValue.basePrice),
      priceUnit: formValue.priceUnit,
      city: formValue.city,
      businessName: formValue.businessName || undefined,
      coverImage: formValue.coverImage || undefined,
      serviceAreas: this.serviceAreas(),
      tags: this.tags(),
      portfolioImages: this.portfolioImages()
    };

    const request = this.isEditMode()
      ? this.serviceService.updateService(this.serviceId()!, data)
      : this.serviceService.createService(data);

    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(
          this.isEditMode() ? 'Service Updated' : 'Service Created',
          this.isEditMode() ? 'Your service has been updated successfully.' : 'Your service is now live!'
        );
        this.router.navigate(['/dashboard/my-services']);
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
