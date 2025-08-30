// Enhanced htmlTemplate.js with natural SEO optimization
import { getFallbackCSS } from './fallbackCSS.js';
import { getClientScript } from './clientScript.js';

export const generateHTML = (cssContent = '') => {
  const finalCSS = cssContent || getFallbackCSS();
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    
    <!-- NATURAL SEO META TAGS -->
    <title>RealityPatch - Get Honest About What's Holding You Back</title>
    <meta name="description" content="Built this AI to call out my own excuses. Analyzes your exact words to spot patterns keeping you stuck. No signup needed - just get honest feedback.">    
    
    <!-- VIEWPORT & MOBILE -->
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#00ff66">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    
    <!-- FAVICON COLLECTION -->
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="shortcut icon" href="/favicon.ico">
    
    <!-- NATURAL STRUCTURED DATA -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "RealityPatch",
      "url": "https://realitypatch.co",
      "description": "Get direct insights into what's keeping you stuck",
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
    <link rel="canonical" href="https://realitypatch.co">
    
    <!-- PRECONNECT FOR PERFORMANCE -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- FONTS -->
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@600;800&display=swap" rel="stylesheet">
    
    <!-- ANALYTICS -->
    <script>
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>
    
    <!-- GOOGLE ANALYTICS 4 (Replace with your GA4 ID) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
    
    <!-- BASIC SEO SIGNALS -->
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
          <div class="tagline">Identify what's really holding you back</div>
        </header>

        <!-- MAIN CONTENT AREA -->
        <main id="main-content">
          <!-- First-time user experience section -->
          <section class="first-time-section" aria-label="User outcomes and pattern analysis">
            <div class="stats-bar">
              <div class="stat-item">Beta testing: <span class="stat-number">Live</span></div>
              <div class="stat-item">Built by: <span class="stat-number">Student</span></div>
              <div class="stat-item">No signup</div>
            </div>
            
            <div class="outcomes-section">
              <div class="outcomes-header">&gt; WHY_I_BUILT_THIS.LOG</div>
              <div style="margin-bottom: 15px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--text-secondary);">The real story behind this tool:</div>
              
              <div class="outcome-item">
                <div class="outcome-quote">"I kept telling myself I needed to 'research more' before starting my business"</div>
                <div class="outcome-pattern">REALITY: I was using research as sophisticated procrastination</div>
              </div>
              
              <div class="outcome-item">
                <div class="outcome-quote">"Spent 6 months waiting for the 'perfect moment' to launch"</div>
                <div class="outcome-pattern">REALITY: I was scared and disguising it as strategy</div>
              </div>
              
              <div class="outcome-item">
                <div class="outcome-quote">"Built this to catch my own BS first, sharing in case it helps others"</div>
                <div class="outcome-pattern">STATUS: Currently testing with real users</div>
              </div>
              
              <div class="pattern-check">
                <div class="pattern-check-title">Try the pattern detector:</div>
                <div class="pattern-subtitle">Choose your biggest excuse (I'll show you the pattern):</div>
                
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
              <textarea id="userInput" 
                       placeholder="Describe what you've been stuck on or putting off...

Examples:
- I keep starting projects but don't finish them
- I want to start a business but keep waiting for clarity  
- I know what would help but struggle to take action
- I notice patterns in my relationships that don't work" 
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
              <button class="example-btn" data-example="I keep starting projects but struggle to finish them">
                &gt; Starting but not completing projects
              </button>
              <button class="example-btn" data-example="I want to start a business but keep waiting for more clarity">
                &gt; Waiting for the "right" business idea
              </button>
              <button class="example-btn" data-example="I know what would help but find it hard to take action">
                &gt; Knowing what to do but not doing it
              </button>
              <button class="example-btn" data-example="I notice unhelpful patterns in my relationships">
                &gt; Recurring relationship challenges
              </button>
            </div>
          </div>
        </main>

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

      <!-- Creator Footer -->
      <div class="creator-footer">
        <div class="creator-info">
          Built by <span class="creator-name">Falah Faizal</span> - Someone who got tired of staying stuck
        </div>
        <div class="creator-story">
          "I built this because I needed it. Sometimes we need clarity more than comfort."
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