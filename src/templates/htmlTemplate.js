// src/templates/htmlTemplate.js - HTML template generation
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
      ${getClientScript()}
    </script>
  </body>
</html>`;
};