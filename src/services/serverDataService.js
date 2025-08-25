// src/services/serverDataService.js - FIXED with hybrid credit checking
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

  // FIXED: Hybrid credit checking - checks both localStorage AND server
  static async canMakeRequest(sessionId) {
    try {
      // Get server data
      const userData = await this.getUserData(sessionId);
      const dailyUsed = userData.usage.count;
      const dailyLimit = userData.usage.limit;
      let extraCredits = userData.credits.extra;
      
      // CRITICAL FIX: Also check localStorage for credits that haven't migrated yet
      const localExtraCredits = parseInt(ClientDataService.safeGet('rp-extra-credits') || '0');
      const localExpiry = ClientDataService.safeGet('rp-extra-credits-expiry');
      
      // Check if local credits are still valid
      let validLocalCredits = 0;
      if (localExtraCredits > 0 && localExpiry) {
        const expiryTime = parseInt(localExpiry);
        if (Date.now() < expiryTime) {
          validLocalCredits = localExtraCredits;
          console.log('🎯 Found valid local credits:', validLocalCredits);
        } else {
          console.log('⏰ Local credits expired');
          // Clean up expired credits
          ClientDataService.safeRemove('rp-extra-credits');
          ClientDataService.safeRemove('rp-extra-credits-expiry');
        }
      }
      
      // Use the HIGHER of server credits or local credits
      // This handles the race condition where credits are in localStorage but not yet migrated
      const totalExtraCredits = Math.max(extraCredits, validLocalCredits);
      
      console.log('💳 Credit check:', {
        serverCredits: extraCredits,
        localCredits: validLocalCredits,
        totalCredits: totalExtraCredits,
        dailyUsed,
        dailyLimit
      });
      
      // Can make request if under daily limit OR have extra credits (from either source)
      const canUse = dailyUsed < dailyLimit || totalExtraCredits > 0;
      const willUseExtra = dailyUsed >= dailyLimit && totalExtraCredits > 0;
      
      return {
        allowed: canUse,
        willUseExtra,
        dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
        extraCredits: totalExtraCredits // Return the higher value
      };
    } catch (error) {
      console.error('Error checking request permission:', error);
      
      // FALLBACK: If server check fails, check localStorage only
      const localExtraCredits = parseInt(ClientDataService.safeGet('rp-extra-credits') || '0');
      const localExpiry = ClientDataService.safeGet('rp-extra-credits-expiry');
      
      let hasLocalCredits = false;
      if (localExtraCredits > 0 && localExpiry) {
        const expiryTime = parseInt(localExpiry);
        hasLocalCredits = Date.now() < expiryTime;
      }
      
      console.log('⚠️ Using fallback credit check:', {
        localCredits: localExtraCredits,
        hasValidLocal: hasLocalCredits
      });
      
      return { 
        allowed: hasLocalCredits, 
        willUseExtra: hasLocalCredits, 
        dailyRemaining: 0, 
        extraCredits: hasLocalCredits ? localExtraCredits : 0 
      };
    }
  }
}