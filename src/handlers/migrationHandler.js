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

      // Migrate extra credits if provided
      if (extraCredits > 0) {
        await DatabaseService.addExtraCredits(sessionId, extraCredits, creditsExpiry);
        console.log('Migrated extra credits:', extraCredits);
      }

      // Update daily usage if higher than current
      if (dailyUsage && dailyUsage.count > 0) {
        const today = new Date().toISOString().split('T')[0];
        if (dailyUsage.date === today || !userData.usage.lastReset) {
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