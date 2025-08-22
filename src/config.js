// src/config.js - Application configuration
export const hostname = '0.0.0.0'; // Changed for Vercel compatibility
export const port = process.env.PORT || 3000;
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const AI_CONFIG = {
  model: 'openai/gpt-4o-mini',
  maxTokens: 400,
  temperature: 0.7
};

export const SESSION_CONFIG = {
  maxInteractionsPerUser: 10,
  followUpTimeThreshold: 12 * 60 * 60 * 1000 // 12 hours in milliseconds
};