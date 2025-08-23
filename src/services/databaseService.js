// src/services/databaseService.js
// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import { Redis } from '@upstash/redis';
import { DATABASE_CONFIG } from '../config.js';

// Debug environment variables
console.log('🔍 DatabaseService environment variables check:');
console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'SET' : 'MISSING');
console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'SET' : 'MISSING');

// Validate required environment variables
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('❌ Missing required Upstash Redis environment variables');
  throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN are required');
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Test Redis connection
const testConnection = async () => {
  try {
    console.log('🧪 Testing Redis connection...');
    await redis.set('test', 'Hello Redis!');
    const result = await redis.get('test');
    console.log('✅ Redis connection successful! Test value:', result);
    await redis.del('test'); // Clean up
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    throw error; // Re-throw to prevent app startup if Redis fails
  }
};

// Run test on startup
testConnection();

// UTC date utilities
const getUTCDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD in UTC
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
      // Set expiration using config value
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
    
    userData.history.push({
      ...interaction,
      timestamp: getUTCTimestamp(),
      id: Date.now(),
      completed: false // Add completion tracking
    });

    // Keep only last N interactions using config value
    if (userData.history.length > DATABASE_CONFIG.maxHistoryPerUser) {
      userData.history = userData.history.slice(-DATABASE_CONFIG.maxHistoryPerUser);
    }

    // Update usage count (daily reset using UTC)
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
      const userData = await this.getUserData(userId);
      const assignment = userData.history.find(item => 
        item.id === assignmentId || 
        (item.timestamp && new Date(item.timestamp).getTime() === assignmentId)
      );
      
      if (assignment) {
        assignment.completed = true;
        assignment.completedAt = getUTCTimestamp();
        await this.saveUserData(userId, userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Mark assignment completed error:', error);
      return false;
    }
  }

  // Check if user has exceeded daily limit
  static async checkUsageLimit(userId, dailyLimit = DATABASE_CONFIG.dailyRequestLimit) {
    const userData = await this.getUserData(userId);
    const todayUTC = getUTCDateString();
    
    // Reset count if new day (UTC)
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
      
      // Get usage for today (UTC)
      const todayUTC = getUTCDateString();
      let dailyUsage = 0;
      
      // Sample users to estimate daily usage
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
}