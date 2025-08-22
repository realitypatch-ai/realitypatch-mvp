// src/services/sessionManager.js - Session management service
import { SESSION_CONFIG } from '../config.js';

// Simple in-memory storage for user sessions
const userSessions = new Map();

export class SessionManager {
  static generateSessionId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getSession(sessionId) {
    if (!userSessions.has(sessionId)) {
      userSessions.set(sessionId, []);
    }
    return userSessions.get(sessionId);
  }

  static addInteraction(sessionId, interaction) {
    const history = this.getSession(sessionId);
    history.push({
      ...interaction,
      timestamp: new Date().toISOString(),
      id: Date.now()
    });

    // Keep only last N interactions per user
    if (history.length > SESSION_CONFIG.maxInteractionsPerUser) {
      history.shift();
    }
  }

  static getLastInteraction(sessionId) {
    const history = this.getSession(sessionId);
    return history[history.length - 1] || null;
  }

  static isFollowUp(userInput, lastInteraction) {
    if (!lastInteraction) return false;

    const followUpKeywords = ['did', 'didn\'t', 'excuse', 'back', 'assignment'];
    const hasFollowUpKeywords = followUpKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );

    const timeSinceLastInteraction = Date.now() - new Date(lastInteraction.timestamp).getTime();
    const isWithinTimeThreshold = timeSinceLastInteraction > SESSION_CONFIG.followUpTimeThreshold;

    return hasFollowUpKeywords || isWithinTimeThreshold;
  }

  static buildContextualInput(userInput, lastInteraction, isFollowUp) {
    if (!isFollowUp || !lastInteraction) {
      return userInput;
    }

    return `FOLLOW-UP: User's previous situation was: "${lastInteraction.input}" and my last assignment was in this response: "${lastInteraction.response}". 
           
           User now says: "${userInput}"
           
           Call them out if they're making excuses or acknowledge if they actually did it. Then give the next assignment.`;
  }
}