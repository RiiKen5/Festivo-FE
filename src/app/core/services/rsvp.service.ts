import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
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

  constructor(private api: ApiService) {}

  /**
   * Create a new RSVP for an event
   * POST /api/v1/rsvps
   */
  createRsvp(data: RsvpCreateData): Observable<RsvpResponse> {
    return this.api.post<RsvpResponse>(this.endpoint, data);
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
    return this.api.get<RsvpsResponse>(`${this.endpoint}/event/${eventId}`);
  }

  /**
   * Get all RSVPs by the current user
   * GET /api/v1/rsvps/my-rsvps
   */
  getMyRsvps(): Observable<RsvpsResponse> {
    return this.api.get<RsvpsResponse>(`${this.endpoint}/my-rsvps`);
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
    return this.api.put<RsvpResponse>(`${this.endpoint}/${rsvpId}/check-in`, {});
  }
}
