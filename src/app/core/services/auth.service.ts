import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  TokenResponse,
  VerifyEmailResponse
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  private isLoadingSignal = signal<boolean>(true);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.storage.getAccessToken();
    const user = this.storage.getUser<User>();

    if (token && user) {
      this.currentUserSignal.set(user);
      this.isAuthenticatedSignal.set(true);
      this.loadCurrentUser();
    } else {
      this.isLoadingSignal.set(false);
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthSuccess(response);
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthSuccess(response);
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    return this.api.post<any>('/auth/logout', {}).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      }),
      catchError(error => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.storage.getRefreshToken();
    return this.api.post<TokenResponse>('/auth/refresh-token', { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data.accessToken) {
          this.storage.setAccessToken(response.data.accessToken);
        }
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.api.post('/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.api.post('/auth/reset-password', { token, password });
  }

  verifyEmail(token: string): Observable<VerifyEmailResponse> {
    return this.api.post<VerifyEmailResponse>('/auth/verify-email', { token }).pipe(
      tap(response => {
        if (response.success && response.data?.tokens) {
          // Handle the verification response which also logs in the user
          const { user, tokens } = response.data;
          this.storage.setAccessToken(tokens.accessToken);
          this.storage.setRefreshToken(tokens.refreshToken);
          this.storage.setUser(user);
          this.currentUserSignal.set(user);
          this.isAuthenticatedSignal.set(true);
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.api.post('/auth/change-password', { currentPassword, newPassword });
  }

  updateProfile(data: Partial<User>): Observable<any> {
    return this.api.put<any>('/auth/profile', data).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUserSignal.set(response.data);
          this.storage.setUser(response.data);
        }
      })
    );
  }

  loadCurrentUser(): void {
    this.api.get<{ success: boolean; data: User }>('/auth/me').subscribe({
      next: response => {
        if (response.success) {
          this.currentUserSignal.set(response.data);
          this.storage.setUser(response.data);
        }
        this.isLoadingSignal.set(false);
      },
      error: () => {
        this.clearAuth();
        this.isLoadingSignal.set(false);
      }
    });
  }

  private handleAuthSuccess(response: AuthResponse): void {
    const { user, accessToken, refreshToken } = response.data;
    this.storage.setAccessToken(accessToken);
    this.storage.setRefreshToken(refreshToken);
    this.storage.setUser(user);
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
  }

  private clearAuth(): void {
    this.storage.clearAll();
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return user?.role === role;
  }

  isUserType(type: string): boolean {
    const user = this.currentUserSignal();
    return user?.userType === type || user?.userType === 'all';
  }
}
