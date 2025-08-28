// src/router.js - Main request router with payment success route
import { handleHistoryRequest } from './handlers/historyHandler.js';
import { handlePatchRequest } from './handlers/patchHandler.js';
import { handleStaticRequest } from './handlers/staticHandler.js';
import { handleUserDataRequest, handleMigrationRequest } from './handlers/userDataHandler.js';
import { handlePaymentSuccessRequest } from './handlers/paymentSuccessHandler.js';
import { setCorsHeaders } from './utils/cors.js';

export const router = async (req, res) => {
  // Enable CORS for all requests
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Debug endpoint to check deployed files
    if (req.method === 'GET' && req.url === '/debug-files') {
      const fs = await import('fs');
      try {
        const files = fs.readdirSync(process.cwd());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          cwd: process.cwd(),
          files: files 
        }, null, 2));
        return;
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error: ' + error.message);
        return;
      }
    }

    // Route requests
    if (req.method === 'GET' && req.url?.startsWith('/api/history')) {
      await handleHistoryRequest(req, res);
    } else if (req.method === 'POST' && req.url === '/api/patch') {
      await handlePatchRequest(req, res);
    } else if (req.method === 'GET' && req.url?.startsWith('/api/user-data')) {
      await handleUserDataRequest(req, res);
    } else if (req.method === 'POST' && req.url === '/api/migrate-data') {
      await handleMigrationRequest(req, res);
    } else if (req.method === 'GET' && req.url?.startsWith('/payment-success')) {
      await handlePaymentSuccessRequest(req, res);
    } else {
      // Serve static HTML
      await handleStaticRequest(req, res);
    }
  } catch (error) {
    console.error('Router error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};