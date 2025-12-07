import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface FavoriteItem {
  id: string;
  type: 'service' | 'event';
  name: string;
  image?: string;
  savedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly STORAGE_KEY = 'festivo_favorites';

  // Reactive signal for favorites count (can be used in navbar)
  favoritesCount = signal(0);

  constructor() {
    this.loadFavoritesCount();
  }

  private loadFavoritesCount(): void {
    const favorites = this.getFavoritesFromStorage();
    this.favoritesCount.set(favorites.length);
  }

  private getFavoritesFromStorage(): FavoriteItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveFavoritesToStorage(favorites: FavoriteItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      this.favoritesCount.set(favorites.length);
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }

  /**
   * Get all favorites
   */
  getFavorites(): Observable<FavoriteItem[]> {
    return of(this.getFavoritesFromStorage());
  }

  /**
   * Get favorites by type
   */
  getFavoritesByType(type: 'service' | 'event'): Observable<FavoriteItem[]> {
    const favorites = this.getFavoritesFromStorage().filter(f => f.type === type);
    return of(favorites);
  }

  /**
   * Check if an item is favorited
   */
  isFavorite(id: string, type: 'service' | 'event'): boolean {
    const favorites = this.getFavoritesFromStorage();
    return favorites.some(f => f.id === id && f.type === type);
  }

  /**
   * Add item to favorites
   */
  addFavorite(item: Omit<FavoriteItem, 'savedAt'>): Observable<{ success: boolean; message: string }> {
    const favorites = this.getFavoritesFromStorage();

    // Check if already favorited
    if (favorites.some(f => f.id === item.id && f.type === item.type)) {
      return of({ success: false, message: 'Already in favorites' });
    }

    favorites.push({
      ...item,
      savedAt: new Date()
    });

    this.saveFavoritesToStorage(favorites);
    return of({ success: true, message: 'Added to favorites' });
  }

  /**
   * Remove item from favorites
   */
  removeFavorite(id: string, type: 'service' | 'event'): Observable<{ success: boolean; message: string }> {
    const favorites = this.getFavoritesFromStorage();
    const filtered = favorites.filter(f => !(f.id === id && f.type === type));

    if (filtered.length === favorites.length) {
      return of({ success: false, message: 'Item not found in favorites' });
    }

    this.saveFavoritesToStorage(filtered);
    return of({ success: true, message: 'Removed from favorites' });
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(item: Omit<FavoriteItem, 'savedAt'>): Observable<{ success: boolean; isFavorite: boolean; message: string }> {
    const isFav = this.isFavorite(item.id, item.type);

    if (isFav) {
      this.removeFavorite(item.id, item.type);
      return of({ success: true, isFavorite: false, message: 'Removed from favorites' });
    } else {
      this.addFavorite(item);
      return of({ success: true, isFavorite: true, message: 'Added to favorites' });
    }
  }

  /**
   * Clear all favorites
   */
  clearFavorites(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.favoritesCount.set(0);
  }
}
