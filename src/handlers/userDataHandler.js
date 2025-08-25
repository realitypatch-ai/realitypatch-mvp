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

// FIXED handleMigrationRequest with robust error handling and verification
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

        // CRITICAL FIX: Migrate extra credits with PROPER VERIFICATION
        if (extraCredits > 0) {
          if (existingCredits.amount === 0) {
            console.log('💳 Attempting to migrate extra credits:', extraCredits);
            
            // Validate and parse expiry
            let expiryDate = null;
            if (creditsExpiry) {
              try {
                const expiryTimestamp = typeof creditsExpiry === 'string' ? 
                  (creditsExpiry.includes('T') ? new Date(creditsExpiry).getTime() : parseInt(creditsExpiry)) : 
                  creditsExpiry;
                
                expiryDate = new Date(expiryTimestamp);
                
                if (isNaN(expiryDate.getTime())) {
                  console.warn('⚠️ Invalid expiry date, setting to 24 hours from now');
                  expiryDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
                }
              } catch (expiryError) {
                console.warn('⚠️ Error parsing expiry date, setting to 24 hours from now:', expiryError.message);
                expiryDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
              }
            } else {
              expiryDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
            }

            const hoursToExpiry = Math.max(1, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60)));
            
            // CRITICAL: Actually attempt to add credits and VERIFY success
            console.log('💳 Adding credits to database...', { extraCredits, hoursToExpiry });
            const creditResult = await DatabaseService.addExtraCredits(sessionId, extraCredits, hoursToExpiry);
            console.log('💳 Credit addition result:', creditResult);
            
            // VERIFY the credits were actually added
            if (!creditResult || !creditResult.success) {
              console.error('❌ Failed to add credits to database:', creditResult);
              throw new Error('Credit migration failed - database rejected the credits');
            }
            
            // Double-check by fetching credits again
            const verifyCredits = await DatabaseService.getUserCredits(sessionId);
            console.log('🔍 Verification check - credits in database:', verifyCredits.amount);
            
            if (verifyCredits.amount < extraCredits) {
              console.error('❌ Credit verification failed:', {
                expected: extraCredits,
                actual: verifyCredits.amount
              });
              throw new Error(`Credit verification failed - expected ${extraCredits}, got ${verifyCredits.amount}`);
            }
            
            console.log('✅ Credits successfully verified in database');
            migratedItems.extraCredits = extraCredits;
          } else {
            console.log('💳 Skipping credit migration - user already has credits:', existingCredits.amount);
          }
        }

        // Migrate daily usage if provided and valid
        if (dailyUsage && typeof dailyUsage === 'object' && dailyUsage.count > 0) {
          const today = new Date().toISOString().split('T')[0];
          const migrationDate = dailyUsage.lastReset || dailyUsage.date || today;
          
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
        console.log('💾 Saving migrated user data...');
        let saveAttempts = 0;
        let saveSuccess = false;
        
        while (saveAttempts < 3 && !saveSuccess) {
          try {
            saveSuccess = await DatabaseService.saveUserData(sessionId, userData);
            if (!saveSuccess) {
              throw new Error('SaveUserData returned false');
            }
            console.log('✅ User data saved successfully on attempt:', saveAttempts + 1);
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
          throw new Error('Failed to save migrated user data after 3 attempts');
        }

        // FINAL VERIFICATION: Ensure everything is actually in the database
        console.log('🔍 Final verification of migrated data...');
        const finalUserData = await DatabaseService.getUserData(sessionId);
        const finalCredits = await DatabaseService.getUserCredits(sessionId);
        
        console.log('📊 Final verification results:', {
          historyCount: finalUserData.history?.length || 0,
          creditsInDb: finalCredits.amount,
          usageCount: finalUserData.usage?.count || 0
        });
        
        // If credits were supposed to be migrated but aren't in DB, fail the migration
        if (migratedItems.extraCredits > 0 && finalCredits.amount === 0) {
          throw new Error('Credit migration verification failed - credits not found in database');
        }

        // Return successful migration response
        const response = {
          success: true,
          migrated: migratedItems,
          verified: {
            historyCount: finalUserData.history?.length || 0,
            creditsInDb: finalCredits.amount,
            usageCount: finalUserData.usage?.count || 0
          },
          message: `Successfully migrated ${migratedItems.historyItems} history items, ${migratedItems.extraCredits} credits, and ${migratedItems.dailyUsage} daily usage count`
        };

        console.log('✅ Migration completed and verified successfully:', response);

        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(response));

      } catch (databaseError) {
        console.error('❌ Database error during migration:', databaseError);
        console.error('Database error stack:', databaseError.stack);
        
        // CRITICAL: Don't clear localStorage if database operations failed
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Database operation failed',
          details: databaseError.message,
          retryable: true, // Client can retry
          preserveLocalData: true // Don't clear localStorage
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
        retryable: false,
        preserveLocalData: true // Don't clear localStorage on error
      }));
    }
  });

  req.on('error', (error) => {
    console.error('❌ Request error in migration:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Request processing failed',
        preserveLocalData: true
      }));
    }
  });
};