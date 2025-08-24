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

  // FIXED: Add interaction to user history with consistent ID handling
  static async addInteraction(userId, interaction) {
    const userData = await this.getUserData(userId);
    
    // Use provided ID or generate timestamp-based ID
    const interactionId = interaction.id || Date.now();
    
    const newInteraction = {
      ...interaction,
      timestamp: getUTCTimestamp(),
      id: interactionId, // Use consistent ID
      completed: false // Add completion tracking
    };
    
    userData.history.push(newInteraction);

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

  // FIXED: Enhanced mark assignment as completed with better ID matching
  static async markAssignmentCompleted(userId, assignmentId) {
    try {
      console.log('🎯 Attempting to mark assignment completed:', {
        userId: userId.substring(0, 20) + '...',
        assignmentId: assignmentId
      });
      
      const userData = await this.getUserData(userId);
      console.log('📚 User history count:', userData.history.length);
      
      // Try multiple matching strategies
      let assignment = null;
      
      // Strategy 1: Direct ID match (number to number comparison)
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
      
      // Strategy 3: Find most recent uncompleted assignment with an assignment
      if (!assignment) {
        const uncompletedAssignments = userData.history
          .filter(item => 
            item.response && 
            item.response.toLowerCase().includes('your assignment:') &&
            !item.isFollowUp &&
            !item.completed
          )
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Most recent first
        
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
        console.log('📋 Available assignments:');
        userData.history
          .filter(item => item.response && item.response.toLowerCase().includes('your assignment:'))
          .forEach((item, idx) => {
            console.log(`   ${idx + 1}. ID: ${item.id}, Timestamp: ${new Date(item.timestamp).getTime()}, Input: "${item.input?.substring(0, 30)}...", Completed: ${item.completed}`);
          });
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