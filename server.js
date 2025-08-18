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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/patch') {
    let body = '';
    req.on('data', chunk => { body += chunk; });

    req.on('end', async () => {
      try {
        const { userInput } = JSON.parse(body);

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

Your voice: Like that friend who sees through everyone's BS but cares enough to call it out. Be direct but surgical - use their own words to show them their pattern.

Examples of good responses:
- "You said 'not being able to achieve success' - notice how you made yourself the victim there? Like success is something that happens TO you instead of something you create. That's your tell."
- "The phrase 'I keep failing' tells me you're addicted to starting things you know you won't finish. It gives you the identity of 'someone who tries' without the risk of actually succeeding."

Be specific to THEIR words and psychology. No generic advice about "writing lists" or "getting out of comfort zones."` 
              },
              { role: 'user', content: userInput }
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

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ patch }));

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

            // Example buttons functionality
            document.querySelectorAll('.example-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                textarea.value = btn.dataset.example;
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
              });
            });

            // Auto-resize textarea
            textarea.addEventListener('input', () => {
              textarea.style.height = 'auto';
              const newHeight = Math.min(Math.max(textarea.scrollHeight, 100), 250);
              textarea.style.height = newHeight + 'px';
            });

            button.addEventListener('click', async () => {
              const text = textarea.value.trim();
              if (!text) {
                textarea.focus();
                return;
              }
              
              button.disabled = true;
              button.textContent = 'Reading between the lines...';
              output.innerHTML = '<em>🧠 Analyzing your psychology...</em>';

              try {
                const res = await fetch('/api/patch', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ userInput: text })
                });

                const data = await res.json();
                output.innerHTML = marked.parse(data.patch);
                
                // Add CTA after showing results
                setTimeout(() => {
                  output.innerHTML += '<div style="background: linear-gradient(135deg, #667eea20, #764ba220); border: 1px solid #667eea30; border-radius: 12px; padding: 16px; margin-top: 20px; text-align: center; font-size: 14px; color: #555;"><strong style="color: #667eea;">Hit different?</strong> Try another situation - RealityPatch gets more accurate the more specific you are.</div>';
                }, 2000);
                
              } catch (err) {
                console.error(err);
                output.innerHTML = '<p style="color: #e53e3e; background: #fff5f5; padding: 16px; border-radius: 12px; border: 1px solid #ff6b6b;">Something went wrong. Please try again.</p>';
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