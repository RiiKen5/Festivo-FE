import { EventPlan } from '../models/event-plan.model';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AnalyticsService } from './analytics.service';
import {
  Event,
  EventFilters,
  EventCreateData,
  EventUpdateData,
  EventsResponse,
  EventResponse
} from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private endpoint = '/events';

  constructor(private api: ApiService, private analytics: AnalyticsService) {}

  // Public endpoints
  getEvents(filters?: EventFilters): Observable<EventsResponse> {
    return this.api.get<EventsResponse>(this.endpoint, filters);
  }

  getUpcomingEvents(): Observable<EventsResponse> {
    return this.api.get<EventsResponse>(`${this.endpoint}/upcoming`);
  }

  getPopularEvents(): Observable<EventsResponse> {
    return this.api.get<EventsResponse>(`${this.endpoint}/popular`);
  }

  getNearbyEvents(lat: number, lng: number, radius?: number): Observable<EventsResponse> {
    return this.api.get<EventsResponse>(`${this.endpoint}/nearby`, { lat, lng, radius });
  }

  // inviteCode unlocks private events shared through an invite link
  getEventBySlug(slug: string, inviteCode?: string | null): Observable<EventResponse> {
    return this.api.get<EventResponse>(`${this.endpoint}/slug/${slug}`, { invite: inviteCode });
  }

  getEventById(id: string, inviteCode?: string | null): Observable<EventResponse> {
    return this.api.get<EventResponse>(`${this.endpoint}/${id}`, { invite: inviteCode });
  }

  regenerateInvite(id: string): Observable<{ success: boolean; data: { inviteCode: string; inviteUrl: string } }> {
    return this.api.post(`${this.endpoint}/${id}/invite/regenerate`, {});
  }

  // Protected endpoints
  getMyEvents(filters?: EventFilters): Observable<EventsResponse> {
    return this.api.get<EventsResponse>(`${this.endpoint}/my-events`, filters);
  }

  // Checklist, bookings and suggested vendors for the organizer's planner
  getPlan(id: string): Observable<{ success: boolean; data: EventPlan }> {
    return this.api.get(`${this.endpoint}/${id}/plan`);
  }

  createEvent(data: EventCreateData): Observable<EventResponse> {
    return this.api.post<EventResponse>(this.endpoint, data).pipe(
      tap(res => this.analytics.track('event_created', { eventId: res.data?._id, eventType: res.data?.eventType, isPublic: res.data?.isPublic, isPaid: res.data?.isPaid }))
    );
  }

  updateEvent(id: string, data: EventUpdateData): Observable<EventResponse> {
    return this.api.put<EventResponse>(`${this.endpoint}/${id}`, data);
  }

  deleteEvent(id: string): Observable<any> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }

  publishEvent(id: string): Observable<EventResponse> {
    return this.api.post<EventResponse>(`${this.endpoint}/${id}/publish`, {});
  }

  unpublishEvent(id: string): Observable<EventResponse> {
    return this.api.post<EventResponse>(`${this.endpoint}/${id}/unpublish`, {});
  }

  cancelEvent(id: string, reason?: string): Observable<EventResponse> {
    return this.api.post<EventResponse>(`${this.endpoint}/${id}/cancel`, { reason });
  }

  completeEvent(id: string): Observable<EventResponse> {
    return this.api.post<EventResponse>(`${this.endpoint}/${id}/complete`, {});
  }

  addCoOrganizer(eventId: string, userId: string): Observable<EventResponse> {
    return this.api.post<EventResponse>(`${this.endpoint}/${eventId}/co-organizers`, { userId });
  }

  removeCoOrganizer(eventId: string, userId: string): Observable<EventResponse> {
    return this.api.delete<EventResponse>(`${this.endpoint}/${eventId}/co-organizers/${userId}`);
  }
}
