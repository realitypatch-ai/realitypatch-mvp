// src/handlers/patchHandler.js - Handle patch requests
import { SessionManager } from '../services/sessionManager.js';
import { AIService } from '../services/aiService.js';

export const handlePatchRequest = async (req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });

  req.on('end', async () => {
    try {
      const { userInput } = JSON.parse(body);

      // Session management
      const sessionId = req.headers['x-session-id'] || SessionManager.generateSessionId();
      const lastInteraction = SessionManager.getLastInteraction(sessionId);
      
      // Determine if this is a follow-up
      const isFollowUp = SessionManager.isFollowUp(userInput, lastInteraction);
      
      // Build contextual input
      const contextualInput = SessionManager.buildContextualInput(userInput, lastInteraction, isFollowUp);

      // Generate AI response
      const patch = await AIService.generatePatch(contextualInput);

      // Store the interaction
      SessionManager.addInteraction(sessionId, {
        input: userInput,
        response: patch,
        isFollowUp: isFollowUp
      });

      const historyCount = SessionManager.getSession(sessionId).length;

      res.writeHead(200, { 
        'Content-Type': 'application/json; charset=utf-8',
        'X-Session-ID': sessionId 
      });
      res.end(JSON.stringify({ 
        patch, 
        sessionId, 
        historyCount,
        isFollowUp
      }));

    } catch (error) {
      console.error('Patch handler error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ 
        patch: error.message.includes('OpenRouter') 
          ? 'AI service temporarily unavailable. Please try again.' 
          : 'Server error. Please try again.' 
      }));
    }
  });
};