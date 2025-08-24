// src/services/clientDataService.js - Safe localStorage handling
export class ClientDataService {
  static SESSION_KEY = 'rp-session-id';
  static PREFERENCES_KEY = 'rp-preferences';
  static CACHE_KEY = 'rp-cache';

  // Safe localStorage operations
  static safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage get failed:', key);
      return null;
    }
  }

  static safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage set failed:', key);
      return false;
    }
  }

  static safeRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage remove failed:', key);
      return false;
    }
  }

  // Session ID management
  static getOrCreateSessionId() {
    let sessionId = this.safeGet(this.SESSION_KEY);
    
    if (!sessionId) {
      sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.safeSet(this.SESSION_KEY, sessionId);
    }
    
    return sessionId;
  }

  // UI Preferences (non-critical data)
  static getPreferences() {
    try {
      const stored = this.safeGet(this.PREFERENCES_KEY);
      return stored ? JSON.parse(stored) : { historyVisible: true };
    } catch (error) {
      return { historyVisible: true };
    }
  }

  static savePreferences(preferences) {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      this.safeSet(this.PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Cannot save preferences');
    }
  }

  // Data caching for performance
  static cacheData(key, data, expiryMinutes = 30) {
    try {
      const cacheItem = {
        data,
        expiry: Date.now() + (expiryMinutes * 60 * 1000),
        timestamp: Date.now()
      };
      this.safeSet(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Cannot cache data');
    }
  }

  static getCachedData(key) {
    try {
      const stored = this.safeGet(`cache_${key}`);
      if (!stored) return null;
      
      const item = JSON.parse(stored);
      if (Date.now() < item.expiry) {
        return item.data;
      }
      
      // Clean expired data
      this.safeRemove(`cache_${key}`);
      return null;
    } catch (error) {
      return null;
    }
  }

  // Legacy data detection for migration
  static hasLegacyData() {
    return !!(this.safeGet('rp-history') || 
              this.safeGet('rp-daily-usage') || 
              this.safeGet('rp-extra-credits'));
  }

  static getLegacyData() {
    try {
      const history = JSON.parse(this.safeGet('rp-history') || '[]');
      const dailyUsage = JSON.parse(this.safeGet('rp-daily-usage') || '{}');
      const extraCredits = parseInt(this.safeGet('rp-extra-credits') || '0');
      const creditsExpiry = this.safeGet('rp-extra-credits-expiry');
      
      return { history, dailyUsage, extraCredits, creditsExpiry };
    } catch (error) {
      return { history: [], dailyUsage: {}, extraCredits: 0, creditsExpiry: null };
    }
  }

  static clearLegacyData() {
    this.safeRemove('rp-history');
    this.safeRemove('rp-daily-usage');
    this.safeRemove('rp-extra-credits');
    this.safeRemove('rp-extra-credits-expiry');
    this.safeRemove('rp-history-visible');
  }
}