import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface UsersResponse {
  success: boolean;
  count: number;
  data: User[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private endpoint = '/users';

  constructor(private api: ApiService) {}

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  getUserById(id: string): Observable<UserResponse> {
    return this.api.get<UserResponse>(`${this.endpoint}/${id}`);
  }

  /**
   * Get public user profile
   * GET /api/v1/users/:id/profile
   */
  getUserProfile(id: string): Observable<UserResponse> {
    return this.api.get<UserResponse>(`${this.endpoint}/${id}/profile`);
  }

  /**
   * Search users
   * GET /api/v1/users/search
   */
  searchUsers(query: string): Observable<UsersResponse> {
    return this.api.get<UsersResponse>(`${this.endpoint}/search`, { q: query });
  }
}
