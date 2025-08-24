// src/templates/paymentSuccessTemplate.js - Payment success page HTML
import { getFallbackCSS } from './fallbackCSS.js';

export const generatePaymentSuccessHTML = (sessionId, success, isError = false) => {
  const finalCSS = getFallbackCSS();
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Payment Successful - RealityPatch</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@600;800&display=swap" rel="stylesheet">
    <script>
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>
    <style>
      ${finalCSS}
      
      /* Additional styles for payment success */
      .success-icon {
        font-size: 4rem;
        color: var(--accent-green);
        text-align: center;
        margin-bottom: 20px;
        animation: pulse-success 2s ease-in-out infinite;
      }
      
      .error-icon {
        font-size: 4rem;
        color: var(--accent-red);
        text-align: center;
        margin-bottom: 20px;
        animation: pulse-error 2s ease-in-out infinite;
      }
      
      @keyframes pulse-success {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      @keyframes pulse-error {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .success-message {
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 25px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(46, 204, 113, 0.3);
      }
      
      .error-message {
        background: linear-gradient(135deg, var(--accent-red), #cc0044);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 25px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(255, 51, 102, 0.3);
      }
      
      .credits-added {
        background: var(--surface-light);
        border: 1px solid var(--accent-green);
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
      }
      
      .continue-btn {
        width: 100%;
        padding: 18px 24px;
        background: linear-gradient(135deg, var(--accent-green), #1e8449);
        color: white;
        border: none;
        border-radius: 4px;
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-decoration: none;
        display: inline-block;
        text-align: center;
      }
      
      .continue-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 25px rgba(46, 204, 113, 0.4);
      }
      
      .payment-details {
        background: var(--bg-dark);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 15px;
        margin: 20px 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
      }
      
      .countdown-timer {
        font-family: 'JetBrains Mono', monospace;
        color: var(--accent-green);
        text-align: center;
        margin: 15px 0;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        ${isError ? generateErrorContent() : generateSuccessContent(sessionId)}
        
        <div class="creator-footer">
          <div class="creator-info">Built by <span class="creator-name">Falah Faizal</span></div>
          <div class="creator-contact">
            <a href="mailto:realitypatchai@gmail.com" class="contact-link">EMAIL</a>
            <span class="creator-tagline">Questions about your purchase?</span>
          </div>
        </div>
      </div>
    </div>

    <script>
      ${getPaymentSuccessScript()}
    </script>
  </body>
</html>`;
};

function generateSuccessContent(sessionId) {
  return `
    <div class="header">
      <div class="success-icon">✓</div>
      <div class="subtitle">PAYMENT PROCESSED</div>
      <h1>Credits Added<span class="cursor">_</span></h1>
      <div class="tagline">Ready for more brutal truth</div>
    </div>

    <div class="success-message">
      <h3>Payment Successful!</h3>
      <p>Your extra RealityPatch credits have been added to your account.</p>
    </div>

    <div class="credits-added">
      <div style="color: var(--accent-green); margin-bottom: 10px;">
        &gt; CREDITS_ADDED: 10 PATCHES
      </div>
      <div style="color: var(--text-secondary);">
        Valid until tomorrow's reset
      </div>
    </div>

    ${sessionId ? `
    <div class="payment-details">
      <div style="color: var(--accent-red); margin-bottom: 8px;">&gt; TRANSACTION_INFO</div>
      <div style="color: var(--text-secondary);">Session: ${sessionId}</div>
      <div style="color: var(--text-secondary);">Amount: $4.99 AUD</div>
      <div style="color: var(--text-secondary);">Status: CONFIRMED</div>
    </div>
    ` : ''}

    <div class="countdown-timer">
      Redirecting to RealityPatch in <span id="countdown">5</span> seconds...
    </div>

    <a href="/" class="continue-btn" id="continueBtn">
      START ANALYZING NOW
    </a>
  `;
}

function generateErrorContent() {
  return `
    <div class="header">
      <div class="error-icon">✗</div>
      <div class="subtitle">PAYMENT ERROR</div>
      <h1>Something Went Wrong<span class="cursor">_</span></h1>
      <div class="tagline">Don't worry, we'll fix this</div>
    </div>

    <div class="error-message">
      <h3>Payment Processing Error</h3>
      <p>There was an issue processing your payment. No charges were made to your account.</p>
    </div>

    <div class="payment-details">
      <div style="color: var(--accent-red); margin-bottom: 8px;">&gt; ERROR_INFO</div>
      <div style="color: var(--text-secondary);">Status: FAILED</div>
      <div style="color: var(--text-secondary);">Amount: $0.00 AUD (No charge)</div>
      <div style="color: var(--text-secondary);">Action: Please try again</div>
    </div>

    <div class="countdown-timer">
      Redirecting to RealityPatch in <span id="countdown">10</span> seconds...
    </div>

    <a href="/" class="continue-btn" id="continueBtn">
      RETURN TO REALITYPATCH
    </a>
  `;
}

function getPaymentSuccessScript() {
  return `
    // Add credits to user's account immediately
    function addCreditsToUser() {
      try {
        // Get current extra credits
        let extraCredits = parseInt(localStorage.getItem('rp-extra-credits') || '0');
        
        // Add 10 new credits
        extraCredits += 10;
        
        // Save to localStorage with expiry (until tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Reset at midnight
        
        localStorage.setItem('rp-extra-credits', extraCredits.toString());
        localStorage.setItem('rp-extra-credits-expiry', tomorrow.getTime().toString());
        
        console.log('✅ Added 10 credits. Total extra credits:', extraCredits);
        
        // Track successful credit addition
        if (window.va) {
          window.va('track', 'CreditsAdded', { 
            amount: 10, 
            total: extraCredits,
            method: 'stripe_payment'
          });
        }
        
      } catch (error) {
        console.error('❌ Error adding credits:', error);
        
        // Track credit addition error
        if (window.va) {
          window.va('track', 'CreditsAddError', { error: error.message });
        }
      }
    }

    // Countdown timer
    function startCountdown() {
      let count = ${generateErrorContent.name === 'generateErrorContent' ? '10' : '5'};
      const countdownEl = document.getElementById('countdown');
      
      const timer = setInterval(() => {
        count--;
        if (countdownEl) countdownEl.textContent = count;
        
        if (count <= 0) {
          clearInterval(timer);
          window.location.href = '/';
        }
      }, 1000);
    }

    // Initialize when page loads
    window.addEventListener('load', () => {
      // Only add credits if this is a success page (not error)
      if (!document.querySelector('.error-message')) {
        addCreditsToUser();
      }
      
      startCountdown();
      
      // Track page view
      if (window.va) {
        window.va('track', 'PaymentSuccessPageView');
      }
    });

    // Handle continue button click
    document.getElementById('continueBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Track button click
      if (window.va) {
        window.va('track', 'PaymentSuccessContinueClick');
      }
      
      window.location.href = '/';
    });
  `;
}