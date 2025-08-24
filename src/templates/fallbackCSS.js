// src/templates/fallbackCSS.js - Complete fallback CSS matching styles.css
export const getFallbackCSS = () => `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

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
    position: relative;
    overflow-x: hidden;
}

/* Subtle grid background for "debugger" feel */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
        radial-gradient(circle at 25% 25%, #111 1px, transparent 1px),
        radial-gradient(circle at 75% 75%, #111 1px, transparent 1px);
    background-size: 50px 50px;
    opacity: 0.3;
    z-index: -1;
}

.container {
    max-width: 600px;
    width: 100%;
    position: relative;
}

.card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 40px 35px;
    position: relative;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
}

/* Sharp accent line instead of gradient rainbow */
.card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent-red), var(--accent-green));
    animation: pulse 2s ease-in-out infinite alternate;
}

@keyframes pulse {
    0% { opacity: 0.6; }
    100% { opacity: 1; }
}

.header {
    text-align: center;
    margin-bottom: 35px;
    position: relative;
}

h1 {
    font-family: 'Inter', sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 8px;
    letter-spacing: -2px;
    text-transform: uppercase;
    position: relative;
}

.cursor {
    color: var(--accent-red);
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

.subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--accent-green);
    margin-bottom: 5px;
    opacity: 0.8;
}

.tagline {
    font-size: 16px;
    color: var(--text-secondary);
    font-weight: 600;
}

.terminal-prompt {
    font-family: 'JetBrains Mono', monospace;
    color: var(--accent-green);
    margin-bottom: 15px;
    font-size: 12px;
}

.input-section {
    margin-bottom: 25px;
}

.input-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--accent-red);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

textarea {
    width: 100%;
    min-height: 120px;
    padding: 20px;
    background: var(--surface-light);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--text-primary);
    resize: vertical;
    transition: all 0.3s ease;
    line-height: 1.6;
}

textarea:focus {
    outline: none;
    border-color: var(--accent-red);
    box-shadow: 0 0 0 2px rgba(255, 51, 102, 0.2);
    background: var(--bg-dark);
}

textarea::placeholder {
    color: var(--text-secondary);
    font-style: italic;
}

.analyze-btn {
    width: 100%;
    padding: 18px 24px;
    background: linear-gradient(135deg, var(--accent-red), #cc0044);
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
    position: relative;
    overflow: hidden;
}

.analyze-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.analyze-btn:hover::before {
    left: 100%;
}

.analyze-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(255, 51, 102, 0.4);
}

.analyze-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

#output {
    margin-top: 30px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
}

#output.show {
    opacity: 1;
    transform: translateY(0);
}

.result-container {
    background: var(--bg-dark);
    border: 1px solid var(--accent-red);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
}

.result-header {
    background: var(--accent-red);
    color: white;
    padding: 12px 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
}

.result-content {
    padding: 25px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-primary);
    white-space: pre-line;
}

.result-content strong {
    color: var(--accent-red);
}

.examples {
    margin-top: 35px;
    padding-top: 25px;
    border-top: 1px solid var(--border);
}

.examples-header {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--accent-green);
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.example-btn {
    display: block;
    width: 100%;
    padding: 15px 18px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    margin-bottom: 8px;
    text-align: left;
    transition: all 0.2s ease;
}

.example-btn:hover {
    border-color: var(--accent-red);
    color: var(--text-primary);
    background: var(--surface-light);
    transform: translateX(8px);
}

.loading {
    color: var(--accent-green);
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    text-align: center;
    padding: 40px;
}

.loading::after {
    content: '';
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { content: ''; }
    25% { content: '.'; }
    50% { content: '..'; }
    75% { content: '...'; }
    100% { content: ''; }
}

/* Status Messages */
.status-message {
    margin-top: 20px;
    padding: 15px;
    background: var(--surface-light);
    border-left: 3px solid var(--accent-green);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--accent-green);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-message.follow-up {
    border-left-color: var(--accent-red);
    color: var(--accent-red);
}

.error {
    color: var(--accent-red);
    font-family: 'JetBrains Mono', monospace;
    text-align: center;
    padding: 20px;
}

/* Enhanced assignment badge styling with completion status */
.assignment-badge.completed {
  background: #2ecc71;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Assignment badge styling */
.assignment-badge {
  background: #ff6b35;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Enhanced assignment reminder for multiple assignments */
.assignment-reminder {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  border: 2px solid #ff6b7a;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  animation: pulse-reminder 2s ease-in-out infinite;
}

.assignment-reminder .reminder-header {
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.assignment-reminder .reminder-content {
  color: #ffe6e8;
  font-size: 13px;
  line-height: 1.4;
}

@keyframes pulse-reminder {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(255, 71, 87, 0.3);
  }
  50% { 
    box-shadow: 0 0 30px rgba(255, 71, 87, 0.6);
  }
}

@keyframes pulse-border {
    0% { border-color: var(--accent-red); }
    100% { border-color: #cc0044; }
}

.reminder-header {
    background: var(--accent-red);
    color: white;
    padding: 8px 15px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
}

.reminder-content {
    padding: 15px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.5;
}

/* History Section */
.history-section {
    margin-top: 35px;
    padding-top: 25px;
    border-top: 1px solid var(--border);
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 10px 0;
    user-select: none;
}

.history-header:hover {
    color: var(--accent-green);
}

.history-header h3 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--accent-green);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 400;
}

#history-toggle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-secondary);
    transition: color 0.2s ease;
}

.history-header:hover #history-toggle {
    color: var(--accent-green);
}

.history-items {
    margin-top: 15px;
}

.history-item {
    background: var(--bg-dark);
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-bottom: 15px;
    overflow: hidden;
}

.history-input {
    background: var(--surface-light);
    padding: 12px 15px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border);
    position: relative;
}

.history-input::before {
    content: '> INPUT: ';
    color: var(--accent-red);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.follow-up-badge {
    display: inline-block;
    background: var(--accent-red);
    color: white;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 2px;
    margin-left: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
}

.history-response {
    padding: 15px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-primary);
    white-space: pre-line;
}

.history-response::before {
    content: '> OUTPUT:';
    display: block;
    color: var(--accent-green);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
    font-size: 10px;
}

.history-timestamp {
    background: var(--surface);
    padding: 8px 15px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-top: 1px solid var(--border);
}

.history-timestamp::before {
    content: '> TIMESTAMP: ';
    color: var(--accent-green);
    opacity: 0.7;
}

/* Creator Footer - Outside main card for clean UX */
.creator-footer {
    text-align: center;
    margin-top: 30px;
    padding: 20px 0;
    opacity: 0.8;
    transition: opacity 0.3s ease;
}

.creator-footer:hover {
    opacity: 1;
}

.creator-info {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 8px;
}

.creator-name {
    color: var(--text-primary);
    font-weight: 700;
}

.creator-contact {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
}

.contact-link {
    color: var(--accent-red);
    text-decoration: none;
    font-weight: 700;
    transition: color 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.contact-link:hover {
    color: var(--accent-green);
}

.creator-tagline {
    opacity: 0.7;
    font-style: italic;
}
    
/* Demo Section Styles */
.demo-section {
    margin-bottom: 30px;
    background: var(--surface-light);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    animation: fadeIn 0.5s ease-out;
}

.demo-header {
    background: var(--accent-green);
    color: var(--bg-dark);
    padding: 12px 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
}

.demo-subtitle {
    padding: 15px 20px 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 20px;
}

.demo-examples {
    padding: 0 20px;
}

.demo-item {
    margin-bottom: 25px;
    background: var(--bg-dark);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--border);
}

.demo-input {
    background: var(--surface);
    padding: 12px 15px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border);
}

.demo-label {
    color: var(--accent-red);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.demo-output {
    padding: 15px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-primary);
    white-space: pre-line;
}

.demo-cta {
    padding: 20px;
    text-align: center;
    border-top: 1px solid var(--border);
    background: var(--surface);
}

.demo-cta-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 15px;
    font-weight: 600;
}

.demo-start-btn {
    padding: 15px 30px;
    background: linear-gradient(135deg, var(--accent-green), #00cc66);
    color: var(--bg-dark);
    border: none;
    border-radius: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;
}

.demo-start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 255, 136, 0.4);
}

/* Main input section - initially hidden, smooth show */
.main-input-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
}

.main-input-section.show {
    opacity: 1;
    transform: translateY(0);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.credits-display {
  background: var(--surface-light);
  border: 1px solid var(--accent-green);
  border-radius: 4px;
  padding: 12px 15px;
  margin: 20px 0;
  text-align: center;
}

.credits-header {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--accent-green);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.credits-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 700;
}

.upgrade-message {
  background: var(--bg-dark);
  border: 1px solid var(--accent-red);
  border-radius: 4px;
  overflow: hidden;
  margin: 20px 0;
}

.upgrade-header {
  background: var(--accent-red);
  color: white;
  padding: 12px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
}

.upgrade-content {
  padding: 25px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.upgrade-btn-primary {
  display: inline-block;
  padding: 15px 25px;
  background: linear-gradient(135deg, var(--accent-red), #cc0044);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 700;
  margin: 15px 0;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.upgrade-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 51, 102, 0.4);
}

.reset-timer {
  margin-top: 20px;
  color: var(--text-secondary);
  font-size: 12px;
}

/* Responsive */
@media (max-width: 640px) {
    .card {
        padding: 30px 25px;
    }
            
    h1 {
        font-size: 2rem;
    }
            
    textarea {
        padding: 15px;
        font-size: 14px;
    }

    .history-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }

    .history-input,
    .history-response {
        padding: 12px;
        font-size: 11px;
    }

    .history-timestamp {
        padding: 6px 12px;
        font-size: 9px;
    }

    .creator-footer {
        margin-top: 25px;
        padding: 15px 0;
    }
    
    .creator-contact {
        flex-direction: column;
        gap: 6px;
    }
    
    .creator-info,
    .creator-contact {
        font-size: 11px;
    }

    /* Add these demo responsive styles here */
    .demo-section {
        margin-bottom: 20px;
    }
    
    .demo-subtitle,
    .demo-input,
    .demo-output {
        font-size: 11px;
        padding: 12px;
    }
    
    .demo-cta {
        padding: 15px;
    }
    
    .demo-start-btn {
        padding: 12px 25px;
        font-size: 13px;
    }
}
`;