import { User } from './user.model';

export interface Notification {
  _id: string;
  user: User | string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    eventId?: string;
    bookingId?: string;
    serviceId?: string;
    userId?: string;
    rsvpId?: string;
    senderId?: string;
    reviewId?: string;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'payment_received'
  | 'review_received'
  | 'event_reminder'
  | 'rsvp_received'
  | 'message_received'
  | 'system';

export interface NotificationsResponse {
  success: boolean;
  count: number;
  pagination?: {
    current: number;
    total: number;
    perPage: number;
    totalRecords: number;
  };
  data: Notification[];
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}
