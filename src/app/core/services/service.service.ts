import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ServiceFilters,
  ServiceCreateData,
  ServiceUpdateData,
  ServicesResponse,
  ServiceResponse,
  AvailabilityCheck
} from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private endpoint = '/services';

  constructor(private api: ApiService) {}

  // Public endpoints
  getServices(filters?: ServiceFilters): Observable<ServicesResponse> {
    return this.api.get<ServicesResponse>(this.endpoint, filters);
  }

  getTopRatedServices(): Observable<ServicesResponse> {
    return this.api.get<ServicesResponse>(`${this.endpoint}/top-rated`);
  }

  getNearbyServices(lat: number, lng: number, radius?: number): Observable<ServicesResponse> {
    return this.api.get<ServicesResponse>(`${this.endpoint}/nearby`, { lat, lng, radius });
  }

  getServicesByCategory(category: string): Observable<ServicesResponse> {
    return this.api.get<ServicesResponse>(`${this.endpoint}/category/${category}`);
  }

  getServiceBySlug(slug: string): Observable<ServiceResponse> {
    return this.api.get<ServiceResponse>(`${this.endpoint}/slug/${slug}`);
  }

  getServiceById(id: string): Observable<ServiceResponse> {
    return this.api.get<ServiceResponse>(`${this.endpoint}/${id}`);
  }

  checkAvailability(id: string, date: string): Observable<{ success: boolean; data: AvailabilityCheck }> {
    return this.api.get(`${this.endpoint}/${id}/check-availability`, { date });
  }

  // Protected endpoints
  getMyServices(filters?: ServiceFilters): Observable<ServicesResponse> {
    return this.api.get<ServicesResponse>(`${this.endpoint}/my-services`, filters);
  }

  createService(data: ServiceCreateData): Observable<ServiceResponse> {
    return this.api.post<ServiceResponse>(this.endpoint, data);
  }

  updateService(id: string, data: ServiceUpdateData): Observable<ServiceResponse> {
    return this.api.put<ServiceResponse>(`${this.endpoint}/${id}`, data);
  }

  deleteService(id: string): Observable<any> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }

  updateAvailability(id: string, availability: string, dates?: string[]): Observable<ServiceResponse> {
    return this.api.put<ServiceResponse>(`${this.endpoint}/${id}/availability`, { availability, dates });
  }

  getServiceStats(id: string): Observable<any> {
    return this.api.get(`${this.endpoint}/${id}/stats`);
  }
}
