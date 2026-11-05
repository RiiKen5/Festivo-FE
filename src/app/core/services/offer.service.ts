import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

// What an organizer asks vendors for on an event
export interface OfferSettings {
  open: boolean;
  needs: string[];
  note?: string;
}

// An event a vendor can send an offer to: no organizer, title only if public
export interface Lead {
  _id: string;
  title?: string;
  eventType: string;
  date: string;
  time?: string;
  city: string;
  expectedGuests: number;
  needs: string[];
  note?: string;
  myOffers: { _id: string; service: string; status: OfferStatus; price: number }[];
}

export interface LeadService {
  _id: string;
  serviceName: string;
  category: string;
  basePrice: number;
  priceUnit: string;
}

export interface Offer {
  _id: string;
  price: number;
  message: string;
  status: OfferStatus;
  booking?: string;
  createdAt: string;
  service?: { _id: string; serviceName: string; slug?: string; category?: string; coverImage?: string; ratingAverage?: number; totalRatings?: number; isVerified?: boolean; noShowCount?: number };
  vendor?: { _id: string; name: string; profilePhoto?: string };
  event?: { _id: string; eventType: string; date: string; city: string };
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private endpoint = '/offers';

  constructor(private api: ApiService) {}

  getLeads(): Observable<{ services: LeadService[]; leads: Lead[] }> {
    return this.api.get<{ data: { services: LeadService[]; leads: Lead[] } }>(`${this.endpoint}/leads`).pipe(map(r => r.data));
  }

  getMine(): Observable<Offer[]> {
    return this.api.get<{ data: Offer[] }>(`${this.endpoint}/mine`).pipe(map(r => r.data));
  }

  send(eventId: string, serviceId: string, price: number, message: string): Observable<Offer> {
    return this.api.post<{ data: Offer }>(this.endpoint, { eventId, serviceId, price, message }).pipe(map(r => r.data));
  }

  withdraw(offerId: string): Observable<unknown> {
    return this.api.post(`${this.endpoint}/${offerId}/withdraw`, {});
  }

  getForEvent(eventId: string): Observable<{ settings: OfferSettings; offers: Offer[] }> {
    return this.api.get<{ data: { settings: OfferSettings; offers: Offer[] } }>(`${this.endpoint}/events/${eventId}`).pipe(map(r => r.data));
  }

  updateSettings(eventId: string, settings: OfferSettings): Observable<OfferSettings> {
    return this.api.put<{ data: OfferSettings }>(`${this.endpoint}/events/${eventId}/settings`, settings).pipe(map(r => r.data));
  }

  accept(offerId: string): Observable<{ booking: { _id: string } }> {
    return this.api.post<{ data: { booking: { _id: string } } }>(`${this.endpoint}/${offerId}/accept`, {}).pipe(map(r => r.data));
  }

  decline(offerId: string): Observable<unknown> {
    return this.api.post(`${this.endpoint}/${offerId}/decline`, {});
  }
}
