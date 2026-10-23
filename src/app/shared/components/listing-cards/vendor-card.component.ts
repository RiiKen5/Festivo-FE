import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Service } from '../../../core/models/service.model';
import { IconComponent, SERVICE_CATEGORY_ICONS } from '../icon/icon.component';
import { categoryLabel, priceUnitLabel, plural } from './listing-format';

@Component({
  selector: 'app-vendor-card',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <a class="card" [routerLink]="['/services', service.slug]">
      <div class="card__media">
        <img [src]="service.coverImage || 'assets/images/service-placeholder.svg'" [alt]="service.coverImage ? service.serviceName : ''" loading="lazy">
        <span class="card__type">
          <app-icon [name]="categoryIcon" [size]="14"></app-icon>
          {{ category }}
        </span>
      </div>
      <div class="card__body">
        <h3 class="card__title">
          {{ service.serviceName }}
          @if (service.isVerified) {
            <span class="card__verified" title="Verified by Festivo">
              <app-icon name="shield-check" [size]="16"></app-icon>
              <span class="visually-hidden">Verified</span>
            </span>
          }
        </h3>
        <p class="card__where">
          <app-icon name="map-pin" [size]="14"></app-icon>
          {{ service.city }}
        </p>
        <div class="card__footer">
          @if (service.totalRatings > 0) {
            <span class="card__rating">
              <app-icon name="star" [size]="14"></app-icon>
              {{ service.ratingAverage | number:'1.1-1' }}
              <span class="card__muted">({{ reviews }})</span>
            </span>
          } @else {
            <span class="card__new">New on Festivo</span>
          }
          <span class="card__price">
            ₹{{ service.basePrice | number }}
            <span class="card__muted">{{ unit }}</span>
          </span>
        </div>
      </div>
    </a>
  `,
  styleUrl: './listing-card.scss'
})
export class VendorCardComponent {
  @Input({ required: true }) service!: Service;

  get category(): string { return categoryLabel(this.service.category); }
  get categoryIcon(): string { return SERVICE_CATEGORY_ICONS[this.service.category] || 'store'; }
  get unit(): string { return priceUnitLabel(this.service.priceUnit); }
  get reviews(): string { return plural(this.service.totalRatings, 'review'); }
}
