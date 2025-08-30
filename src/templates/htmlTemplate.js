// src/templates/htmlTemplate.js - SIMPLIFIED with one killer demo
import { getFallbackCSS } from './fallbackCSS.js';
import { getClientScript } from './clientScript.js';

export const generateHTML = (cssContent = '') => {
  const finalCSS = cssContent || getFallbackCSS();
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    
    <!-- SEO META TAGS -->
    <title>RealityPatch - Spot the Exact Excuses Keeping You Stuck</title>
    <meta name="description" content="AI that analyzes your words to expose self-deception patterns. Get specific insights about what's really holding you back - no generic advice.">    
    
    <!-- VIEWPORT & MOBILE -->
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#00ff66">
    
    <!-- FAVICON COLLECTION -->
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="shortcut icon" href="/favicon.ico">
    
    <!-- STRUCTURED DATA -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "RealityPatch",
      "url": "https://www.realitypatch.app",
      "description": "AI tool that analyzes language patterns to identify self-deception",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "AUD"
      },
      "creator": {
        "@type": "Person",
        "name": "Falah Faizal",
        "email": "realitypatchai@gmail.com"
      }
    }
    </script>
    
    <!-- CANONICAL URL -->
    <link rel="canonical" href="https://www.realitypatch.app">
    
    <!-- FONTS -->
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@600;800&display=swap" rel="stylesheet">
    
    <!-- ANALYTICS -->
    <script>
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>
    
    <!-- SEO -->
    <meta name="robots" content="index, follow">
    <meta name="author" content="Falah Faizal">
    
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
          <div class="tagline">Spot the exact excuses keeping you stuck</div>
        </div>

        <!-- SIMPLIFIED: One killer demo instead of clutter -->
        <div class="first-time-section">
          <div class="live-demo-section">
            <div class="demo-header">&gt; LIVE_ANALYSIS_DEMO</div>
            <div class="demo-subtitle">Watch real pattern detection in action:</div>
            
            <div class="demo-input-container">
              <div class="demo-input-label">&gt; Sample Input:</div>
              <div class="demo-text" id="demoText">
                "I want to start my own business but I need to research the market more first. I've been looking into different strategies and competitor analysis for about 6 months now. I just want to make sure I have a solid plan before I jump in..."
              </div>
            </div>
            
            <button class="demo-analyze-btn" id="demoAnalyzeBtn">
              &gt; RUN PATTERN ANALYSIS
            </button>
            
            <div class="demo-output" id="demoOutput">
              <div class="analysis-header">&gt; ANALYSIS_COMPLETE</div>
              <div class="pattern-detected">
                <div class="pattern-label">DETECTED PATTERN:</div>
                <div class="pattern-name">Analysis Paralysis</div>
              </div>
              
              <div class="reality-check">
                <div class="reality-label">REALITY CHECK:</div>
                <div class="reality-content">
                  You're using research as sophisticated procrastination. "6 months of strategy research" = 6 months of avoiding the scary part: actually starting. The phrase "solid plan" is code for "perfect plan that eliminates all risk."
                </div>
              </div>
              
              <div class="specific-action">
                <div class="action-label">SPECIFIC ACTION:</div>
                <div class="action-content">
                  Stop researching. Pick your best business idea right now. Validate it with 10 real potential customers this week. You'll learn more in 7 days of testing than 6 months of planning.
                </div>
              </div>
            </div>
            
            <div class="demo-cta">
              <div class="cta-question">Ready for analysis of YOUR patterns?</div>
              <button id="startAnalysisBtn" class="start-analysis-btn">ANALYZE MY SITUATION</button>
            </div>
          </div>
        </div>

        <!-- Main input section - initially hidden -->
        <div class="main-input-section" id="mainInputSection" style="display: none;">
          <div class="terminal-prompt">[user@reality ~]$ describe_problem --verbose</div>
          
          <div class="input-section">
            <div class="input-label">Input Buffer:</div>
            <textarea id="userInput" 
                     placeholder="What excuse are you using to stay stuck?

Examples:
- I keep researching but never actually start
- I tell myself I need more skills/money/time first
- I know what to do but convince myself it won't work
- I find reasons to quit when things get uncomfortable" 
                     rows="5"></textarea>
          </div>

          <button id="patchBtn" class="analyze-btn">
            GET MY ANALYSIS
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
            <button class="example-btn" data-example="I need to research more before starting my business">
              &gt; "I need to research more before starting"
            </button>
            <button class="example-btn" data-example="I'm waiting for the perfect opportunity to launch">
              &gt; "I'm waiting for the perfect opportunity"
            </button>
            <button class="example-btn" data-example="I know what to do but keep finding excuses not to">
              &gt; "I know what to do but keep procrastinating"
            </button>
            <button class="example-btn" data-example="I sabotage myself whenever things start going well">
              &gt; "I sabotage myself when things get serious"
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

      <!-- UPDATED: Clean creator footer -->
      <footer class="creator-footer">
        <div class="creator-contact">
          <a href="mailto:realitypatchai@gmail.com" class="contact-link">realitypatchai@gmail.com</a>
          <div class="creator-tagline">Feedback, questions, or found a bug in reality?</div>
        </div>
      </footer>

    </div>

    <script>
      ${getClientScript()}
    </script>
  </body>
</html>`;
};