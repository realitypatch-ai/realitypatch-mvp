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
  
  // Fallback CSS with new dark theme
  cssContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-dark: #0a0a0a;
      --surface: #111111;
      --surface-light: #1a1a1a;
      --text-primary: #ffffff;
      --text-secondary: #999999;
      --accent-red: #ff3366;
      --accent-green: #00ff88;
      --border: #333333;
      --shadow: rgba(255, 51, 102, 0.1);
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-dark);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container { max-width: 600px; width: 100%; }
    
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 40px 35px;
      box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-red), var(--accent-green));
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: -2px;
      text-align: center;
      margin-bottom: 8px;
    }

    .subtitle {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: var(--accent-green);
      text-align: center;
      margin-bottom: 25px;
    }

    textarea {
      width: 100%;
      min-height: 120px;
      padding: 20px;
      background: var(--surface-light);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
      margin-bottom: 18px;
    }

    button {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, var(--accent-red), #cc0044);
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      text-transform: uppercase;
    }

    .examples { margin-top: 35px; padding-top: 25px; border-top: 1px solid var(--border); }
    .example-btn { 
      padding: 15px 18px; 
      background: transparent; 
      border: 1px solid var(--border); 
      color: var(--text-secondary); 
      font-family: 'JetBrains Mono', monospace; 
      cursor: pointer; 
      width: 100%; 
      margin-bottom: 8px; 
    }
    #output { margin-top: 30px; }
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

  // History endpoint
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
                            (Date.now() - new Date(lastInteraction.timestamp).getTime()) > 12 * 60 * 60 * 1000);

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

Format your response like terminal output:
> PATTERN DETECTED: [their specific pattern]
> LIE IDENTIFIED: "[their exact self-deception]" 
> REALITY CHECK: [brutal truth about what they're actually doing]

[Your detailed analysis in a direct, confrontational tone]

Your assignment: [specific action]. Come back in 24 hours and tell me if you did it or what excuse you made.

Your voice: Like that friend who sees through everyone's BS but cares enough to call it out. Be direct but surgical - use their own words to show them their pattern.` 
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
    // Serve HTML UI with new design
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>RealityPatch - Truth Detector</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@600;800&display=swap" rel="stylesheet">
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
              <div class="header">
                <div class="subtitle">&gt; PSYCHOLOGICAL DEBUGGER</div>
                <h1>RealityPatch<span class="cursor">_</span></h1>
                <div class="tagline">Exposing self-sabotage patterns</div>
              </div>

              <div class="terminal-prompt">[user@reality ~]$ describe_problem --verbose</div>
              
              <div class="input-section">
                <div class="input-label">Input Buffer:</div>
                <textarea id="userInput" placeholder="Describe your recurring problem... be brutally honest about what you keep doing or telling yourself.

Examples:
• I keep starting projects but abandoning them
• I want to start a business but I'm waiting for the perfect idea  
• I know what I should do but I can't seem to do it
• I always attract toxic people in relationships" rows="5"></textarea>
              </div>

              <button id="patchBtn" class="analyze-btn">
                ANALYZE PATTERN
              </button>

              <div id="output">
                <div class="result-container">
                  <div class="result-header">REALITY.PATCH OUTPUT</div>
                  <div class="result-content" id="resultContent">
                    <!-- Results will appear here -->
                  </div>
                </div>
              </div>

              <div class="examples">
                <div class="examples-header">&gt; SAMPLE_INPUTS.TXT</div>
                <button class="example-btn" data-example="I keep starting projects but never finish them">
                  &gt; Projects I abandon halfway through
                </button>
                <button class="example-btn" data-example="I want to start a business but I'm waiting for the perfect idea">
                  &gt; Waiting for the "perfect" business idea
                </button>
                <button class="example-btn" data-example="I know what I should do but I just can't seem to do it">
                  &gt; Knowledge without action problem
                </button>
                <button class="example-btn" data-example="I always attract the wrong kind of people in relationships">
                  &gt; Toxic relationship patterns
                </button>
              </div>

              <!-- History Section -->
              <div class="history-section" id="historySection">
                <div class="history-header" onclick="toggleHistory()">
                  <h3>&gt; PREVIOUS_PATCHES.LOG (<span id="historyCount">0</span>)</h3>
                  <span id="history-toggle">&gt; Show</span>
                </div>
                <div class="history-items" id="history-content">
                  <!-- History items will appear here -->
                </div>
              </div>
            </div>
          </div>

          <script>
            const button = document.getElementById('patchBtn');
            const textarea = document.getElementById('userInput');
            const output = document.getElementById('output');
            const resultContent = document.getElementById('resultContent');
            const historySection = document.getElementById('historySection');

            // Session management
            let sessionId = localStorage.getItem('rp-session-id');

            // Load history on page load
            window.addEventListener('load', loadHistory);

            async function loadHistory() {
              const localHistory = loadHistoryFromLocal();
              
              if (localHistory && localHistory.length > 0) {
                showHistorySection(localHistory);
                
                // Check if user has pending assignment
                const lastPatch = localHistory[localHistory.length - 1];
                if (lastPatch && lastPatch.response.includes('Your assignment:') && !lastPatch.isFollowUp) {
                  const timeSince = Date.now() - new Date(lastPatch.timestamp).getTime();
                  const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));
                  
                  if (hoursSince >= 12) {
                    showAssignmentReminder(hoursSince);
                  }
                }
              }
            }

            // Save history to localStorage
            function saveHistoryToLocal(historyData) {
              localStorage.setItem('rp-history', JSON.stringify(historyData));
            }

            // Load history from localStorage
            function loadHistoryFromLocal() {
              const stored = localStorage.getItem('rp-history');
              return stored ? JSON.parse(stored) : [];
            }

            function showAssignmentReminder(hoursSince) {
              const reminderHtml = '<div id="assignment-reminder" class="assignment-reminder">' +
                '<div class="reminder-header">&gt; ASSIGNMENT_STATUS: OVERDUE</div>' +
                '<div class="reminder-content">It\\'s been ' + hoursSince + ' hours. Did you do your assignment or do you have an excuse?</div>' +
                '</div>';
              
              document.querySelector('.header').insertAdjacentHTML('afterend', reminderHtml);
            }

            function showHistorySection(history) {
              const historyCount = document.getElementById('historyCount');
              historyCount.textContent = history.length;
              
              const historyContent = document.getElementById('history-content');
              historyContent.innerHTML = history.slice(-3).reverse().map(function(item, index) {
                const followUpBadge = item.isFollowUp ? '<span class="follow-up-badge">FOLLOW-UP</span>' : '';
                return '<div class="history-item">' +
                  '<div class="history-input">"' + item.input + '"' + followUpBadge + '</div>' +
                  '<div class="history-response">' + item.response + '</div>' +
                  '<div class="history-timestamp">' + new Date(item.timestamp).toLocaleDateString() + '</div>' +
                  '</div>';
              }).join('');
              
              historySection.style.display = 'block';
              
              // FIX: Set initial state - history is shown by default when there's content
              historyContent.style.display = 'block';
              const toggle = document.getElementById('history-toggle');
              toggle.textContent = '> Hide';
            }

            window.toggleHistory = function() {
            const content = document.getElementById('history-content');
            const toggle = document.getElementById('history-toggle');
            
            // Check actual computed display style, not just the style property
            const isCurrentlyVisible = window.getComputedStyle(content).display !== 'none';
            
            if (isCurrentlyVisible) {
              content.style.display = 'none';
              toggle.textContent = '> Show';
            } else {
              content.style.display = 'block';
              toggle.textContent = '> Hide';
            }
          }

            // Example buttons functionality
            document.querySelectorAll('.example-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                textarea.value = btn.dataset.example;
                textarea.focus();
                
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
              const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 250);
              textarea.style.height = newHeight + 'px';
            });

            // Button click with session management
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
              button.textContent = 'PROCESSING...';
              
              // Show output section and loading state
              output.classList.add('show');
              resultContent.innerHTML = '<div class="loading">&gt; Analyzing psychological patterns<span class="loading-dots"></span></div>';

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
                
                // Typewriter effect for results
                let i = 0;
                const response = data.patch;
                resultContent.innerHTML = '';
                
                const typewriter = setInterval(() => {
                  if (i < response.length) {
                    resultContent.innerHTML += response.charAt(i);
                    i++;
                  } else {
                    clearInterval(typewriter);
                    
                    // Add success message after typewriter completes
                    setTimeout(() => {
                      const statusHtml = data.isFollowUp 
                        ? '<div class="status-message follow-up">Progress tracking activated. Keep coming back - accountability is what separates the doers from the dreamers.</div>'
                        : '<div class="status-message">Assignment given. Come back in 24 hours and report what you actually did.</div>';
                      
                      resultContent.innerHTML += statusHtml;
                    }, 1000);
                  }
                }, 20);
                
                // Track successful patch delivery
                if (window.va) {
                  window.va('track', 'RealityPatchDelivered', { 
                    isFollowUp: data.isFollowUp,
                    historyCount: data.historyCount 
                  });
                }
                
                // Save to local storage
                const currentHistory = loadHistoryFromLocal();
                currentHistory.push({
                  input: text,
                  response: data.patch,
                  timestamp: new Date().toISOString(),
                  id: Date.now(),
                  isFollowUp: data.isFollowUp
                });

                // Keep only last 10
                if (currentHistory.length > 10) {
                  currentHistory.shift();
                }

                saveHistoryToLocal(currentHistory);
                showHistorySection(currentHistory);

                // Clear textarea after successful submission
                textarea.value = '';
                textarea.style.height = '120px';
                
              } catch (err) {
                console.error(err);
                resultContent.innerHTML = '<div class="error">&gt; ERROR: Connection failed. Please try again.</div>';
                
                // Track errors
                if (window.va) {
                  window.va('track', 'RealityPatchError', { error: err.message });
                }
              } finally {
                button.disabled = false;
                button.textContent = 'ANALYZE PATTERN';
              }
            });

            // Enter to submit (Ctrl+Enter or Cmd+Enter)
            textarea.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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