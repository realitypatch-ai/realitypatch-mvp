// src/handlers/userDataHandler.js - Centralized user data endpoint
import { DatabaseService } from '../services/databaseService.js';
import { DATABASE_CONFIG } from '../config.js';

export const handleUserDataRequest = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session ID required' }));
      return;
    }

    // Get user data from database
    const userData = await DatabaseService.getUserData(sessionId);
    const usageCheck = await DatabaseService.checkUsageLimit(sessionId, DATABASE_CONFIG.dailyRequestLimit);

    // Get extra credits info
    const extraCredits = await DatabaseService.getUserCredits(sessionId);

    const responseData = {
      history: userData.history || [],
      usage: {
        count: usageCheck.count,
        remaining: usageCheck.remaining,
        limit: usageCheck.limit
      },
      credits: {
        extra: extraCredits.amount,
        expiry: extraCredits.expiry
      },
      lastSync: new Date().toISOString()
    };

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(responseData));

  } catch (error) {
    console.error('User data handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch user data' }));
  }
};

// Migration handler for legacy localStorage data
export const handleMigrationRequest = async (req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });

  req.on('end', async () => {
    try {
      const { history, dailyUsage, extraCredits, creditsExpiry } = JSON.parse(body);
      const sessionId = req.headers['x-session-id'];

      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session ID required' }));
        return;
      }

      console.log('Processing data migration for session:', sessionId.substring(0, 20) + '...');

      // Get existing user data
      const userData = await DatabaseService.getUserData(sessionId);

      // Migrate history if provided and doesn't exist
      if (history && history.length > 0 && (!userData.history || userData.history.length === 0)) {
        userData.history = history;
        console.log('Migrated history items:', history.length);
      }

      // Migrate extra credits if provided AND user has no existing credits
      if (extraCredits > 0) {
        const existingCredits = await DatabaseService.getUserCredits(sessionId);
        
        // Only migrate if user currently has no credits (prevents double-counting)
        if (existingCredits.amount === 0) {
          await DatabaseService.addExtraCredits(sessionId, extraCredits, creditsExpiry);
          console.log('Migrated extra credits:', extraCredits);
        } else {
          console.log('Skipping credit migration - user already has credits:', existingCredits.amount);
        }
      }

      // REPLACE the daily usage migration section with:
      // Migrate daily usage if provided
      if (dailyUsage && dailyUsage.count > 0) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        // Use dailyUsage.lastReset if available, otherwise check if it's from today
        const migrationDate = dailyUsage.lastReset || dailyUsage.date;
        
        if (migrationDate === today || !userData.usage.lastReset) {
          userData.usage.count = Math.max(userData.usage.count, dailyUsage.count);
          userData.usage.lastReset = today;
        }
      }

      // Save migrated data
      await DatabaseService.saveUserData(sessionId, userData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        migrated: {
          historyItems: history?.length || 0,
          extraCredits: extraCredits || 0,
          dailyUsage: dailyUsage?.count || 0
        }
      }));

    } catch (error) {
      console.error('Migration handler error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Migration failed' }));
    }
  });
};