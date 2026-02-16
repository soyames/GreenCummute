import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() {}

  // Set item
  async set(key: string, value: any): Promise<void> {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value)
      });
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  }

  // Get item
  async get(key: string): Promise<any> {
    try {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  // Remove item
  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  // Clear all
  async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Get all keys
  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }

  // Favorite routes storage
  async saveFavoriteRoute(route: any): Promise<void> {
    const favorites = await this.getFavoriteRoutes();
    favorites.push(route);
    await this.set('favoriteRoutes', favorites);
  }

  async getFavoriteRoutes(): Promise<any[]> {
    return (await this.get('favoriteRoutes')) || [];
  }

  async removeFavoriteRoute(routeId: string): Promise<void> {
    const favorites = await this.getFavoriteRoutes();
    const filtered = favorites.filter(r => r.id !== routeId);
    await this.set('favoriteRoutes', filtered);
  }

  // Recent searches storage
  async saveRecentSearch(search: { from: string; to: string }): Promise<void> {
    const recent = await this.getRecentSearches();
    recent.unshift(search);
    
    // Keep only last 10 searches
    const unique = recent.filter((s, i, arr) => 
      arr.findIndex(x => x.from === s.from && x.to === s.to) === i
    ).slice(0, 10);
    
    await this.set('recentSearches', unique);
  }

  async getRecentSearches(): Promise<any[]> {
    return (await this.get('recentSearches')) || [];
  }

  // User preferences cache
  async saveUserPreferences(preferences: any): Promise<void> {
    await this.set('userPreferences', preferences);
  }

  async getUserPreferences(): Promise<any> {
    return await this.get('userPreferences');
  }
}
