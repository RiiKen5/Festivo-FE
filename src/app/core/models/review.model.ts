import { User } from './user.model';
import { Booking } from './booking.model';
import { Service } from './service.model';

export interface Review {
  _id: string;
  booking: Booking | string;
  service: Service | string;
  reviewer: User | string;
  vendor: User | string;
  rating: number;
  reviewText: string;
  ratings: {
    quality: number;
    punctuality: number;
    professionalism: number;
    valueForMoney: number;
  };
  vendorResponse?: string;
  vendorRespondedAt?: Date;
  isVerified: boolean;
  helpfulCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewCreateData {
  booking: string;
  rating: number;
  reviewText: string;
  ratings: {
    quality: number;
    punctuality: number;
    professionalism: number;
    valueForMoney: number;
  };
}

export interface ReviewsResponse {
  success: boolean;
  count: number;
  pagination?: {
    current: number;
    total: number;
    perPage: number;
    totalRecords: number;
  };
  data: Review[];
}

export interface ReviewResponse {
  success: boolean;
  data: Review;
}
