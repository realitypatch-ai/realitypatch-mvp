// src/handlers/userDataHandler.js - FIXED migration with comprehensive error handling
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

    const userData = await DatabaseService.getUserData(sessionId);
    const usageCheck = await DatabaseService.checkUsageLimit(sessionId, DATABASE_CONFIG.dailyRequestLimit);
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

// COMPREHENSIVE FIXED migration handler with bulletproof credit handling
export const handleMigrationRequest = async (req, res) => {
  let body = '';
  
  req.on('data', chunk => { 
    body += chunk; 
  });

  req.on('end', async () => {
    let sessionId;
    
    try {
      sessionId = req.headers['x-session-id'];
      console.log('🔄 Migration request received for session:', sessionId?.substring(0, 20) + '...');

      if (!sessionId) {
        console.error('❌ No session ID in migration request');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Session ID required in X-Session-ID header',
          preserveLocalData: true
        }));
        return;
      }

      // Parse and validate request body
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
          details: parseError.message,
          preserveLocalData: true
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
          error: 'Invalid legacy data structure',
          preserveLocalData: true
        }));
        return;
      }

      const { history = [], dailyUsage = {}, extraCredits = 0, creditsExpiry = null } = legacyData;

      // Get existing user data with error handling
      console.log('📚 Fetching existing user data...');
      let userData;
      try {
        userData = await DatabaseService.getUserData(sessionId);
        console.log('✅ Existing user data fetched, history count:', userData.history?.length || 0);
      } catch (error) {
        console.error('❌ Failed to fetch existing user data:', error);
        throw new Error(`Database read failed: ${error.message}`);
      }

      // Get existing credits to prevent overwriting
      console.log('💳 Checking existing credits...');
      let existingCredits;
      try {
        existingCredits = await DatabaseService.getUserCredits(sessionId);
        console.log('💰 Existing credits:', existingCredits.amount);
      } catch (error) {
        console.error('❌ Failed to fetch existing credits:', error);
        throw new Error(`Credits check failed: ${error.message}`);
      }

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

      // CRITICAL SECTION: Credit migration with comprehensive error handling
      if (extraCredits > 0) {
        if (existingCredits.amount === 0) {
          console.log('💳 Attempting to migrate extra credits:', extraCredits);
          
          try {
            // Validate and parse expiry
            let expiryHours = 24; // Default to 24 hours
            
            if (creditsExpiry) {
              try {
                const expiryTimestamp = typeof creditsExpiry === 'string' ? 
                  (creditsExpiry.includes('T') ? new Date(creditsExpiry).getTime() : parseInt(creditsExpiry)) : 
                  creditsExpiry;
                
                const expiryDate = new Date(expiryTimestamp);
                
                if (!isNaN(expiryDate.getTime()) && expiryDate.getTime() > Date.now()) {
                  expiryHours = Math.max(1, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60)));
                  console.log('📅 Parsed expiry hours from legacy data:', expiryHours);
                } else {
                  console.warn('⚠️ Invalid or expired legacy expiry date, using 24 hours');
                }
              } catch (expiryError) {
                console.warn('⚠️ Error parsing expiry date:', expiryError.message);
              }
            }

            // CRITICAL: Use the FIXED addExtraCredits method
            console.log('💳 Calling DatabaseService.addExtraCredits...', { extraCredits, expiryHours });
            const creditResult = await DatabaseService.addExtraCredits(sessionId, extraCredits, expiryHours);
            
            console.log('💳 Credit addition result:', creditResult);
            
            // Check if the operation was successful using the new response format
            if (!creditResult || !creditResult.success) {
              const errorMsg = creditResult?.error || 'Unknown credit addition error';
              console.error('❌ Failed to add credits to database:', errorMsg);
              throw new Error(`Credit migration failed: ${errorMsg}`);
            }
            
            // TRIPLE VERIFICATION: Multiple checks to ensure credits are actually saved
            console.log('🔍 Triple verification of credit migration...');
            
            // Check 1: Verify the response contains expected values
            if (creditResult.total < extraCredits) {
              throw new Error(`Credit response verification failed - expected total >= ${extraCredits}, got ${creditResult.total}`);
            }
            
            // Check 2: Re-fetch credits from database
            let verifyCredits;
            let verificationAttempts = 0;
            const maxVerificationAttempts = 3;
            
            while (verificationAttempts < maxVerificationAttempts) {
              try {
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for database consistency
                verifyCredits = await DatabaseService.getUserCredits(sessionId);
                break;
              } catch (verifyError) {
                verificationAttempts++;
                console.warn(`Credit verification attempt ${verificationAttempts} failed:`, verifyError.message);
                if (verificationAttempts === maxVerificationAttempts) {
                  throw new Error(`Credit verification failed after ${maxVerificationAttempts} attempts`);
                }
              }
            }
            
            console.log('🔍 Database verification - credits found:', verifyCredits.amount);
            
            if (verifyCredits.amount < extraCredits) {
              throw new Error(`Database verification failed - expected >= ${extraCredits}, got ${verifyCredits.amount}`);
            }
            
            // Check 3: Verify credits are not expired
            if (verifyCredits.expiry) {
              const expiryTime = new Date(verifyCredits.expiry);
              if (expiryTime.getTime() <= Date.now()) {
                throw new Error('Migrated credits are already expired');
              }
            }
            
            console.log('✅ Triple verification passed - credits successfully migrated and verified');
            migratedItems.extraCredits = extraCredits;
            
          } catch (creditError) {
            console.error('❌ Credit migration failed:', creditError);
            // Don't throw here - we want to continue with other migration items
            // But mark this as a critical failure
            migratedItems.creditMigrationFailed = true;
            migratedItems.creditError = creditError.message;
          }
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

      // Save migrated data with retry logic
      if (migratedItems.historyItems > 0 || migratedItems.dailyUsage > 0) {
        console.log('💾 Saving migrated user data...');
        let saveAttempts = 0;
        let saveSuccess = false;
        const maxSaveAttempts = 3;
        
        while (saveAttempts < maxSaveAttempts) {
          try {
            saveSuccess = await DatabaseService.saveUserData(sessionId, userData);
            if (saveSuccess) {
              break;
            } else {
              throw new Error('SaveUserData returned false');
            }
          } catch (saveError) {
            saveAttempts++;
            console.error(`Save attempt ${saveAttempts} failed:`, saveError.message);
            if (saveAttempts < maxSaveAttempts) {
              console.log('🔄 Retrying save in 1 second...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!saveSuccess) {
          throw new Error('Failed to save migrated user data after 3 attempts');
        }
      }

      // Final verification of all migrated data
      console.log('🔍 Final verification of migrated data...');
      const finalUserData = await DatabaseService.getUserData(sessionId);
      const finalCredits = await DatabaseService.getUserCredits(sessionId);
      
      console.log('📊 Final verification results:', {
        historyCount: finalUserData.history?.length || 0,
        creditsInDb: finalCredits.amount,
        usageCount: finalUserData.usage?.count || 0
      });
      
      // Check if credit migration was requested but failed
      if (extraCredits > 0 && migratedItems.creditMigrationFailed) {
        console.error('❌ Credit migration failed but other data may have succeeded');
        
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Credit migration failed',
          details: migratedItems.creditError,
          partialSuccess: true,
          migrated: {
            historyItems: migratedItems.historyItems,
            dailyUsage: migratedItems.dailyUsage,
            extraCredits: 0 // Failed to migrate credits
          },
          retryable: true,
          preserveLocalData: true // CRITICAL: Keep localStorage credits safe
        }));
        return;
      }

      // Success response
      const response = {
        success: true,
        migrated: migratedItems,
        verified: {
          historyCount: finalUserData.history?.length || 0,
          creditsInDb: finalCredits.amount,
          usageCount: finalUserData.usage?.count || 0
        },
        message: `Successfully migrated ${migratedItems.historyItems} history items, ${migratedItems.extraCredits} credits, and ${migratedItems.dailyUsage} daily usage count`,
        preserveLocalData: false // Safe to clear localStorage now
      };

      console.log('✅ Migration completed successfully:', response);

      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(response));

    } catch (outerError) {
      console.error('❌ Migration handler error:', outerError);
      console.error('Error stack:', outerError.stack);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Migration request failed',
        details: outerError.message,
        retryable: true,
        preserveLocalData: true // Always preserve localStorage on errors
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