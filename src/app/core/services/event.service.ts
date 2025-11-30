import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
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

  constructor(private api: ApiService) {}

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

  getEventBySlug(slug: string): Observable<EventResponse> {
    return this.api.get<EventResponse>(`${this.endpoint}/slug/${slug}`);
  }

  getEventById(id: string): Observable<EventResponse> {
    return this.api.get<EventResponse>(`${this.endpoint}/${id}`);
  }

  // Protected endpoints
  getMyEvents(filters?: EventFilters): Observable<EventsResponse> {
    return this.api.get<EventsResponse>(`${this.endpoint}/my-events`, filters);
  }

  createEvent(data: EventCreateData): Observable<EventResponse> {
    return this.api.post<EventResponse>(this.endpoint, data);
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
