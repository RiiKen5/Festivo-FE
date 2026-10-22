import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, map, shareReplay } from 'rxjs';
import { ApiService } from './api.service';

export interface PaymentConfig {
  enabled: boolean;
  keyId: string | null;
  bookingCommissionPercent: number;
  ticketFeePercent: number;
}

export interface CheckoutDetails {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface PaymentRecord {
  _id: string;
  kind: 'booking' | 'ticket';
  amount: number;
  platformFee: number;
  payeeAmount: number;
  refundedAmount: number;
  status: 'created' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  payoutStatus: 'not_due' | 'pending' | 'paid' | 'not_applicable';
  payoutReference?: string;
  paidAt?: string;
  event?: { _id: string; title: string; date: string };
  createdAt: string;
}

export interface EarningsSummary {
  held: number;
  payoutDue: number;
  paidOut: number;
}

export interface PayoutDetails {
  method: 'upi' | 'bank';
  upiId?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifsc?: string;
}

export type CheckoutResult = 'paid' | 'dismissed';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private endpoint = '/payments';
  private config$?: Observable<PaymentConfig>;
  private scriptLoad?: Promise<void>;

  constructor(private api: ApiService) {}

  getConfig(): Observable<PaymentConfig> {
    this.config$ ??= this.api.get<{ data: PaymentConfig }>(`${this.endpoint}/config`).pipe(
      map(response => response.data),
      shareReplay(1)
    );
    return this.config$;
  }

  createBookingOrder(bookingId: string, amount?: number): Observable<CheckoutDetails> {
    return this.api.post<{ data: CheckoutDetails }>(`${this.endpoint}/bookings/${bookingId}/order`, { amount })
      .pipe(map(response => response.data));
  }

  createTicketOrder(rsvpId: string): Observable<CheckoutDetails> {
    return this.api.post<{ data: CheckoutDetails }>(`${this.endpoint}/rsvps/${rsvpId}/order`, {})
      .pipe(map(response => response.data));
  }

  getMyPayments(role: 'payer' | 'payee'): Observable<{ data: PaymentRecord[]; summary: EarningsSummary | null }> {
    return this.api.get(`${this.endpoint}/mine`, { role, limit: 50 });
  }

  getPayoutDetails(): Observable<PayoutDetails | null> {
    return this.api.get<{ data: PayoutDetails | null }>('/users/me/payout-details')
      .pipe(map(response => response.data));
  }

  savePayoutDetails(details: PayoutDetails): Observable<PayoutDetails> {
    return this.api.put<{ data: PayoutDetails }>('/users/me/payout-details', details)
      .pipe(map(response => response.data));
  }

  /**
   * Open Razorpay Checkout for an order and confirm the payment with the API.
   * Resolves 'dismissed' if the user closes the checkout without paying.
   */
  async checkout(
    details: CheckoutDetails,
    description: string,
    prefill: { name?: string; email?: string; contact?: string } = {}
  ): Promise<CheckoutResult> {
    await this.loadScript();

    const response = await new Promise<any>((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: details.keyId,
        order_id: details.orderId,
        amount: Math.round(details.amount * 100),
        currency: details.currency,
        name: 'Festivo',
        description,
        prefill,
        theme: { color: '#6366f1' },
        handler: resolve,
        modal: { ondismiss: () => resolve(null) }
      });
      razorpay.on('payment.failed', (failure: any) => {
        reject(new Error(failure?.error?.description || 'Payment failed'));
      });
      razorpay.open();
    });

    if (!response) return 'dismissed';

    await firstValueFrom(this.api.post(`${this.endpoint}/verify`, {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature
    }));
    return 'paid';
  }

  private loadScript(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();

    this.scriptLoad ??= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CHECKOUT_SCRIPT;
      script.onload = () => resolve();
      script.onerror = () => {
        this.scriptLoad = undefined;
        reject(new Error('Could not load the payment window. Check your connection and try again.'));
      };
      document.body.appendChild(script);
    });
    return this.scriptLoad;
  }
}
