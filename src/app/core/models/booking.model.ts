import { Event } from './event.model';
import { Service } from './service.model';
import { User } from './user.model';

export interface Booking {
  _id: string;
  event: Event | string;
  service: Service | string;
  organizer: User | string;
  vendor: User | string;
  bookingDate: Date;
  eventDate: Date;
  status: BookingStatus;
  priceAgreed: number;
  pricePaid: number;
  totalPaid?: number;
  refundedAmount?: number;
  payments?: BookingPayment[];
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  notes?: string;
  requirements?: string;
  rating?: number;
  review?: string;
  reviewDate?: Date;
  lastMessageAt?: Date;
  messageCount: number;
  cancellationReason?: string;
  cancelledBy?: User | string;
  cancelledAt?: Date;
  completedAt?: Date;
  // Only the organizer receives this; they read it to the vendor on arrival
  arrivalCode?: string;
  arrivedAt?: Date;
  dispute?: BookingDispute;
  paymentBalance?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DisputeReason = 'no_show' | 'not_as_agreed' | 'other';

export interface BookingDispute {
  status: 'open' | 'resolved';
  reason: DisputeReason;
  details: string;
  openedAt: Date;
  respondBy: Date;
  vendorResponse?: string;
  vendorEvidence?: string[];
  vendorRespondedAt?: Date;
  resolution?: 'refund' | 'partial' | 'release';
  refunded?: number;
  noShow?: boolean;
  resolutionNote?: string;
  resolvedAt?: Date;
}

export interface BookingPayment {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paidAt: Date;
  notes?: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'refunded';

export type PaymentMethod =
  | 'cash'
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'bank_transfer'
  | 'razorpay'
  | 'other';

export interface BookingFilters {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  eventId?: string;
  serviceId?: string;
  minDate?: string;
  maxDate?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface BookingCreateData {
  eventId: string;
  serviceId: string;
  eventDate: string;
  // The organizer's proposed price; the vendor may confirm at a different quote
  priceAgreed: number;
  notes?: string;
  requirements?: string;
}

export interface BookingUpdateData {
  notes?: string;
  requirements?: string;
  priceAgreed?: number;
}

// An offline payment the vendor records as received
export interface PaymentUpdateData {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
}

export interface BookingsResponse {
  success: boolean;
  count: number;
  pagination: {
    current: number;
    total: number;
    perPage: number;
    totalRecords: number;
  };
  data: Booking[];
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
}
