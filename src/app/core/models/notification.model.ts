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
  // In-app path to open for this notification
  actionUrl?: string;
  relatedBooking?: string;
  relatedEvent?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Types the API sends (see backend config/constants NOTIFICATION_TYPES)
export type NotificationType =
  | 'booking'
  | 'message'
  | 'review'
  | 'event_reminder'
  | 'payment'
  | 'system'
  | 'rsvp'
  | 'task_assigned';

export const NOTIFICATION_ICONS: Record<string, string> = {
  booking: 'calendar',
  message: 'message',
  review: 'star',
  event_reminder: 'bell',
  payment: 'wallet',
  system: 'info',
  rsvp: 'users',
  task_assigned: 'clipboard'
};

// Where clicking a notification should take the user
export function notificationLink(n: Notification): string {
  if (n.actionUrl) return n.actionUrl;
  if (n.relatedBooking) return `/bookings/${n.relatedBooking}`;
  if (n.relatedEvent) return `/events/${n.relatedEvent}`;
  return '/notifications';
}

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
