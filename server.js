// server.js
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hostname = '0.0.0.0'; // Changed for Vercel
const port = process.env.PORT || 3000; // Use Vercel's port

// Your OpenRouter API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Simple in-memory storage for user sessions
const userSessions = new Map();

// Read CSS file with error handling
let cssContent = '';
try {
  // Use __dirname instead of process.cwd() for Vercel
  cssContent = readFileSync(join(__dirname, 'styles.css'), 'utf8');
  console.log('CSS file loaded successfully');
  console.log('CSS content length:', cssContent.length);
} catch (error) {
  console.error('Error loading CSS file:', error.message);
  console.log('Current directory:', __dirname);
  console.log('Looking for styles.css at:', join(__dirname, 'styles.css'));
  
  // Fallback CSS if file not found
  cssContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 550px; width: 100%; }
    .card { background: rgba(255, 255, 255, 0.95); border-radius: 24px; padding: 30px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
    h1 { font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 8px; }
    .subtitle { color: #666; text-align: center; margin-bottom: 25px; }
    textarea { width: 100%; min-height: 100px; padding: 18px; border: 2px solid #e1e5e9; border-radius: 16px; font-size: 15px; margin-bottom: 18px; }
    button { width: 100%; padding: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 16px; font-size: 17px; font-weight: 600; cursor: pointer; }
    .examples { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e1e5e9; }
    .example-btn { padding: 12px 16px; background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 12px; font-size: 14px; cursor: pointer; margin-bottom: 8px; width: 100%; }
    #output { margin-top: 25px; }
  `;
}

const server = createServer(async (req, res) => {
  // Enable CORS for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // NEW: History endpoint
  if (req.method === 'GET' && req.url?.startsWith('/api/history')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    
    if (sessionId && userSessions.has(sessionId)) {
      const history = userSessions.get(sessionId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ history }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ history: [] }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/patch') {
    let body = '';
    req.on('data', chunk => { body += chunk; });

    req.on('end', async () => {
      try {
        const { userInput } = JSON.parse(body);

        // Session and history management
        const sessionId = req.headers['x-session-id'] || 
          `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get existing history
        if (!userSessions.has(sessionId)) {
          userSessions.set(sessionId, []);
        }
        const userHistory = userSessions.get(sessionId);
        const lastInteraction = userHistory[userHistory.length - 1];

        // Check if user is returning with an update
        const isFollowUp = userInput.toLowerCase().includes('did') || 
                           userInput.toLowerCase().includes('didn\'t') ||
                           userInput.toLowerCase().includes('excuse') ||
                           userInput.toLowerCase().includes('back') ||
                           userInput.toLowerCase().includes('assignment') ||
                           (lastInteraction && 
                            (Date.now() - new Date(lastInteraction.timestamp).getTime()) > 12 * 60 * 60 * 1000); // 12+ hours ago

        // Modify the user message to include context if it's a follow-up
        const contextualInput = isFollowUp && lastInteraction ? 
          `FOLLOW-UP: User's previous situation was: "${lastInteraction.input}" and my last assignment was in this response: "${lastInteraction.response}". 
           
           User now says: "${userInput}"
           
           Call them out if they're making excuses or acknowledge if they actually did it. Then give the next assignment.` 
          : userInput;

        // Call OpenRouter API with improved prompt
        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: `You are RealityPatch - you read between the lines to expose the specific psychological game someone is playing with themselves.

Your job is to be a psychological detective. Look at their EXACT words and identify:
1. What they're really avoiding (not just what they claim the problem is)
2. The specific lie they're telling themselves 
3. Their unique self-sabotage pattern hidden in how they phrase things

Then give them ONE precise action that forces them to confront their specific avoidance pattern - not generic advice.

IMPORTANT: Always end your response with an accountability assignment:
"Your assignment: [specific micro-action]. Come back in 24 hours and tell me if you did it or what excuse you made."

Your voice: Like that friend who sees through everyone's BS but cares enough to call it out. Be direct but surgical - use their own words to show them their pattern.

Examples of good responses:
- "You said 'not being able to achieve success' - notice how you made yourself the victim there? Like success is something that happens TO you instead of something you create. That's your tell. Your assignment: Write down ONE thing you could start tomorrow that would move you toward success. Come back in 24 hours and tell me if you did it or what excuse you made."
- "The phrase 'I keep failing' tells me you're addicted to starting things you know you won't finish. It gives you the identity of 'someone who tries' without the risk of actually succeeding. Your assignment: Pick ONE unfinished project and either complete it this week or delete it entirely. Come back in 24 hours and tell me if you did it or what excuse you made."

Be specific to THEIR words and psychology. No generic advice about "writing lists" or "getting out of comfort zones."` 
              },
              { role: 'user', content: contextualInput }
            ],
            max_tokens: 400,
            temperature: 0.7
          })
        });

        const data = await aiRes.json();
        console.log('OpenRouter response:', data);

        let patch = 'Oops, something went wrong. Please try again.';
        if (data.choices && data.choices.length > 0) {
          patch = data.choices[0].message.content;
        } else if (data.error) {
          patch = `Error from OpenRouter: ${data.error.message}`;
        }

        // Store the interaction
        userHistory.push({
          input: userInput,
          response: patch,
          timestamp: new Date().toISOString(),
          id: Date.now(),
          isFollowUp: isFollowUp
        });

        // Keep only last 10 interactions per user
        if (userHistory.length > 10) {
          userHistory.shift();
        }

        res.writeHead(200, { 
          'Content-Type': 'application/json; charset=utf-8',
          'X-Session-ID': sessionId 
        });
        res.end(JSON.stringify({ 
          patch, 
          sessionId, 
          historyCount: userHistory.length,
          isFollowUp: isFollowUp
        }));

      } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ patch: 'Server error. Check console for details.' }));
      }
    });
  } else {
    // Serve HTML UI
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>RealityPatch</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <script>
            window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
          </script>
          <script defer src="/_vercel/insights/script.js"></script>
          <style>
            ${cssContent}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h1>RealityPatch</h1>
              <p class="subtitle">The brutal honesty you need to hear</p>
              <textarea id="userInput" placeholder="Describe your situation... What story are you telling yourself?" rows="4"></textarea>
              <button id="patchBtn">Get Your Reality Check</button>
              <div id="output"></div>
              
              <div class="examples">
                <p><strong>Not sure what to ask? Try these:</strong></p>
                <div class="example-buttons">
                  <button class="example-btn" data-example="I keep starting projects but never finish them">
                    Projects I abandon
                  </button>
                  <button class="example-btn" data-example="I want to start a business but I'm waiting for the perfect idea">
                    Perfect idea waiting
                  </button>
                  <button class="example-btn" data-example="I know what I should do but I just can't seem to do it">
                    Know but don't do
                  </button>
                  <button class="example-btn" data-example="I always attract the wrong kind of people in relationships">
                    Wrong relationships
                  </button>
                </div>
              </div>
            </div>
          </div>

          <script>
            const button = document.getElementById('patchBtn');
            const textarea = document.getElementById('userInput');
            const output = document.getElementById('output');

            // NEW: Session management
            let sessionId = localStorage.getItem('rp-session-id');

            // NEW: Load history on page load
            window.addEventListener('load', loadHistory);

            async function loadHistory() {
              if (!sessionId) return;
              
              try {
                const res = await fetch('/api/history?sessionId=' + sessionId);
                const data = await res.json();
                
                if (data.history && data.history.length > 0) {
                  showHistorySection(data.history);
                  
                  // Check if user has pending assignment
                  const lastPatch = data.history[data.history.length - 1];
                  if (lastPatch && lastPatch.response.includes('Your assignment:') && !lastPatch.isFollowUp) {
                    const timeSince = Date.now() - new Date(lastPatch.timestamp).getTime();
                    const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));
                    
                    if (hoursSince >= 12) {
                      showAssignmentReminder(hoursSince);
                    }
                  }
                }
              } catch (err) {
                console.log('No history found');
              }
            }

            function showAssignmentReminder(hoursSince) {
              const reminderHtml = '<div id="assignment-reminder" style="background: linear-gradient(135deg, #ff6b6b20, #ffd93d20); border: 1px solid #ff6b6b30; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">' +
                '<div style="color: #ff6b6b; font-weight: 600; margin-bottom: 8px;">⏰ Assignment Check-in</div>' +
                '<div style="color: #666; font-size: 14px;">It\\'s been ' + hoursSince + ' hours. Did you do your assignment or do you have an excuse?</div>' +
                '</div>';
              
              document.querySelector('.card').insertAdjacentHTML('afterbegin', reminderHtml);
            }

            function showHistorySection(history) {
              const existingHistory = document.querySelector('.history-section');
              if (existingHistory) existingHistory.remove();
              
              const historyHtml = '<div class="history-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">' +
                '<div class="history-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 8px 0;" onclick="toggleHistory()">' +
                  '<h3 style="font-size: 16px; color: #333; margin: 0;">🧠 Your Reality Patches (' + history.length + ')</h3>' +
                  '<span id="history-toggle" style="color: #667eea; font-size: 14px;">▼ Show</span>' +
                '</div>' +
                '<div class="history-items" id="history-content" style="max-height: 0; overflow: hidden; transition: all 0.3s ease;">' +
                '<div style="padding-top: 12px;">' +
                history.slice(-3).reverse().map(function(item, index) {
                  const followUpBadge = item.isFollowUp ? '<span style="background: #4ecdc4; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">FOLLOW-UP</span>' : '';
                  return '<div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 12px; border-left: 3px solid #667eea;">' +
                    '<div style="color: #666; margin-bottom: 8px; font-size: 13px; font-style: italic;">"' + item.input + '"' + followUpBadge + '</div>' +
                    '<div style="color: #333; line-height: 1.4; font-size: 14px;">' + item.response + '</div>' +
                    '<div style="color: #999; font-size: 11px; margin-top: 8px;">' + new Date(item.timestamp).toLocaleDateString() + '</div>' +
                    '</div>';
                }).join('') +
                '</div>' +
                '</div>' +
                '</div>';
              
              document.querySelector('.card').insertAdjacentHTML('beforeend', historyHtml);
            }

            window.toggleHistory = function() {
              const content = document.getElementById('history-content');
              const toggle = document.getElementById('history-toggle');
              
              if (content.style.maxHeight === '0px' || !content.style.maxHeight) {
                content.style.maxHeight = 'none';
                const scrollHeight = content.scrollHeight;
                content.style.maxHeight = '0';
                
                requestAnimationFrame(() => {
                  content.style.maxHeight = scrollHeight + 'px';
                  content.style.paddingBottom = '12px';
                });
                
                toggle.textContent = '▲ Hide';
                toggle.style.color = '#999';
              } else {
                content.style.maxHeight = '0';
                content.style.paddingBottom = '0';
                toggle.textContent = '▼ Show';
                toggle.style.color = '#667eea';
              }
            }

            // Example buttons functionality
            document.querySelectorAll('.example-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                textarea.value = btn.dataset.example;
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
                
                // Remove assignment reminder if it exists
                const reminder = document.getElementById('assignment-reminder');
                if (reminder) reminder.remove();

                // Track example button clicks
                if (window.va) {
                  window.va('track', 'ExampleButtonClick', { example: btn.dataset.example });
                }
              });
            });

            // Auto-resize textarea
            textarea.addEventListener('input', () => {
              textarea.style.height = 'auto';
              const newHeight = Math.min(Math.max(textarea.scrollHeight, 100), 250);
              textarea.style.height = newHeight + 'px';
            });

            // UPDATED: Button click with session management
            button.addEventListener('click', async () => {
              const text = textarea.value.trim();
              if (!text) {
                textarea.focus();
                return;
              }
              
              // Track reality patch request
              if (window.va) {
                window.va('track', 'RealityPatchRequest', { inputLength: text.length });
              }
              
              button.disabled = true;
              button.textContent = 'Reading between the lines...';
              output.innerHTML = '<em>🧠 Analyzing your psychology...</em>';

              // Remove assignment reminder if it exists
              const reminder = document.getElementById('assignment-reminder');
              if (reminder) reminder.remove();

              try {
                const res = await fetch('/api/patch', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId || ''
                  },
                  body: JSON.stringify({ userInput: text })
                });

                const data = await res.json();
                
                // Store session ID
                if (data.sessionId) {
                  sessionId = data.sessionId;
                  localStorage.setItem('rp-session-id', sessionId);
                }
                
                output.innerHTML = marked.parse(data.patch);
                
                // Track successful patch delivery
                if (window.va) {
                  window.va('track', 'RealityPatchDelivered', { 
                    isFollowUp: data.isFollowUp,
                    historyCount: data.historyCount 
                  });
                }
                
                // Show different messages based on follow-up status
                if (data.isFollowUp) {
                  setTimeout(() => {
                    output.innerHTML += '<div style="background: linear-gradient(135deg, #4ecdc420, #45b7d120); border: 1px solid #4ecdc430; border-radius: 12px; padding: 16px; margin-top: 20px; text-align: center; font-size: 14px; color: #555;">' +
                      '<strong style="color: #4ecdc4;">Progress tracking activated.</strong> Keep coming back - accountability is what separates the doers from the dreamers.' +
                      '</div>';
                  }, 1500);
                } else if (data.historyCount >= 2) {
                  setTimeout(() => {
                    output.innerHTML += '<div style="background: linear-gradient(135deg, #667eea20, #764ba220); border: 1px solid #667eea30; border-radius: 12px; padding: 16px; margin-top: 20px; text-align: center; font-size: 14px; color: #555;">' +
                      '<strong style="color: #667eea;">Assignment given.</strong> Come back in 24 hours and report what you actually did.' +
                      '<div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">Bookmark this page - your accountability partner is waiting.</div>' +
                      '</div>';
                  }, 2000);
                } else {
                  setTimeout(() => {
                    output.innerHTML += '<div style="background: linear-gradient(135deg, #667eea20, #764ba220); border: 1px solid #667eea30; border-radius: 12px; padding: 16px; margin-top: 20px; text-align: center; font-size: 14px; color: #555;"><strong style="color: #667eea;">First patch delivered.</strong> Follow through on your assignment and come back to report.</div>';
                  }, 2000);
                }
                
                // Clear textarea after successful submission
                textarea.value = '';
                textarea.style.height = '100px';
                
                // Reload history
                setTimeout(loadHistory, 500);
                
              } catch (err) {
                console.error(err);
                output.innerHTML = '<p style="color: #e53e3e; background: #fff5f5; padding: 16px; border-radius: 12px; border: 1px solid #ff6b6b;">Something went wrong. Please try again.</p>';
                
                // Track errors
                if (window.va) {
                  window.va('track', 'RealityPatchError', { error: err.message });
                }
              } finally {
                button.disabled = false;
                button.textContent = 'Get Your Reality Check';
              }
            });

            // Enter to submit
            textarea.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!button.disabled) {
                  button.click();
                }
              }
            });

            // Track page views
            if (window.va) {
              window.va('track', 'PageView');
            }
          </script>
        </body>
      </html>
    `);
  }
});

// Handler function for Vercel
const handler = (req, res) => {
  return new Promise((resolve) => {
    server.emit('request', req, res);
    res.on('finish', resolve);
  });
};

// For Vercel serverless functions
if (process.env.VERCEL) {
  // Export for Vercel
} else {
  // For local development
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

// Export default at top level
export default handler;