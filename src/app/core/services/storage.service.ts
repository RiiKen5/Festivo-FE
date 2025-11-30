import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ACCESS_TOKEN_KEY = 'festivo_access_token';
  private readonly REFRESH_TOKEN_KEY = 'festivo_refresh_token';
  private readonly USER_KEY = 'festivo_user';

  // Access Token
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  removeAccessToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  // Refresh Token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  removeRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // User Data
  getUser<T>(): T | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  setUser<T>(user: T): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Generic storage methods
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return item as T;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all festivo data
  clearAll(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
  }
}
