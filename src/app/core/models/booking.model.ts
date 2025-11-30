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
  paymentBalance?: number;
  createdAt: Date;
  updatedAt: Date;
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
  | 'netbanking';

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
  event: string;
  service: string;
  eventDate: string;
  priceAgreed: number;
  notes?: string;
  requirements?: string;
}

export interface BookingUpdateData {
  notes?: string;
  requirements?: string;
  priceAgreed?: number;
}

export interface PaymentUpdateData {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
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
