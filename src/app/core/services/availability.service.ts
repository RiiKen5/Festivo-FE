import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface UnavailableDays {
  blocked: string[];
  full: string[];
  paused: boolean;
}

export interface CalendarBooking {
  _id: string;
  status: string;
  service?: string;
  event?: string;
}

export interface VendorCalendar {
  blocked: string[];
  days: Record<string, CalendarBooking[]>;
}

/** Dates as 'YYYY-MM-DD' in India time, matching the API. */
export const dayKey = (d: Date | string) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

/** Vendor availability: blocked days and days already full. */
@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  constructor(private api: ApiService) {}

  // Days a service can't be booked between two dates (for request forms)
  unavailable(serviceId: string, from: string, to: string): Observable<UnavailableDays> {
    return this.api.get<{ data: UnavailableDays }>(`/services/${serviceId}/check-availability`, { from, to }).pipe(map(r => r.data));
  }

  myCalendar(from: string, to: string): Observable<VendorCalendar> {
    return this.api.get<{ data: VendorCalendar }>('/users/me/calendar', { from, to }).pipe(map(r => r.data));
  }

  updateMyCalendar(change: { block?: string[]; unblock?: string[] }): Observable<string[]> {
    return this.api.put<{ data: { blocked: string[] } }>('/users/me/calendar', change).pipe(map(r => r.data.blocked));
  }
}
