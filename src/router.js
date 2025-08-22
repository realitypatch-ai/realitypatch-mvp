// src/router.js - Main request router
import { handleHistoryRequest } from './handlers/historyHandler.js';
import { handlePatchRequest } from './handlers/patchHandler.js';
import { handleStaticRequest } from './handlers/staticHandler.js';
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
    // Route requests
    if (req.method === 'GET' && req.url?.startsWith('/api/history')) {
      await handleHistoryRequest(req, res);
    } else if (req.method === 'POST' && req.url === '/api/patch') {
      await handlePatchRequest(req, res);
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