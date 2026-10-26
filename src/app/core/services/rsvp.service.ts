import { GuestRsvp, GuestRsvpData } from '../models/rsvp.model';
import { CheckoutDetails } from './payment.service';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AnalyticsService } from './analytics.service';
import {
  Rsvp,
  RsvpCreateData,
  RsvpUpdateData,
  RsvpResponse,
  RsvpsResponse,
  MyRsvpResponse
} from '../models/rsvp.model';

@Injectable({
  providedIn: 'root'
})
export class RsvpService {
  private endpoint = '/rsvps';

  constructor(private api: ApiService, private analytics: AnalyticsService) {}

  /**
   * Create a new RSVP for an event
   * POST /api/v1/rsvps
   */
  createRsvp(data: RsvpCreateData): Observable<RsvpResponse> {
    return this.api.post<RsvpResponse>(this.endpoint, data).pipe(
      tap(res => this.analytics.track('rsvp_created', { eventId: data.eventId, status: res.data?.status, viaInvite: !!data.inviteCode }))
    );
  }

  /**
   * RSVP or buy a ticket without an account. Keep the returned token to
   * change or cancel it later. Paid events also return a checkout to pay.
   */
  guestRsvp(data: GuestRsvpData): Observable<{ success: boolean; data: { rsvp: GuestRsvp; guestToken: string; checkout?: CheckoutDetails } }> {
    return this.api.post<{ success: boolean; data: { rsvp: GuestRsvp; guestToken: string; checkout?: CheckoutDetails } }>(`${this.endpoint}/guest`, data).pipe(
      tap(res => this.analytics.track('rsvp_created', { eventId: data.eventId, status: res.data?.rsvp.status, viaInvite: !!data.inviteCode, guest: true }))
    );
  }

  /** A guest cancels their RSVP or ticket; tickets are refunded under the ticket policy. */
  cancelGuestRsvp(token: string): Observable<{ success: boolean; message: string; data: { rsvp: GuestRsvp; refundIssued: number } }> {
    return this.api.post(`${this.endpoint}/guest/cancel`, { token });
  }

  /** A guest's own RSVP from their saved token. */
  getGuestRsvp(token: string): Observable<{ success: boolean; data: GuestRsvp }> {
    return this.api.get<{ success: boolean; data: GuestRsvp }>(`${this.endpoint}/guest`, { token });
  }

  /**
   * Get current user's RSVP for a specific event
   * GET /api/v1/rsvps/event/:eventId/my-rsvp
   */
  getMyRsvp(eventId: string): Observable<MyRsvpResponse> {
    return this.api.get<MyRsvpResponse>(`${this.endpoint}/event/${eventId}/my-rsvp`);
  }

  /**
   * Get all RSVPs for an event (organizer view)
   * GET /api/v1/rsvps/event/:eventId
   */
  getEventRsvps(eventId: string): Observable<RsvpsResponse> {
    return this.api.get<RsvpsResponse>(`${this.endpoint}/event/${eventId}`, { limit: 500 });
  }

  /**
   * Get all RSVPs by the current user
   * GET /api/v1/rsvps/my-rsvps
   */
  getMyRsvps(): Observable<RsvpsResponse> {
    return this.api.get<RsvpsResponse>(`${this.endpoint}/my-rsvps`, { limit: 100 });
  }

  /**
   * Update an existing RSVP
   * PUT /api/v1/rsvps/:rsvpId
   */
  updateRsvp(rsvpId: string, data: RsvpUpdateData): Observable<RsvpResponse> {
    return this.api.put<RsvpResponse>(`${this.endpoint}/${rsvpId}`, data);
  }

  /**
   * Cancel/delete an RSVP
   * DELETE /api/v1/rsvps/:rsvpId
   */
  cancelRsvp(rsvpId: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`${this.endpoint}/${rsvpId}`);
  }

  /**
   * Check in a guest
   * PUT /api/v1/rsvps/:rsvpId/check-in
   */
  checkIn(rsvpId: string): Observable<RsvpResponse> {
    return this.api.post<RsvpResponse>(`${this.endpoint}/${rsvpId}/check-in`, {});
  }

  /**
   * Check in a guest by the code shown on their ticket
   * POST /api/v1/rsvps/check-in-code
   */
  checkInByCode(eventId: string, code: string): Observable<RsvpResponse> {
    return this.api.post<RsvpResponse>(`${this.endpoint}/check-in-code`, { eventId, code });
  }
}
