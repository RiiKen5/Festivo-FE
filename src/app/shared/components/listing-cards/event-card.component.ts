import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Event } from '../../../core/models/event.model';
import { IconComponent, EVENT_TYPE_ICONS } from '../icon/icon.component';
import { eventTypeLabel, formatShortDate, formatTime, plural } from './listing-format';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <a class="card" [routerLink]="['/events', event.slug]">
      <div class="card__media">
        <img [src]="event.coverPhoto || 'assets/images/event-placeholder.svg'" [alt]="event.coverPhoto ? event.title : ''" loading="lazy">
        <span class="card__type">
          <app-icon [name]="typeIcon" [size]="14"></app-icon>
          {{ typeLabel }}
        </span>
      </div>
      <div class="card__body">
        <p class="card__when">{{ date }} · {{ time }}</p>
        <h3 class="card__title">{{ event.title }}</h3>
        <p class="card__where">
          <app-icon name="map-pin" [size]="14"></app-icon>
          {{ event.locationName || event.city }}
        </p>
        <div class="card__footer">
          <span class="card__going">{{ event.currentAttendees ? going : 'Be the first to RSVP' }}</span>
          @if (event.entryFee > 0) {
            <span class="card__price">₹{{ event.entryFee | number }}</span>
          } @else {
            <span class="card__free">Free</span>
          }
        </div>
      </div>
    </a>
  `,
  styleUrl: './listing-card.scss'
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;

  get typeLabel(): string { return eventTypeLabel(this.event.eventType); }
  get typeIcon(): string { return EVENT_TYPE_ICONS[this.event.eventType] || 'party'; }
  get date(): string { return formatShortDate(this.event.date); }
  get time(): string { return formatTime(this.event.time); }
  get going(): string { return plural(this.event.currentAttendees, 'person', 'people') + ' going'; }
}
