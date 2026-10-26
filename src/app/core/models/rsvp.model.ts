import { User } from './user.model';
import { Event } from './event.model';

export type RsvpStatus = 'going' | 'maybe' | 'not_going' | 'cancelled' | 'pending_payment';

export interface Rsvp {
  _id: string;
  event: Event | string;
  // Absent for guests who RSVPed without an account (guestName instead)
  attendee?: User | string;
  guestName?: string;
  guestPhone?: string;
  status: RsvpStatus;
  guestsCount: number;
  checkInCode?: string;
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  amountPaid?: number;
  checkedIn: boolean;
  checkedInAt?: Date;
  attended?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RsvpCreateData {
  eventId: string;
  status: RsvpStatus;
  guestsCount?: number;
  // From a private event invite link
  inviteCode?: string;
}

export interface RsvpUpdateData {
  status?: RsvpStatus;
  guestsCount?: number;
}

export interface RsvpResponse {
  success: boolean;
  data: Rsvp;
  message?: string;
}

export interface RsvpsResponse {
  success: boolean;
  count: number;
  data: Rsvp[];
}

export interface MyRsvpResponse {
  success: boolean;
  data: Rsvp | null;
}

// RSVP without an account, from the invite link
export interface GuestRsvpData {
  eventId: string;
  inviteCode?: string;
  name: string;
  phone?: string;
  status: 'going' | 'maybe' | 'not_going';
  guestsCount: number;
  guestToken?: string;
}

export interface GuestRsvp {
  _id: string;
  event: string;
  guestName: string;
  status: 'going' | 'maybe' | 'not_going' | 'cancelled';
  guestsCount: number;
  checkInCode?: string;
}
