// src/services/serverDataService.js - Server communication with fallbacks
import { ClientDataService } from './clientDataService.js';

export class ServerDataService {
  // Get all user data from server
  static async getUserData(sessionId) {
    try {
      const response = await fetch(`/api/user-data?sessionId=${sessionId}`, {
        headers: { 'X-Session-ID': sessionId }
      });
      
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      
      const data = await response.json();
      
      // Cache for offline access
      ClientDataService.cacheData('userData', data, 15);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      
      // Fallback to cached data
      const cached = ClientDataService.getCachedData('userData');
      if (cached) {
        console.warn('Using cached user data');
        return cached;
      }
      
      // Final fallback
      return {
        history: [],
        usage: { count: 0, remaining: 10, limit: 10 },
        credits: { extra: 0, expiry: null },
        lastSync: null
      };
    }
  }

  // Submit patch request
  static async submitPatch(sessionId, userInput) {
    const requestData = {
      userInput,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      
      const data = await response.json();
      
      // Update cached user data if provided
      if (data.userData) {
        ClientDataService.cacheData('userData', data.userData, 15);
      }
      
      return data;
    } catch (error) {
      console.error('Patch submission failed:', error);
      throw error;
    }
  }

  // Migrate legacy localStorage data to server
  static async migrateLegacyData(sessionId, legacyData) {
    try {
      console.log('Migrating legacy data to server...');
      
      const response = await fetch('/api/migrate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(legacyData)
      });

      if (!response.ok) throw new Error(`Migration failed: ${response.status}`);
      
      const result = await response.json();
      console.log('Migration successful:', result);
      
      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // Check if user can make request (combines daily + extra credits)
  static async canMakeRequest(sessionId) {
    try {
      const userData = await this.getUserData(sessionId);
      const dailyUsed = userData.usage.count;
      const dailyLimit = userData.usage.limit;
      const extraCredits = userData.credits.extra;
      
      // Can make request if under daily limit OR have extra credits
      const canUse = dailyUsed < dailyLimit || extraCredits > 0;
      const willUseExtra = dailyUsed >= dailyLimit && extraCredits > 0;
      
      return {
        allowed: canUse,
        willUseExtra,
        dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
        extraCredits
      };
    } catch (error) {
      console.error('Error checking request permission:', error);
      return { allowed: false, willUseExtra: false, dailyRemaining: 0, extraCredits: 0 };
    }
  }
}