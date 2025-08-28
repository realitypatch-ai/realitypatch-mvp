// src/services/databaseService.js - FIXED credit management with proper verification
import dotenv from 'dotenv';
dotenv.config();

import { Redis } from '@upstash/redis';
import { DATABASE_CONFIG } from '../config.js';

// Debug environment variables
console.log('🔍 DatabaseService environment variables check:');
console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'SET' : 'MISSING');
console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'SET' : 'MISSING');

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('❌ Missing required Upstash Redis environment variables');
  throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN are required');
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Test Redis connection on startup
const testConnection = async () => {
  try {
    console.log('🧪 Testing Redis connection...');
    await redis.set('test', 'Hello Redis!');
    const result = await redis.get('test');
    console.log('✅ Redis connection successful! Test value:', result);
    await redis.del('test');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    throw error;
  }
};

testConnection();

const getUTCDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getUTCTimestamp = () => {
  return new Date().toISOString();
};

export class DatabaseService {
  // Get user data by ID
  static async getUserData(userId) {
    try {
      const userData = await redis.get(`user:${userId}`);
      return userData || {
        history: [],
        usage: { count: 0, lastReset: getUTCDateString() },
        createdAt: getUTCTimestamp()
      };
    } catch (error) {
      console.error('Database get error:', error);
      return {
        history: [],
        usage: { count: 0, lastReset: getUTCDateString() },
        createdAt: getUTCTimestamp()
      };
    }
  }

  // Save user data
  static async saveUserData(userId, userData) {
    try {
      await redis.set(`user:${userId}`, userData);
      const retentionSeconds = DATABASE_CONFIG.dataRetentionDays * 24 * 60 * 60;
      await redis.expire(`user:${userId}`, retentionSeconds);
      return true;
    } catch (error) {
      console.error('Database save error:', error);
      return false;
    }
  }

  // Add interaction to user history
  static async addInteraction(userId, interaction) {
    const userData = await this.getUserData(userId);
    
    const interactionId = interaction.id || Date.now();
    
    const newInteraction = {
      ...interaction,
      timestamp: getUTCTimestamp(),
      id: interactionId,
      completed: false
    };
    
    userData.history.push(newInteraction);

    if (userData.history.length > DATABASE_CONFIG.maxHistoryPerUser) {
      userData.history = userData.history.slice(-DATABASE_CONFIG.maxHistoryPerUser);
    }

    const todayUTC = getUTCDateString();
    if (userData.usage.lastReset !== todayUTC) {
      userData.usage.count = 0;
      userData.usage.lastReset = todayUTC;
    }
    userData.usage.count += 1;

    await this.saveUserData(userId, userData);
    return userData;
  }

  // Mark assignment as completed
  static async markAssignmentCompleted(userId, assignmentId) {
    try {
      console.log('🎯 Attempting to mark assignment completed:', {
        userId: userId.substring(0, 20) + '...',
        assignmentId: assignmentId
      });
      
      const userData = await this.getUserData(userId);
      console.log('📚 User history count:', userData.history.length);
      
      let assignment = null;
      
      // Strategy 1: Direct ID match
      assignment = userData.history.find(item => {
        const match = item.id === assignmentId || item.id === String(assignmentId) || String(item.id) === String(assignmentId);
        if (match) {
          console.log('✅ Found by direct ID match:', { itemId: item.id, searchId: assignmentId });
        }
        return match;
      });
      
      // Strategy 2: Timestamp-based matching
      if (!assignment) {
        assignment = userData.history.find(item => {
          if (!item.timestamp) return false;
          const itemTimestamp = new Date(item.timestamp).getTime();
          const match = itemTimestamp === assignmentId || String(itemTimestamp) === String(assignmentId);
          if (match) {
            console.log('✅ Found by timestamp match:', { itemTimestamp, searchId: assignmentId });
          }
          return match;
        });
      }
      
      // Strategy 3: Find most recent uncompleted assignment
      if (!assignment) {
        const uncompletedAssignments = userData.history
          .filter(item => 
            item.response && 
            item.response.toLowerCase().includes('your assignment:') &&
            !item.isFollowUp &&
            !item.completed
          )
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        if (uncompletedAssignments.length > 0) {
          assignment = uncompletedAssignments[0];
          console.log('✅ Found most recent uncompleted assignment as fallback');
        }
      }
      
      if (assignment) {
        console.log('🎯 Marking assignment as completed:', {
          id: assignment.id,
          input: assignment.input?.substring(0, 30) + '...',
          timestamp: assignment.timestamp,
          wasCompleted: assignment.completed
        });
        
        assignment.completed = true;
        assignment.completedAt = getUTCTimestamp();
        
        const saveSuccess = await this.saveUserData(userId, userData);
        console.log('💾 Save result:', saveSuccess);
        
        return true;
      } else {
        console.log('❌ Could not find assignment to complete with ID:', assignmentId);
        return false;
      }
    } catch (error) {
      console.error('Mark assignment completed error:', error);
      return false;
    }
  }

  // Check if user has exceeded daily limit
  static async checkUsageLimit(userId, dailyLimit = DATABASE_CONFIG.dailyRequestLimit) {
    const userData = await this.getUserData(userId);
    const todayUTC = getUTCDateString();
    
    if (userData.usage.lastReset !== todayUTC) {
      return { allowed: true, count: 0, limit: dailyLimit };
    }
    
    const allowed = userData.usage.count < dailyLimit;
    return { 
      allowed, 
      count: userData.usage.count, 
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - userData.usage.count)
    };
  }

  // Get analytics data
  static async getAnalytics() {
    try {
      const keys = await redis.keys('user:*');
      const totalUsers = keys.length;
      
      const todayUTC = getUTCDateString();
      let dailyUsage = 0;
      
      const sampleSize = Math.min(10, keys.length);
      for (let i = 0; i < sampleSize; i++) {
        const userData = await redis.get(keys[i]);
        if (userData && userData.usage.lastReset === todayUTC) {
          dailyUsage += userData.usage.count;
        }
      }

      const estimatedDailyUsage = sampleSize > 0 ? 
        Math.round(dailyUsage * (totalUsers / sampleSize)) : 0;

      return {
        totalUsers,
        estimatedDailyUsage
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return { totalUsers: 0, estimatedDailyUsage: 0 };
    }
  }

  // FIXED: Enhanced addExtraCredits with proper error handling and verification
  static async addExtraCredits(userId, amount, expiryHours = 24) {
    try {
      console.log('💳 Adding extra credits:', { userId: userId.substring(0, 20) + '...', amount, expiryHours });
      
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        throw new Error('Valid userId is required');
      }
      
      if (!amount || amount <= 0 || !Number.isInteger(amount)) {
        throw new Error('Amount must be a positive integer');
      }
      
      if (!expiryHours || expiryHours <= 0) {
        throw new Error('ExpiryHours must be a positive number');
      }

      // Get current user data with retry logic
      let userData;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          userData = await this.getUserData(userId);
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error(`Failed to get user data after ${maxAttempts} attempts: ${error.message}`);
          }
          console.warn(`Attempt ${attempts} to get user data failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const currentCredits = userData.extraCredits || 0;
      const newTotal = currentCredits + amount;
      
      // Calculate expiry time
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + expiryHours);
      const expiryISO = expiry.toISOString();
      
      console.log('💳 Credit calculation:', {
        currentCredits,
        amountToAdd: amount,
        newTotal,
        expiryISO
      });
      
      // Update user data
      userData.extraCredits = newTotal;
      userData.creditsExpiry = expiryISO;
      userData.lastCreditUpdate = getUTCTimestamp();
      
      // Save with retry logic and verification
      let saveSuccess = false;
      attempts = 0;
      
      while (attempts < maxAttempts) {
        try {
          saveSuccess = await this.saveUserData(userId, userData);
          if (saveSuccess) {
            break;
          } else {
            throw new Error('SaveUserData returned false');
          }
        } catch (error) {
          attempts++;
          console.error(`Save attempt ${attempts} failed:`, error.message);
          if (attempts === maxAttempts) {
            throw new Error(`Failed to save user data after ${maxAttempts} attempts: ${error.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!saveSuccess) {
        throw new Error('Failed to save credits to database');
      }
      
      // CRITICAL: Verify the credits were actually saved by reading them back
      console.log('🔍 Verifying credits were saved...');
      const verificationData = await this.getUserData(userId);
      
      if (!verificationData.extraCredits || verificationData.extraCredits < newTotal) {
        throw new Error(`Credit verification failed - expected ${newTotal}, got ${verificationData.extraCredits || 0}`);
      }
      
      console.log('✅ Credits successfully added and verified:', {
        added: amount,
        total: newTotal,
        expiry: expiryISO,
        verified: verificationData.extraCredits
      });
      
      return { 
        success: true,  // CRITICAL: This was missing!
        added: amount, 
        total: newTotal, 
        expiry: expiryISO,
        verified: true
      };
      
    } catch (error) {
      console.error('❌ Add extra credits failed:', error);
      return {
        success: false,
        error: error.message,
        added: 0,
        total: 0,
        expiry: null,
        verified: false
      };
    }
  }

  // FIXED: Enhanced useExtraCredit with better error handling
  static async useExtraCredit(userId) {
    try {
      const userData = await this.getUserData(userId);
      
      if (!userData.extraCredits || userData.extraCredits <= 0) {
        return { success: false, reason: 'No credits available' };
      }
      
      if (userData.creditsExpiry && new Date() > new Date(userData.creditsExpiry)) {
        userData.extraCredits = 0;
        userData.creditsExpiry = null;
        await this.saveUserData(userId, userData);
        return { success: false, reason: 'Credits expired' };
      }
      
      userData.extraCredits -= 1;
      const saveSuccess = await this.saveUserData(userId, userData);
      
      if (!saveSuccess) {
        throw new Error('Failed to save after using credit');
      }
      
      return { success: true, remaining: userData.extraCredits };
    } catch (error) {
      console.error('Use extra credit failed:', error);
      return { success: false, reason: error.message };
    }
  }

  // FIXED: Enhanced getUserCredits with expiry cleanup
  static async getUserCredits(userId) {
    try {
      const userData = await this.getUserData(userId);
      
      // Clean up expired credits
      if (userData.creditsExpiry && new Date() > new Date(userData.creditsExpiry)) {
        const hadCredits = userData.extraCredits > 0;
        userData.extraCredits = 0;
        userData.creditsExpiry = null;
        
        if (hadCredits) {
          await this.saveUserData(userId, userData);
          console.log('🧹 Cleaned up expired credits for user');
        }
      }
      
      return {
        amount: userData.extraCredits || 0,
        expiry: userData.creditsExpiry
      };
    } catch (error) {
      console.error('Get user credits failed:', error);
      return {
        amount: 0,
        expiry: null
      };
    }
  }
}