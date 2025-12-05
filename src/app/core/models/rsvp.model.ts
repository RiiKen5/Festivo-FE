import { User } from './user.model';
import { Event } from './event.model';

export type RsvpStatus = 'going' | 'interested' | 'maybe';

export interface Rsvp {
  _id: string;
  event: Event | string;
  user: User | string;
  status: RsvpStatus;
  guestsCount: number;
  checkInCode?: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RsvpCreateData {
  eventId: string;
  status: RsvpStatus;
  guestsCount?: number;
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
