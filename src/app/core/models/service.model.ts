import { User } from './user.model';

export interface Service {
  _id: string;
  serviceName: string;
  slug: string;
  description: string;
  provider: User | string;
  category: ServiceCategory;
  basePrice: number;
  priceUnit: PriceUnit;
  surgeMultiplier?: number;
  offPeakDiscount?: number;
  lastMinutePrice?: number;
  portfolioImages: string[];
  portfolioVideos: string[];
  coverImage?: string;
  city: string;
  serviceAreas: string[];
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  availability: ServiceAvailability;
  availableDates: Date[];
  blackoutDates: Date[];
  ratingAverage: number;
  totalRatings: number;
  totalBookings: number;
  completedBookings: number;
  views: number;
  isVerified: boolean;
  verifiedAt?: Date;
  tags: string[];
  businessName?: string;
  gstNumber?: string;
  panNumber?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCategory =
  | 'food'
  | 'decor'
  | 'photography'
  | 'music'
  | 'cleanup'
  | 'entertainment'
  | 'venue'
  | 'other';

export type PriceUnit =
  | 'per_event'
  | 'per_hour'
  | 'per_day'
  | 'per_person';

export type ServiceAvailability =
  | 'available'
  | 'busy'
  | 'not_taking_orders';

export interface ServiceFilters {
  category?: ServiceCategory;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availability?: ServiceAvailability;
  isVerified?: boolean;
  search?: string;
  tags?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ServiceCreateData {
  serviceName: string;
  description: string;
  category: ServiceCategory;
  basePrice: number;
  priceUnit: PriceUnit;
  city: string;
  serviceAreas?: string[];
  coordinates?: [number, number];
  coverImage?: string;
  portfolioImages?: string[];
  portfolioVideos?: string[];
  availability?: ServiceAvailability;
  tags?: string[];
  businessName?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface ServiceUpdateData extends Partial<ServiceCreateData> {
  isActive?: boolean;
}

export interface ServicesResponse {
  success: boolean;
  count: number;
  pagination: {
    current: number;
    total: number;
    perPage: number;
    totalRecords: number;
  };
  data: Service[];
}

export interface ServiceResponse {
  success: boolean;
  data: Service;
}

export interface AvailabilityCheck {
  available: boolean;
  reason?: string;
  alternativeDates?: Date[];
}
