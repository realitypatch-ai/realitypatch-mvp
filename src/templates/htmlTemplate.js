// src/templates/htmlTemplate.js - HTML template with new first-time user experience
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

        <!-- NEW: First-time user experience section -->
        <div class="first-time-section">
          <div class="stats-bar">
            <div class="stat-item">Analysis <span class="stat-number">#1,247</span> today</div>
            <div class="stat-item">Avg response: <span class="stat-number">23</span> seconds</div>
            <div class="stat-item">No signup required</div>
          </div>
          
          <div class="outcomes-section">
            <div class="outcomes-header">&gt; REAL_USER_OUTCOMES.LOG</div>
            <div style="margin-bottom: 15px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--text-secondary);">Recent breakthroughs from people just like you:</div>
            
            <div class="outcome-item">
              <div class="outcome-quote">"Called out my 'perfectionism excuse' - shipped my first product in 3 weeks instead of waiting for the 'perfect' moment"</div>
              <div class="outcome-pattern">PATTERN: Using perfectionism as procrastination shield</div>
            </div>
            
            <div class="outcome-item">
              <div class="outcome-quote">"Exposed how I was using my toxic ex as an excuse to avoid dating for 2 years"</div>
              <div class="outcome-pattern">PATTERN: Using past trauma to avoid future vulnerability</div>
            </div>
            
            <div class="outcome-item">
              <div class="outcome-quote">"Showed me I wasn't 'unlucky' - I was unconsciously choosing opportunities that would fail"</div>
              <div class="outcome-pattern">PATTERN: Self-sabotage disguised as bad luck</div>
            </div>
            
            <div class="pattern-check">
              <div class="pattern-check-title">Quick Pattern Check:</div>
              <div class="pattern-subtitle">Choose your biggest excuse (we'll analyze it first):</div>
              
              <div class="excuse-options">
                <button class="excuse-btn" data-pattern="perfectionism">"I need everything perfect first"</button>
                <button class="excuse-btn" data-pattern="timing">"The timing isn't right yet"</button>
                <button class="excuse-btn" data-pattern="readiness">"I'm not ready/qualified enough"</button>
                <button class="excuse-btn" data-pattern="research">"I need to research more first"</button>
              </div>
              
              <div class="pattern-analysis" id="patternAnalysis">
                <div class="pattern-detected">&gt; PATTERN_DETECTED</div>
                <div class="pattern-name" id="patternName">Analysis Paralysis</div>
                <div class="pattern-explanation" id="patternExplanation">
                  Research feels productive, but you are using it as sophisticated procrastination. Each new piece of information gives you permission to delay action just a little longer until you know "enough."
                </div>
                <div class="pattern-insight" id="patternInsight">
                  You already know enough to start. More research will not eliminate the fear - only action will.
                </div>
              </div>
            </div>
          </div>
          
          <div class="personal-analysis-cta">
            <div class="cta-question">Want analysis of YOUR specific situation?</div>
            <button id="startAnalysisBtn" class="start-analysis-btn">GET MY PERSONAL ANALYSIS</button>
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
        <div class="creator-info">
          Built by <span class="creator-name">Falah Faizal</span> - Former procrastinator who got tired of his own excuses
        </div>
        <div class="creator-story">
          "I built this because I needed it. Tired of gentle self-help that doesn't work."
        </div>
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