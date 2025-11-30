import { User } from './user.model';

export interface Event {
  _id: string;
  title: string;
  slug: string;
  description: string;
  eventType: EventType;
  organizer: User | string;
  coOrganizers: (User | string)[];
  date: Date;
  time: string;
  endDate?: Date;
  timezone: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  locationName: string;
  address: string;
  city: string;
  expectedGuests: number;
  maxAttendees?: number;
  currentAttendees: number;
  budget: number;
  budgetSpent: number;
  currency: string;
  isPublic: boolean;
  isPublished: boolean;
  status: EventStatus;
  entryFee: number;
  isPaid: boolean;
  coverPhoto?: string;
  photos: string[];
  tags: string[];
  category?: string;
  vibeScore: VibeScore;
  views: number;
  rsvpCount: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

export type EventType =
  | 'birthday'
  | 'house_party'
  | 'meetup'
  | 'wedding'
  | 'corporate'
  | 'farewell'
  | 'other';

export type EventStatus =
  | 'draft'
  | 'planning'
  | 'active'
  | 'completed'
  | 'cancelled';

export type VibeScore =
  | 'chill'
  | 'party'
  | 'networking'
  | 'formal';

export interface EventFilters {
  city?: string;
  eventType?: EventType;
  status?: EventStatus;
  minDate?: string;
  maxDate?: string;
  minBudget?: number;
  maxBudget?: number;
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  isPaid?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface EventCreateData {
  title: string;
  description: string;
  eventType: EventType;
  date: string;
  time: string;
  endDate?: string;
  locationName: string;
  address: string;
  city: string;
  coordinates?: [number, number];
  expectedGuests: number;
  maxAttendees?: number;
  budget?: number;
  isPublic?: boolean;
  entryFee?: number;
  isPaid?: boolean;
  coverPhoto?: string;
  photos?: string[];
  tags?: string[];
  vibeScore?: VibeScore;
}

export interface EventUpdateData extends Partial<EventCreateData> {
  status?: EventStatus;
}

export interface EventsResponse {
  success: boolean;
  count: number;
  pagination: Pagination;
  data: Event[];
}

export interface EventResponse {
  success: boolean;
  data: Event;
}

export interface Pagination {
  current: number;
  total: number;
  perPage: number;
  totalRecords: number;
}
