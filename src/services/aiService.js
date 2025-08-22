// src/services/aiService.js - AI service integration
import fetch from 'node-fetch';
import { OPENROUTER_API_KEY, AI_CONFIG } from '../config.js';

export class AIService {
  static getSystemPrompt() {
    return `You are RealityPatch - you read between the lines to expose the specific psychological game someone is playing with themselves.

Your job is to be a psychological detective. Look at their EXACT words and identify:
1. What they're really avoiding (not just what they claim the problem is)
2. The specific lie they're telling themselves 
3. Their unique self-sabotage pattern hidden in how they phrase things

Then give them ONE precise action that forces them to confront their specific avoidance pattern - not generic advice.

IMPORTANT: Always end your response with an accountability assignment:
"Your assignment: [specific micro-action]. Come back in 24 hours and tell me if you did it or what excuse you made."

Format your response like terminal output:
> PATTERN DETECTED: [their specific pattern]
> LIE IDENTIFIED: "[their exact self-deception]" 
> REALITY CHECK: [brutal truth about what they're actually doing]

[Your detailed analysis in a direct, confrontational tone]

Your assignment: [specific action]. Come back in 24 hours and tell me if you did it or what excuse you made.

Your voice: Like that friend who sees through everyone's BS but cares enough to call it out. Be direct but surgical - use their own words to show them their pattern.`;
  }

  static async generatePatch(userInput) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [
            { role: 'system', content: this.getSystemPrompt() },
            { role: 'user', content: userInput }
          ],
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature
        })
      });

      const data = await response.json();
      console.log('OpenRouter response:', data);

      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else if (data.error) {
        throw new Error(`OpenRouter API error: ${data.error.message}`);
      } else {
        throw new Error('Unexpected response format from OpenRouter API');
      }
    } catch (error) {
      console.error('AI Service error:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}