import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { PaymentRecord, PayoutDetails } from './payment.service';
import { BookingDispute } from '../models/booking.model';

export interface MoneyTotals {
  collected: number;
  refunded: number;
  platformRevenue: number;
}

export interface AdminStats {
  users: { total: number; last30Days: number };
  vendors: number;
  events: number;
  bookings: Record<string, number>;
  money: { allTime: MoneyTotals; last30Days: MoneyTotals };
  payoutsDue: { amount: number; count: number };
  pendingVerification: number;
  flaggedReviews: number;
  openDisputes: number;
}

export interface GrowthSourceRow {
  source: string;
  signups: number;
  requestedBooking: number;
  listedService: number;
  createdEvent: number;
  activated: number;
}

export interface GrowthMetrics {
  days: number;
  signups: number;
  bySource: GrowthSourceRow[];
  funnel: {
    bookingRequests: number;
    paidBookings: number;
    completedPaidBookings: number;
    completedPaidGmv: number;
    eventsCreated: number;
    eventsWithThreeGuests: number;
  };
  supply: { activeVendors: number; vendorsWithAcceptedBooking: number };
}

export interface PayoutItem extends PaymentRecord {
  payee: { _id: string; name: string; email: string; phone?: string; penaltyDue?: number; noShowCount?: number; payoutDetails?: PayoutDetails };
}

type Party = { _id: string; name: string; email: string; phone?: string };

export interface DisputeItem {
  _id: string;
  status: string;
  priceAgreed: number;
  pricePaid: number;
  eventDate: string;
  arrivedAt?: string;
  refundableOnline: number;
  organizer: Party;
  vendor: Party & { noShowCount?: number };
  service?: { serviceName: string; category: string };
  event?: { title: string; date: string; city: string };
  dispute: BookingDispute;
}

export interface DisputeDecision {
  resolution: 'refund' | 'partial' | 'release';
  amount?: number;
  noShow?: boolean;
  penalty?: number;
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private endpoint = '/admin';

  constructor(private api: ApiService) {}

  getStats(): Observable<AdminStats> {
    return this.api.get<{ data: AdminStats }>(`${this.endpoint}/stats`).pipe(map(r => r.data));
  }

  getGrowth(days: number): Observable<GrowthMetrics> {
    return this.api.get<{ data: GrowthMetrics }>(`${this.endpoint}/growth`, { days }).pipe(map(r => r.data));
  }

  getPayouts(status: 'pending' | 'paid' = 'pending'): Observable<PayoutItem[]> {
    return this.api.get<{ data: PayoutItem[] }>(`${this.endpoint}/payouts`, { status }).pipe(map(r => r.data));
  }

  markPayoutPaid(paymentId: string, reference: string): Observable<unknown> {
    return this.api.post(`${this.endpoint}/payouts/${paymentId}/mark-paid`, { reference });
  }

  getDisputes(status: 'open' | 'resolved' = 'open'): Observable<DisputeItem[]> {
    return this.api.get<{ data: DisputeItem[] }>(`${this.endpoint}/disputes`, { status }).pipe(map(r => r.data));
  }

  resolveDispute(bookingId: string, decision: DisputeDecision): Observable<unknown> {
    return this.api.post(`${this.endpoint}/disputes/${bookingId}/resolve`, decision);
  }

  getUnverifiedServices(): Observable<any[]> {
    return this.api.get<{ data: any[] }>(`${this.endpoint}/services/unverified`).pipe(map(r => r.data));
  }

  verifyService(serviceId: string): Observable<unknown> {
    return this.api.post(`/services/${serviceId}/verify`, {});
  }

  getFlaggedReviews(): Observable<any[]> {
    return this.api.get<{ data: any[] }>(`${this.endpoint}/reviews/flagged`).pipe(map(r => r.data));
  }

  moderateReview(reviewId: string, isApproved: boolean, reason?: string): Observable<unknown> {
    return this.api.put(`/reviews/${reviewId}/moderate`, { isApproved, reason });
  }
}
