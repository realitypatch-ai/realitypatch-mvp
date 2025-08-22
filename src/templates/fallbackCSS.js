// src/templates/fallbackCSS.js - Fallback CSS if external file fails to load
export const getFallbackCSS = () => `
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
  position: relative;
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

.tagline {
  font-size: 16px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 25px;
}

.terminal-prompt {
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-green);
  margin-bottom: 15px;
  font-size: 12px;
}

.input-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent-red);
  margin-bottom: 8px;
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
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: var(--accent-red);
  box-shadow: 0 0 0 2px rgba(255, 51, 102, 0.2);
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
  transition: transform 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
}

.example-btn { 
  padding: 15px 18px; 
  background: transparent; 
  border: 1px solid var(--border); 
  color: var(--text-secondary); 
  font-family: 'JetBrains Mono', monospace; 
  cursor: pointer; 
  width: 100%; 
  margin-bottom: 8px;
  text-align: left;
  transition: all 0.2s;
}

.example-btn:hover {
  border-color: var(--accent-red);
  color: var(--text-primary);
  transform: translateX(8px);
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
}

.result-header {
  background: var(--accent-red);
  color: white;
  padding: 12px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.result-content {
  padding: 25px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-line;
}

.cursor {
  color: var(--accent-red);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.loading {
  color: var(--accent-green);
  text-align: center;
  padding: 40px;
}

.history-section {
  margin-top: 35px;
  padding-top: 25px;
  border-top: 1px solid var(--border);
  display: none;
}

.history-header {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  padding: 10px 0;
}

.history-header h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent-green);
}

.history-items {
  margin-top: 15px;
  display: none;
}

.status-message {
  margin-top: 20px;
  padding: 15px;
  background: var(--surface-light);
  border-left: 3px solid var(--accent-green);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent-green);
}

@media (max-width: 640px) {
  .card { padding: 30px 25px; }
  h1 { font-size: 2rem; }
}
`;