import { Injectable, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  TokenResponse,
  VerifyEmailResponse,
  RegisterResponse,
  GoogleAuthData
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  private isLoadingSignal = signal<boolean>(true);
  private refreshTokenTimeout: ReturnType<typeof setTimeout> | null = null;
  private refreshSubscription: Subscription | null = null;

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

  ngOnDestroy(): void {
    this.stopRefreshTokenTimer();
    this.refreshSubscription?.unsubscribe();
  }

  private initializeAuth(): void {
    const token = this.storage.getAccessToken();
    const user = this.storage.getUser<User>();

    console.log('initializeAuth: token exists:', !!token, 'user exists:', !!user);

    if (token && user) {
      const isExpired = this.isTokenExpired(token);
      console.log('initializeAuth: token expired:', isExpired);

      // Check if token is expired before restoring session
      if (isExpired) {
        // Token expired, try to refresh
        this.tryRefreshOnInit();
      } else {
        console.log('initializeAuth: Restoring session from valid token');
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
        this.startRefreshTokenTimer(token);
        this.loadCurrentUser();
      }
    } else {
      console.log('initializeAuth: No token or user, setting loading to false');
      this.isLoadingSignal.set(false);
    }
  }

  private tryRefreshOnInit(): void {
    const refreshToken = this.storage.getRefreshToken();
    console.log(refreshToken,"refreshtoken");
    if (!refreshToken) {
      console.log("1");
      this.clearAuth();
      this.isLoadingSignal.set(false);
      return;
    }

    this.refreshSubscription = this.refreshToken().subscribe({
      next: (response) => {
        if (response.success && response.data.accessToken) {
          const user = this.storage.getUser<User>();
          if (user) {
            this.currentUserSignal.set(user);
            this.isAuthenticatedSignal.set(true);
            this.startRefreshTokenTimer(response.data.accessToken);
          }
          this.loadCurrentUser();
        } else {
           console.log("2");
          this.clearAuth();
          this.isLoadingSignal.set(false);
        }
      },
      error: () => {
         console.log("3");
        this.clearAuth();
        this.isLoadingSignal.set(false);
      }
    });
  }

  /**
   * Decode JWT token to get payload (without validation - server validates)
   */
  private decodeToken(token: string): { exp?: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired (with 60 second buffer)
   */
  private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return true;

    const expirationDate = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    return expirationDate <= now + 60000; // 60 second buffer
  }

  /**
   * Start timer to refresh token before it expires
   */
  private startRefreshTokenTimer(token: string): void {
    this.stopRefreshTokenTimer();

    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return;

    const expirationDate = decoded.exp * 1000;
    const now = Date.now();
    // Refresh 2 minutes before expiry, or immediately if less than 2 minutes left
    const timeout = Math.max(0, expirationDate - now - 120000);

    this.refreshTokenTimeout = setTimeout(() => {
      if (this.isAuthenticatedSignal()) {
        this.refreshSubscription?.unsubscribe();
        this.refreshSubscription = this.refreshToken().subscribe({
          next: (response) => {
            if (response.success && response.data.accessToken) {
              this.startRefreshTokenTimer(response.data.accessToken);
            }
          },
          error: () => {
            // Silent failure - interceptor will handle 401 on next request
          }
        });
      }
    }, timeout);
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
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

  register(data: RegisterData): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register', data).pipe(
      tap(response => {
        // If registration returns tokens (email verification disabled), handle auth
        if (response.success && response.data?.tokens) {
          this.handleAuthSuccess(response as unknown as AuthResponse);
        }
        // Otherwise, email verification is required - don't log in yet
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Google OAuth login/register
   */
  googleAuth(data: GoogleAuthData): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/google', data).pipe(
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
         console.log("4");
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      }),
      catchError(error => {
         console.log("5");
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
          this.startRefreshTokenTimer(tokens.accessToken);
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
    console.log('loadCurrentUser: Starting, token:', this.storage.getAccessToken()?.substring(0, 20) + '...');
    this.api.get<{ success: boolean; data: User }>('/auth/me').subscribe({
      next: response => {
        console.log('loadCurrentUser: Success response', response);
        if (response.success) {
          this.currentUserSignal.set(response.data);
          this.storage.setUser(response.data);
        }
        this.isLoadingSignal.set(false);
      },
      error: (error) => {
        console.log('loadCurrentUser: Error', error.status, error.message);
        // Only clear auth on 401 (unauthorized) - other errors might be temporary
        if (error.status === 401) {
          console.log('loadCurrentUser: 401 - clearing auth');
          this.clearAuth();
        }
        this.isLoadingSignal.set(false);
      }
    });
  }

  private handleAuthSuccess(response: AuthResponse): void {
    const user  = response.data.user;
    const {accessToken, refreshToken} = response.data.tokens;
    this.storage.setAccessToken(accessToken);
    this.storage.setRefreshToken(refreshToken);
    this.storage.setUser(user);
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
    this.startRefreshTokenTimer(accessToken);
  }

  private clearAuth(): void {
    this.stopRefreshTokenTimer();
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

  /**
   * Upload avatar/profile photo
   */
  uploadAvatar(formData: FormData): Observable<{ success: boolean; data: { profilePhoto: string } }> {
    return this.api.upload<{ success: boolean; data: { profilePhoto: string } }>('/auth/upload-avatar', formData).pipe(
      tap(response => {
        if (response.success && response.data?.profilePhoto) {
          const currentUser = this.currentUserSignal();
          if (currentUser) {
            const updatedUser = { ...currentUser, profilePhoto: response.data.profilePhoto };
            this.currentUserSignal.set(updatedUser);
            this.storage.setUser(updatedUser);
          }
        }
      })
    );
  }

  /**
   * Toggle 2FA
   */
  toggle2FA(enable: boolean): Observable<any> {
    const endpoint = enable ? '/auth/2fa/enable' : '/auth/2fa/disable';
    return this.api.post<any>(endpoint, {}).pipe(
      tap(response => {
        if (response.success) {
          const currentUser = this.currentUserSignal();
          if (currentUser) {
            const updatedUser = { ...currentUser, twoFactorEnabled: enable };
            this.currentUserSignal.set(updatedUser);
            this.storage.setUser(updatedUser);
          }
        }
      })
    );
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(): Observable<any> {
    return this.api.post('/auth/resend-verification', {});
  }
}
