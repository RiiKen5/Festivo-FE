import { Injectable } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AnalyticsService } from './analytics.service';
import {
  Booking,
  BookingFilters,
  BookingCreateData,
  BookingUpdateData,
  PaymentUpdateData,
  BookingsResponse,
  BookingResponse,
  BookingStats,
  DisputeReason
} from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private endpoint = '/bookings';

  constructor(private api: ApiService, private analytics: AnalyticsService) {}

  getBookings(filters?: BookingFilters): Observable<BookingsResponse> {
    return this.api.get<BookingsResponse>(this.endpoint, filters);
  }

  // Bookings between the current user and someone else, on either side
  getBookingsWith(userId: string): Observable<{ success: boolean; data: Booking[] }> {
    return this.api.get(`${this.endpoint}/with/${userId}`);
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
    return this.api.post<BookingResponse>(this.endpoint, data).pipe(
      tap(res => this.analytics.track('booking_requested', { bookingId: res.data?._id, serviceId: data.serviceId, price: data.priceAgreed }))
    );
  }

  updateBooking(id: string, data: BookingUpdateData): Observable<BookingResponse> {
    return this.api.put<BookingResponse>(`${this.endpoint}/${id}`, data);
  }

  // Vendor accepts, optionally at a revised price (their quote)
  // allowOverbook: the vendor saw the "day is full / blocked" warning and accepts anyway
  confirmBooking(id: string, priceAgreed?: number, allowOverbook = false): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/confirm`, { priceAgreed, allowOverbook }).pipe(
      tap(res => this.analytics.track('booking_confirmed', { bookingId: id, price: res.data?.priceAgreed }))
    );
  }

  /**
   * Vendor accepts. If the day is already full or blocked, the API warns
   * first; ask the vendor and accept anyway if they agree. A declined
   * warning errors with { cancelled: true }.
   */
  accept(id: string, priceAgreed?: number): Observable<BookingResponse> {
    return this.confirmBooking(id, priceAgreed).pipe(
      catchError(err => {
        const warning = err?.error?.error;
        if (err?.status !== 409 || !warning?.details?.canOverride) return throwError(() => err);
        return confirm(`${warning.message}\n\nAccept this booking anyway?`)
          ? this.confirmBooking(id, priceAgreed, true)
          : throwError(() => ({ cancelled: true }));
      })
    );
  }

  cancelBooking(id: string, reason?: string): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/cancel`, { reason });
  }

  completeBooking(id: string): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/complete`, {});
  }

  // Vendor enters the organizer's 4-digit code when they arrive
  confirmArrival(id: string, code: string): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/arrive`, { code });
  }

  markArrived(id: string): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/mark-arrived`, {});
  }

  // Organizer reports a no-show or a job not done as agreed; freezes the payout
  reportProblem(id: string, reason: DisputeReason, details: string): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/report-problem`, { reason, details }).pipe(
      tap(() => this.analytics.track('booking_problem_reported', { bookingId: id, reason }))
    );
  }

  respondToDispute(id: string, response: string, evidence: string[]): Observable<BookingResponse> {
    return this.api.post<BookingResponse>(`${this.endpoint}/${id}/dispute-response`, { response, evidence });
  }

  // Vendor records an offline payment they received. Organizers pay online via PaymentService.
  recordOfflinePayment(id: string, data: PaymentUpdateData): Observable<BookingResponse> {
    return this.api.put<BookingResponse>(`${this.endpoint}/${id}/payment`, data);
  }
}
