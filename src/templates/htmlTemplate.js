// src/templates/htmlTemplate.js - HTML template generation with demo examples section
import { getFallbackCSS } from './fallbackCSS.js';
import { getClientScript } from './clientScript.js';

export const generateHTML = (cssContent = '') => {
  const finalCSS = cssContent || getFallbackCSS();
  
  return `<!DOCTYPE html>
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
      ${finalCSS}
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

        <!-- NEW: Demo Examples Section - Shows what the AI does BEFORE asking for input -->
        <div class="demo-section">
          <div class="demo-header">&gt; DEMO_OUTPUT.LOG</div>
          <div class="demo-subtitle">See RealityPatch analyze common patterns:</div>
          
          <div class="demo-examples">
            <div class="demo-item">
              <div class="demo-input">
                <span class="demo-label">INPUT:</span>
                "I'm just waiting for the right opportunity to start my business"
              </div>
              <div class="demo-output">
                <span class="demo-label">ANALYSIS:</span>
                You're not waiting - you're avoiding. "The right opportunity" is code for "zero-risk opportunity" which doesn't exist. Your perfectionism is fear wearing a disguise. Every day you wait is another day your competition gets ahead.
                
                <strong>Your assignment:</strong> Write down 3 business ideas today. Pick the least perfect one and do 1 small action toward it within 24 hours.
              </div>
            </div>
            
            <div class="demo-item">
              <div class="demo-input">
                <span class="demo-label">INPUT:</span>
                "I keep starting projects but never finish them"
              </div>
              <div class="demo-output">
                <span class="demo-label">ANALYSIS:</span>
                You're addicted to the dopamine hit of starting something new, but terrified of the vulnerability that comes with finishing and being judged. Each abandoned project is evidence you collect to prove you're "not good enough" - a comfortable lie that protects you from real success.
                
                <strong>Your assignment:</strong> Pick your most recent abandoned project. Commit to working on it for just 15 minutes today. Set a timer.
              </div>
            </div>
            
            <div class="demo-item">
              <div class="demo-input">
                <span class="demo-label">INPUT:</span>
                "I know what I should do but I just can't seem to do it"
              </div>
              <div class="demo-output">
                <span class="demo-label">ANALYSIS:</span>
                "Can't" is the lie you tell yourself to avoid responsibility. You CAN do it - you're choosing not to because doing it means risking failure, discomfort, or change. Your brain prefers the familiar pain of inaction to the unknown pain of action.
                
                <strong>Your assignment:</strong> Do the smallest possible version of "what you should do" right now. Not tomorrow, not after you prepare more - now.
              </div>
            </div>
          </div>
          
          <div class="demo-cta">
            <div class="demo-cta-text">Ready for your own brutally honest analysis?</div>
            <button id="startAnalysisBtn" class="demo-start-btn">START YOUR ANALYSIS</button>
          </div>
        </div>

        <!-- Main input section - initially hidden -->
        <div class="main-input-section" id="mainInputSection" style="display: none;">
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

      <!-- Creator Footer - Outside main card for clean UX -->
      <div class="creator-footer">
        <div class="creator-info">Built by <span class="creator-name">Falah Faizal</span></div>
        <div class="creator-contact">
          <a href="mailto:realitypatchai@gmail.com" class="contact-link">EMAIL</a>
          <span class="creator-tagline">Questions? Feedback? Found a bug in reality?</span>
        </div>
      </div>

    </div>

    <script>
      ${getClientScript()}
    </script>
  </body>
</html>`;
};