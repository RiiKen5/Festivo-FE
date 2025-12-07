import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Review,
  ReviewCreateData,
  ReviewsResponse,
  ReviewResponse
} from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private endpoint = '/reviews';

  constructor(private api: ApiService) {}

  /**
   * Create a new review for a booking
   * POST /api/v1/reviews
   */
  createReview(data: ReviewCreateData): Observable<ReviewResponse> {
    return this.api.post<ReviewResponse>(this.endpoint, data);
  }

  /**
   * Get all reviews for a service
   * GET /api/v1/reviews/service/:serviceId
   */
  getServiceReviews(serviceId: string, page: number = 1, limit: number = 10): Observable<ReviewsResponse> {
    return this.api.get<ReviewsResponse>(`${this.endpoint}/service/${serviceId}`, { page, limit });
  }

  /**
   * Get a single review by ID
   * GET /api/v1/reviews/:reviewId
   */
  getReviewById(reviewId: string): Observable<ReviewResponse> {
    return this.api.get<ReviewResponse>(`${this.endpoint}/${reviewId}`);
  }

  /**
   * Vendor responds to a review
   * PUT /api/v1/reviews/:reviewId/respond
   */
  respondToReview(reviewId: string, vendorResponse: string): Observable<ReviewResponse> {
    return this.api.put<ReviewResponse>(`${this.endpoint}/${reviewId}/respond`, { vendorResponse });
  }

  /**
   * Mark a review as helpful
   * POST /api/v1/reviews/:reviewId/helpful
   */
  markHelpful(reviewId: string): Observable<ReviewResponse> {
    return this.api.post<ReviewResponse>(`${this.endpoint}/${reviewId}/helpful`, {});
  }

  /**
   * Report a review
   * POST /api/v1/reviews/:reviewId/report
   */
  reportReview(reviewId: string, reason: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>(`${this.endpoint}/${reviewId}/report`, { reason });
  }
}
