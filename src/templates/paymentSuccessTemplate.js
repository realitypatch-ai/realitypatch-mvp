// src/templates/paymentSuccessTemplate.js - Clean payment success page
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
      
      .payment-status {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .status-symbol {
        font-size: 3rem;
        margin-bottom: 15px;
        display: block;
      }
      
      .success-symbol {
        color: var(--accent-green);
      }
      
      .error-symbol {
        color: var(--accent-red);
      }
      
      .payment-message {
        background: var(--surface-light);
        border-left: 3px solid var(--accent-green);
        padding: 20px;
        margin-bottom: 25px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
      }
      
      .error-payment-message {
        border-left-color: var(--accent-red);
      }
      
      .transaction-details {
        background: var(--bg-dark);
        border: 1px solid var(--border);
        padding: 15px;
        margin: 20px 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--text-secondary);
      }
      
      .detail-header {
        color: var(--accent-red);
        margin-bottom: 8px;
        font-weight: bold;
      }
      
      .continue-btn {
        width: 100%;
        padding: 16px 24px;
        background: var(--accent-green);
        color: white;
        border: none;
        border-radius: 4px;
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        text-align: center;
        transition: background-color 0.2s ease;
      }
      
      .continue-btn:hover {
        background: #27ae60;
      }
      
      .redirect-info {
        text-align: center;
        color: var(--text-secondary);
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        margin: 15px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        ${isError ? generateErrorContent() : generateSuccessContent(sessionId)}
        
        <footer class="creator-footer">
          <div class="creator-contact">
            <a href="mailto:realitypatchai@gmail.com" class="contact-link">realitypatchai@gmail.com</a>
            <div class="creator-tagline">Feedback, questions, or found a bug in reality?</div>
          </div>
        </footer>
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
      <div class="subtitle">PAYMENT PROCESSED</div>
      <h1>Credits Added<span class="cursor">_</span></h1>
      <div class="tagline">Analysis capacity increased</div>
    </div>

    <div class="payment-status">
      <span class="status-symbol success-symbol">✓</span>
    </div>

    <div class="payment-message">
      <div style="color: var(--accent-green); margin-bottom: 10px;">
        &gt; CREDITS_ADDED: 10 PATCHES
      </div>
      <div>Your additional analysis credits are now available.</div>
      <div style="margin-top: 8px; color: var(--text-secondary);">
        Valid until tomorrow's reset
      </div>
    </div>

    ${sessionId ? `
    <div class="transaction-details">
      <div class="detail-header">&gt; TRANSACTION_CONFIRMED</div>
      <div>Session: ${sessionId}</div>
      <div>Amount: $4.99 AUD</div>
      <div>Status: PROCESSED</div>
    </div>
    ` : ''}

    <div class="redirect-info">
      Redirecting in <span id="countdown">5</span> seconds
    </div>

    <a href="/" class="continue-btn" id="continueBtn">
      RETURN TO ANALYSIS
    </a>
  `;
}

function generateErrorContent() {
  return `
    <div class="header">
      <div class="subtitle">PAYMENT ERROR</div>
      <h1>Processing Failed<span class="cursor">_</span></h1>
      <div class="tagline">No charges applied</div>
    </div>

    <div class="payment-status">
      <span class="status-symbol error-symbol">✗</span>
    </div>

    <div class="payment-message error-payment-message">
      <div style="color: var(--accent-red); margin-bottom: 10px;">
        &gt; PAYMENT_FAILED
      </div>
      <div>Transaction could not be completed.</div>
      <div style="margin-top: 8px; color: var(--text-secondary);">
        Your account was not charged
      </div>
    </div>

    <div class="transaction-details">
      <div class="detail-header">&gt; ERROR_STATUS</div>
      <div>Status: FAILED</div>
      <div>Amount: $0.00 AUD</div>
      <div>Action: Please try again</div>
    </div>

    <div class="redirect-info">
      Redirecting in <span id="countdown">10</span> seconds
    </div>

    <a href="/" class="continue-btn" id="continueBtn">
      TRY AGAIN
    </a>
  `;
}

function getPaymentSuccessScript() {
  return `
    function addCreditsToUser() {
      try {
        console.log('Adding 10 credits from payment...');
        
        let extraCredits = parseInt(localStorage.getItem('rp-extra-credits') || '0');
        const newCredits = 10;
        extraCredits += newCredits;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        localStorage.setItem('rp-extra-credits', extraCredits.toString());
        localStorage.setItem('rp-extra-credits-expiry', tomorrow.getTime().toString());
        
        console.log('Credits added successfully:', {
          newTotal: extraCredits,
          added: newCredits,
          expiry: tomorrow.toISOString()
        });
        
        if (window.va) {
          window.va('track', 'CreditsAdded', { 
            amount: newCredits, 
            total: extraCredits,
            method: 'stripe_payment'
          });
        }
        
      } catch (error) {
        console.error('Error adding credits:', error);
        
        if (window.va) {
          window.va('track', 'CreditsAddError', { error: error.message });
        }
      }
    }

    function startCountdown() {
      let count = ${isError ? '10' : '5'};
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

    window.addEventListener('load', () => {
      if (!document.querySelector('.error-payment-message')) {
        addCreditsToUser();
      }
      
      startCountdown();
      
      if (window.va) {
        window.va('track', 'PaymentSuccessPageView');
      }
    });

    document.getElementById('continueBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (window.va) {
        window.va('track', 'PaymentSuccessContinueClick');
      }
      
      window.location.href = '/';
    });
  `;
}