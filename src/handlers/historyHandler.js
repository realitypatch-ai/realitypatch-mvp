// src/handlers/historyHandler.js - Handle history requests with database
import { DatabaseService } from '../services/databaseService.js';
import { DATABASE_CONFIG } from '../config.js';

export const handleHistoryRequest = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    
    let history = [];
    let usage = { count: 0, remaining: DATABASE_CONFIG.dailyRequestLimit };
    
    if (sessionId) {
      const userData = await DatabaseService.getUserData(sessionId);
      history = userData.history || [];
      
      // Get current usage info using config value
      const usageCheck = await DatabaseService.checkUsageLimit(sessionId, DATABASE_CONFIG.dailyRequestLimit);
      usage = {
        count: usageCheck.count,
        remaining: usageCheck.remaining,
        limit: usageCheck.limit
      };
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ history, usage }));
    
  } catch (error) {
    console.error('History handler error:', error);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      history: [], 
      usage: { 
        count: 0, 
        remaining: DATABASE_CONFIG.dailyRequestLimit,
        limit: DATABASE_CONFIG.dailyRequestLimit
      } 
    }));
  }
};