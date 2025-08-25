// src/handlers/userDataHandler.js - FIXED migration handler
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

// COMPLETELY REWRITTEN migration handler with proper error handling
export const handleMigrationRequest = async (req, res) => {
  let body = '';
  
  req.on('data', chunk => { 
    body += chunk; 
  });

  req.on('end', async () => {
    try {
      const sessionId = req.headers['x-session-id'];
      console.log('🔄 Migration request received for session:', sessionId?.substring(0, 20) + '...');

      if (!sessionId) {
        console.error('❌ No session ID in migration request');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Session ID required in X-Session-ID header' 
        }));
        return;
      }

      // Parse request body with validation
      let legacyData;
      try {
        if (!body || body.trim() === '') {
          console.error('❌ Empty request body in migration');
          throw new Error('Empty request body');
        }
        legacyData = JSON.parse(body);
      } catch (parseError) {
        console.error('❌ Failed to parse migration request body:', parseError.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }));
        return;
      }

      console.log('📦 Migration data received:', {
        historyCount: legacyData.history?.length || 0,
        extraCredits: legacyData.extraCredits || 0,
        dailyUsageCount: legacyData.dailyUsage?.count || 0,
        creditsExpiry: legacyData.creditsExpiry ? 'present' : 'null'
      });

      // Validate legacy data structure
      if (!legacyData || typeof legacyData !== 'object') {
        console.error('❌ Invalid legacy data structure');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid legacy data structure' 
        }));
        return;
      }

      const { history = [], dailyUsage = {}, extraCredits = 0, creditsExpiry = null } = legacyData;

      try {
        // Get existing user data with error handling
        console.log('📚 Fetching existing user data...');
        const userData = await DatabaseService.getUserData(sessionId);
        console.log('✅ Existing user data fetched, history count:', userData.history?.length || 0);

        // Get existing credits to prevent overwriting
        console.log('💳 Checking existing credits...');
        const existingCredits = await DatabaseService.getUserCredits(sessionId);
        console.log('💰 Existing credits:', existingCredits.amount);

        let migratedItems = {
          historyItems: 0,
          extraCredits: 0,
          dailyUsage: 0
        };

        // Migrate history ONLY if user has no existing history
        if (Array.isArray(history) && history.length > 0) {
          if (!userData.history || userData.history.length === 0) {
            console.log('📝 Migrating history items:', history.length);
            userData.history = history.map(item => ({
              ...item,
              migrated: true,
              migratedAt: new Date().toISOString()
            }));
            migratedItems.historyItems = history.length;
          } else {
            console.log('📝 Skipping history migration - user already has history');
          }
        }

        // Migrate extra credits ONLY if user has no existing credits AND legacy has credits
        if (extraCredits > 0) {
          if (existingCredits.amount === 0) {
            console.log('💳 Migrating extra credits:', extraCredits);
            
            // Validate and parse expiry
            let expiryDate = null;
            if (creditsExpiry) {
              try {
                // Handle both timestamp and ISO string formats
                const expiryTimestamp = typeof creditsExpiry === 'string' ? 
                  (creditsExpiry.includes('T') ? new Date(creditsExpiry).getTime() : parseInt(creditsExpiry)) : 
                  creditsExpiry;
                
                expiryDate = new Date(expiryTimestamp);
                
                // Validate the date
                if (isNaN(expiryDate.getTime())) {
                  console.warn('⚠️ Invalid expiry date, setting to 24 hours from now');
                  expiryDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
                }
              } catch (expiryError) {
                console.warn('⚠️ Error parsing expiry date, setting to 24 hours from now:', expiryError.message);
                expiryDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
              }
            } else {
              // Default to 24 hours if no expiry provided
              expiryDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
            }

            const hoursToExpiry = Math.max(1, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60)));
            
            const creditResult = await DatabaseService.addExtraCredits(sessionId, extraCredits, hoursToExpiry);
            console.log('💳 Credit migration result:', creditResult);
            migratedItems.extraCredits = extraCredits;
          } else {
            console.log('💳 Skipping credit migration - user already has credits:', existingCredits.amount);
          }
        }

        // Migrate daily usage if provided and valid
        if (dailyUsage && typeof dailyUsage === 'object' && dailyUsage.count > 0) {
          const today = new Date().toISOString().split('T')[0];
          const migrationDate = dailyUsage.lastReset || dailyUsage.date || today;
          
          // Only migrate if it's for today or user has no usage data
          if (migrationDate === today || !userData.usage.lastReset) {
            console.log('📊 Migrating daily usage:', dailyUsage.count);
            userData.usage.count = Math.max(userData.usage.count || 0, dailyUsage.count);
            userData.usage.lastReset = today;
            migratedItems.dailyUsage = dailyUsage.count;
          } else {
            console.log('📊 Skipping daily usage migration - different date');
          }
        }

        // Save migrated data with retries
        console.log('💾 Saving migrated data...');
        let saveAttempts = 0;
        let saveSuccess = false;
        
        while (saveAttempts < 3 && !saveSuccess) {
          try {
            saveSuccess = await DatabaseService.saveUserData(sessionId, userData);
            if (!saveSuccess) {
              throw new Error('SaveUserData returned false');
            }
            console.log('✅ Data saved successfully on attempt:', saveAttempts + 1);
          } catch (saveError) {
            saveAttempts++;
            console.error(`❌ Save attempt ${saveAttempts} failed:`, saveError.message);
            if (saveAttempts < 3) {
              console.log('🔄 Retrying save in 1 second...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!saveSuccess) {
          throw new Error('Failed to save migrated data after 3 attempts');
        }

        // Return successful migration response
        const response = {
          success: true,
          migrated: migratedItems,
          message: `Successfully migrated ${migratedItems.historyItems} history items, ${migratedItems.extraCredits} credits, and ${migratedItems.dailyUsage} daily usage count`
        };

        console.log('✅ Migration completed successfully:', response);

        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(response));

      } catch (databaseError) {
        console.error('❌ Database error during migration:', databaseError);
        console.error('Database error stack:', databaseError.stack);
        
        // Don't return detailed database errors to client
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Database operation failed',
          retryable: true // Client can retry
        }));
      }

    } catch (outerError) {
      console.error('❌ Outer migration handler error:', outerError);
      console.error('Outer error stack:', outerError.stack);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Migration request failed',
        details: outerError.message,
        retryable: false
      }));
    }
  });

  // Add timeout handler for the request
  req.on('error', (error) => {
    console.error('❌ Request error in migration:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Request processing failed'
      }));
    }
  });
};