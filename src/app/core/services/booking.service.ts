import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Booking,
  BookingFilters,
  BookingCreateData,
  BookingUpdateData,
  PaymentUpdateData,
  BookingsResponse,
  BookingResponse,
  BookingStats
} from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private endpoint = '/bookings';

  constructor(private api: ApiService) {}

  getBookings(filters?: BookingFilters): Observable<BookingsResponse> {
    return this.api.get<BookingsResponse>(this.endpoint, filters);
  }

  getBookingStats(): Observable<{ success: boolean; data: BookingStats }> {
    return this.api.get(`${this.endpoint}/stats`);
  }

  getVendorUpcomingBookings(): Observable<BookingsResponse> {
    return this.api.get<BookingsResponse>(`${this.endpoint}/vendor/upcoming`);
  }

  getEventBookings(eventId: string): Observable<BookingsResponse> {
    return this.api.get<BookingsResponse>(`${this.endpoint}/event/${eventId}`);
  }

  getBookingById(id: string): Observable<BookingResponse> {
    return this.api.get<BookingResponse>(`${this.endpoint}/${id}`);
  }

  createBooking(data: BookingCreateData): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(this.endpoint, data);
  }

  updateBooking(id: string, data: BookingUpdateData): Observable<BookingResponse> {
    return this.api.put<BookingResponse>(`${this.endpoint}/${id}`, data);
  }

  confirmBooking(id: string): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/confirm`, {});
  }

  cancelBooking(id: string, reason?: string): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/cancel`, { reason });
  }

  completeBooking(id: string): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/complete`, {});
  }

  updatePayment(id: string, data: PaymentUpdateData): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/payment`, data);
  }
}
