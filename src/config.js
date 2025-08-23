// src/config.js - Application configuration
// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('🔍 Config.js environment check:');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'MISSING');
console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'SET' : 'MISSING');
console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'SET' : 'MISSING');

export const hostname = '0.0.0.0';
export const port = process.env.PORT || 3000;
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Validate required environment variables
if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY is missing from environment variables');
  throw new Error('OPENROUTER_API_KEY is required');
}

export const AI_CONFIG = {
  model: 'openai/gpt-4o-mini',
  maxTokens: 400,
  temperature: 0.7
};

export const DATABASE_CONFIG = {
  maxHistoryPerUser: 50,
  dataRetentionDays: 30,
  dailyRequestLimit: 10
};