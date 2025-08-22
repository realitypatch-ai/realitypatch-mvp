// src/handlers/historyHandler.js - Handle history requests
import { SessionManager } from '../services/sessionManager.js';

export const handleHistoryRequest = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  
  const history = sessionId ? SessionManager.getSession(sessionId) : [];
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ history }));
};