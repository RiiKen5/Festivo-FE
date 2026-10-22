import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { PaymentRecord, PayoutDetails } from './payment.service';

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
}

export interface PayoutItem extends PaymentRecord {
  payee: { _id: string; name: string; email: string; phone?: string; payoutDetails?: PayoutDetails };
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

  getPayouts(status: 'pending' | 'paid' = 'pending'): Observable<PayoutItem[]> {
    return this.api.get<{ data: PayoutItem[] }>(`${this.endpoint}/payouts`, { status }).pipe(map(r => r.data));
  }

  markPayoutPaid(paymentId: string, reference: string): Observable<unknown> {
    return this.api.post(`${this.endpoint}/payouts/${paymentId}/mark-paid`, { reference });
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
