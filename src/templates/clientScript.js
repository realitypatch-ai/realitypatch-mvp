// SIMPLIFIED CLIENT SCRIPT with clean payment handling
export const getClientScript = () => `
// Immediate UI state check
function determineInitialUIState() {
  const hasCompletedFirstTime = ClientDataService.hasCompletedFirstTime();
  const hasLegacyData = ClientDataService.hasLegacyData();
  
  if (hasCompletedFirstTime || hasLegacyData) {
    console.log('⚡ Fast-showing main interface for returning user');
    showMainInterface();
    return 'main';
  } else {
    console.log('👋 Showing first-time experience for new user');
    return 'first-time';
  }
}

// Centralized function to show main interface
function showMainInterface() {
  const firstTimeSection = document.querySelector('.first-time-section');
  
  if (firstTimeSection) {
    firstTimeSection.style.display = 'none';
  }
  
  if (mainInputSection) {
    mainInputSection.style.display = 'block';
    
    setTimeout(() => {
      mainInputSection.classList.add('show');
      if (textarea) textarea.focus();
    }, 50);
  }
  
  ClientDataService.markFirstTimeComplete();
}

// Demo functionality for first-time users
function setupDemoAnalysis() {
  const demoAnalyzeBtn = document.getElementById('demoAnalyzeBtn');
  const demoOutput = document.getElementById('demoOutput');
  
  if (demoAnalyzeBtn && demoOutput) {
    demoAnalyzeBtn.addEventListener('click', () => {
      demoAnalyzeBtn.disabled = true;
      demoAnalyzeBtn.textContent = '> ANALYZING...';
      
      const demoText = document.getElementById('demoText');
      if (demoText) {
        demoText.style.borderLeft = '3px solid var(--accent-red)';
        demoText.style.animation = 'pulse 1s ease-in-out infinite';
      }
      
      setTimeout(() => {
        demoOutput.classList.add('show');
        
        demoAnalyzeBtn.disabled = false;
        demoAnalyzeBtn.textContent = '> RUN PATTERN ANALYSIS';
        
        if (demoText) {
          demoText.style.borderLeft = '3px solid var(--accent-blue)';
          demoText.style.animation = 'none';
        }
        
        if (window.va) {
          window.va('track', 'DemoAnalysisRun');
        }
      }, 2000);
    });
  }
}

// SIMPLIFIED: Background sync without payment interference
class DataSyncManager {
  constructor() {
    this.lastKnownHistoryCount = 0;
    this.lastKnownUsageCount = 0;
    this.sessionId = ClientDataService.getOrCreateSessionId();
    this.isPolling = false;
  }

  startBackgroundSync() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    console.log('📡 Starting background data sync...');
    
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkForChanges();
      } catch (error) {
        console.warn('Background sync check failed:', error.message);
      }
    }, 10000); // Reduced to 10 seconds, less aggressive
  }

  async checkForChanges() {
    try {
      const freshData = await ServerDataService.getUserData(this.sessionId);
      
      const currentHistoryCount = freshData.history?.length || 0;
      const currentUsageCount = freshData.usage?.count || 0;
      
      const historyChanged = currentHistoryCount !== this.lastKnownHistoryCount;
      const usageChanged = currentUsageCount !== this.lastKnownUsageCount;
      
      if (historyChanged || usageChanged) {
        console.log('🔄 Server data changed, updating UI:', {
          historyCount: this.lastKnownHistoryCount + ' → ' + currentHistoryCount,
          usageCount: this.lastKnownUsageCount + ' → ' + currentUsageCount
        });
        
        window.userData = freshData;
        updateUIWithUserData(freshData);
        
        this.lastKnownHistoryCount = currentHistoryCount;
        this.lastKnownUsageCount = currentUsageCount;
      }
    } catch (error) {
      console.warn('Change detection failed:', error.message);
    }
  }

  async initialize() {
    try {
      const userData = await ServerDataService.getUserData(this.sessionId);
      this.lastKnownHistoryCount = userData.history?.length || 0;
      this.lastKnownUsageCount = userData.usage?.count || 0;
      
      console.log('📊 DataSyncManager initialized:', {
        historyCount: this.lastKnownHistoryCount,
        usageCount: this.lastKnownUsageCount
      });
    } catch (error) {
      console.warn('DataSyncManager initialization failed:', error.message);
    }
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.isPolling = false;
      console.log('📡 Background sync stopped');
    }
  }
}

let dataSyncManager;

// NEW: Handle payment return flow
async function handlePaymentReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const creditsAdded = urlParams.get('credits');
  
  if (paymentStatus === 'success' && creditsAdded) {
    console.log('💳 Processing payment return - credits:', creditsAdded);
    
    // Clean URL immediately
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    // Show immediate feedback
    showPaymentProcessingNotification();
    
    // Force immediate server data refresh
    setTimeout(() => {
      refreshCreditsFromServer(parseInt(creditsAdded));
    }, 800); // Small delay for better UX
  }
}

// Show processing notification
function showPaymentProcessingNotification() {
  const notification = document.createElement('div');
  notification.id = 'payment-processing';
  notification.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    padding: 12px 18px;
    border-radius: 8px;
    font-family: "JetBrains Mono", monospace;
    font-size: 13px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(52, 152, 219, 0.4);
    animation: slideInRight 0.4s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
  \`;
  
  notification.innerHTML = \`
    <div style="font-weight: bold; margin-bottom: 4px;">💳 Payment Success</div>
    <div>Adding credits to account...</div>
  \`;
  
  document.body.appendChild(notification);
}

// Force refresh from server after payment
async function refreshCreditsFromServer(expectedCredits) {
  try {
    console.log('🔄 Refreshing data after payment...');
    
    const sessionId = ClientDataService.getOrCreateSessionId();
    
    // Clear any existing cached data to force fresh fetch
    ClientDataService.clearCache();
    
    const freshData = await ServerDataService.getUserData(sessionId);
    
    // Update global state
    window.userData = freshData;
    
    // Update UI completely
    updateUIWithUserData(freshData);
    
    // Remove processing notification
    const processingNotification = document.getElementById('payment-processing');
    if (processingNotification) {
      processingNotification.remove();
    }
    
    // Show success notification
    if (freshData.credits.extra >= expectedCredits) {
      showCreditsAddedNotification(expectedCredits, freshData.credits.extra);
    } else {
      // Fallback if server sync is slow
      showCreditsAddedNotification(expectedCredits, expectedCredits);
    }
    
    console.log('✅ Post-payment refresh complete');
    
  } catch (error) {
    console.error('Post-payment refresh failed:', error);
    
    // Remove processing notification
    const processingNotification = document.getElementById('payment-processing');
    if (processingNotification) {
      processingNotification.remove();
    }
    
    // Show error notification
    showSimpleNotification('Payment processed - credits may take a moment to appear', 'warning');
  }
}

// Clean success notification
function showCreditsAddedNotification(added, total) {
  const notification = document.createElement('div');
  notification.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    color: white;
    padding: 12px 18px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(46, 204, 113, 0.4);
    animation: slideInRight 0.4s ease;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.2);
  \`;
  
  notification.innerHTML = \`
    <div style="font-weight: bold; margin-bottom: 4px;">✓ Credits Added</div>
    <div>+\${added} patches ready to use</div>
  \`;
  
  // Click to dismiss
  notification.onclick = () => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  };
  
  document.body.appendChild(notification);
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Generic notification function
function showSimpleNotification(message, type = 'info', duration = 5000) {
  const colors = {
    success: '#2ecc71',
    warning: '#f39c12', 
    error: '#e74c3c',
    info: '#3498db'
  };

  const notification = document.createElement('div');
  notification.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: \${colors[type]};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: "JetBrains Mono", monospace;
    font-size: 13px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 300px;
    cursor: pointer;
    animation: slideInRight 0.4s ease;
  \`;
  
  notification.textContent = message;
  notification.onclick = () => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  };
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

// DOM Ready handler with payment check
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM ready - checking for payment return');
  
  // FIRST: Check if returning from payment
  handlePaymentReturn();
  
  const initialState = determineInitialUIState();
  
  if (initialState === 'first-time') {
    setupPatternCheckButtons();
    setupDemoAnalysis();
  }
  
  setupEventListeners();
  
  // Load data in background
  setTimeout(() => {
    initializeUserDataBackground();
  }, 100);

  // Initialize background sync
  dataSyncManager = new DataSyncManager();
  dataSyncManager.initialize().then(() => {
    dataSyncManager.startBackgroundSync();
  });
});

function setupPatternCheckButtons() {
  const patterns = {
    perfectionism: {
      name: "Perfectionism Paralysis",
      explanation: "You use the need for perfection as a sophisticated form of procrastination. Every flaw becomes a reason to delay, every imperfection becomes permission to wait.",
      insight: "Done is better than perfect. Perfectionism is fear wearing a respectable mask."
    },
    timing: {
      name: "Timing Fallacy", 
      explanation: "You believe there's a magical 'right time' when conditions will be perfect. This mythical moment never comes because you're using timing as an excuse to avoid risk.",
      insight: "The right time is a myth. The best time was yesterday, the next best time is now."
    },
    readiness: {
      name: "Impostor Shield",
      explanation: "You convince yourself you need more credentials, skills, or preparation. This feels responsible but is actually elaborate self-sabotage through endless preparation.",
      insight: "Competence comes from doing, not from preparing to do. You qualify by starting."
    },
    research: {
      name: "Analysis Paralysis",
      explanation: "Research feels productive, but you are using it as sophisticated procrastination. Each new piece of information gives you permission to delay action just a little longer until you know 'enough.'", 
      insight: "You already know enough to start. More research will not eliminate the fear - only action will."
    }
  };

  document.querySelectorAll('.excuse-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.excuse-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      
      const patternKey = btn.dataset.pattern;
      const pattern = patterns[patternKey];
      
      document.getElementById('patternName').textContent = pattern.name;
      document.getElementById('patternExplanation').textContent = pattern.explanation;
      document.getElementById('patternInsight').textContent = pattern.insight;
      
      const analysis = document.getElementById('patternAnalysis');
      analysis.classList.add('show');
      
      if (window.va) {
        window.va('track', 'PatternSelected', { pattern: patternKey });
      }
    });
  });
}

function setupEventListeners() {
  if (startAnalysisBtn) {
    startAnalysisBtn.addEventListener('click', () => {
      showMainInterface();
      
      if (window.va) {
        window.va('track', 'FirstTimeToInputConversion');
      }
    });
  }

  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (textarea) {
        textarea.value = btn.dataset.example;
        textarea.focus();
      }
      
      const reminder = document.getElementById('assignment-reminder');
      if (reminder) reminder.remove();

      if (window.va) {
        window.va('track', 'ExampleButtonClick', { example: btn.dataset.example });
      }
    });
  });

  if (textarea) {
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 250);
      textarea.style.height = newHeight + 'px';
    });
  }

  if (button) {
    button.addEventListener('click', handlePatchSubmission);
  }
}

// Background data loading
async function initializeUserDataBackground() {
  try {
    if (ClientDataService.hasLegacyData()) {
      const attempts = ClientDataService.getMigrationAttempts();
      
      if (attempts >= 3) {
        console.warn('Maximum migration attempts reached, proceeding without migration');
        showMigrationSkippedNotice();
      } else {
        migrateLegacyData().catch(error => {
          console.error('Background migration failed:', error);
        });
      }
    }
    
    userData = await ServerDataService.getUserData(sessionId);
    updateUIWithUserData(userData);
    
  } catch (error) {
    console.error('Background data loading failed:', error);
  }
}

// ClientDataService implementation
class ClientDataService {
  static SESSION_KEY = 'rp-session-id';
  static PREFERENCES_KEY = 'rp-preferences';
  static CACHE_KEY = 'rp-cache';

  static safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage get failed:', key);
      return null;
    }
  }

  static safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage set failed:', key);
      return false;
    }
  }

  static safeRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage remove failed:', key);
      return false;
    }
  }

  static getOrCreateSessionId() {
    let sessionId = this.safeGet(this.SESSION_KEY);
    
    if (!sessionId) {
      sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.safeSet(this.SESSION_KEY, sessionId);
    }
    
    return sessionId;
  }

  static hasCompletedFirstTime() {
    return this.safeGet('completed-first-time') === 'true';
  }

  static markFirstTimeComplete() {
    this.safeSet('completed-first-time', 'true');
  }

  static hasLegacyData() {
    return !!(this.safeGet('rp-history') || 
              this.safeGet('rp-daily-usage') || 
              this.safeGet('rp-extra-credits'));
  }

  static getLegacyData() {
    try {
      const history = JSON.parse(this.safeGet('rp-history') || '[]');
      const dailyUsage = JSON.parse(this.safeGet('rp-daily-usage') || '{}');
      const extraCredits = parseInt(this.safeGet('rp-extra-credits') || '0');
      const creditsExpiry = this.safeGet('rp-extra-credits-expiry');
      
      return { history: history, dailyUsage: dailyUsage, extraCredits: extraCredits, creditsExpiry: creditsExpiry };
    } catch (error) {
      return { history: [], dailyUsage: {}, extraCredits: 0, creditsExpiry: null };
    }
  }

  static clearLegacyData() {
    this.safeRemove('rp-history');
    this.safeRemove('rp-daily-usage');
    this.safeRemove('rp-extra-credits');
    this.safeRemove('rp-extra-credits-expiry');
    this.safeRemove('rp-history-visible');
  }

  static getMigrationAttempts() {
    try {
      const attempts = this.safeGet('migration-attempts');
      return attempts ? parseInt(attempts) : 0;
    } catch {
      return 0;
    }
  }

  static incrementMigrationAttempts() {
    const current = this.getMigrationAttempts();
    this.safeSet('migration-attempts', (current + 1).toString());
    return current + 1;
  }

  static clearMigrationAttempts() {
    this.safeRemove('migration-attempts');
  }

  static cacheData(key, data, expiryMinutes) {
    expiryMinutes = expiryMinutes || 30;
    try {
      const cacheItem = {
        data: data,
        expiry: Date.now() + (expiryMinutes * 60 * 1000),
        timestamp: Date.now()
      };
      this.safeSet('cache_' + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Cannot cache data');
    }
  }

  static getCachedData(key) {
    try {
      const stored = this.safeGet('cache_' + key);
      if (!stored) return null;
      
      const item = JSON.parse(stored);
      if (Date.now() < item.expiry) {
        return item.data;
      }
      
      this.safeRemove('cache_' + key);
      return null;
    } catch (error) {
      return null;
    }
  }

  static clearCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          this.safeRemove(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear failed');
    }
  }
}

class ServerDataService {
  static async getUserData(sessionId) {
    try {
      const response = await fetch('/api/user-data?sessionId=' + sessionId, {
        headers: { 'X-Session-ID': sessionId }
      });
      
      if (!response.ok) throw new Error('Server error: ' + response.status);
      
      const data = await response.json();
      ClientDataService.cacheData('userData', data, 15);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      
      const cached = ClientDataService.getCachedData('userData');
      if (cached) {
        console.warn('Using cached user data');
        return cached;
      }
      
      return {
        history: [],
        usage: { count: 0, remaining: 10, limit: 10 },
        credits: { extra: 0, expiry: null },
        lastSync: null
      };
    }
  }

  static async submitPatch(sessionId, userInput) {
    const requestData = {
      userInput: userInput,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) throw new Error('Server error: ' + response.status);
      
      const data = await response.json();
      
      if (data.userData) {
        ClientDataService.cacheData('userData', data.userData, 15);
      }
      
      return data;
    } catch (error) {
      console.error('Patch submission failed:', error);
      throw error;
    }
  }

  static async canMakeRequest(sessionId) {
    try {
      const userData = await this.getUserData(sessionId);
      const dailyUsed = userData.usage.count;
      const dailyLimit = userData.usage.limit;
      const extraCredits = userData.credits.extra;
      
      const canUse = dailyUsed < dailyLimit || extraCredits > 0;
      const willUseExtra = dailyUsed >= dailyLimit && extraCredits > 0;
      
      return {
        allowed: canUse,
        willUseExtra: willUseExtra,
        dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
        extraCredits: extraCredits
      };
    } catch (error) {
      console.error('Error checking request permission:', error);
      return { allowed: false, willUseExtra: false, dailyRemaining: 0, extraCredits: 0 };
    }
  }

  static async migrateLegacyData(sessionId, legacyData) {
    try {
      console.log('Migrating legacy data to server...', {
        historyItems: legacyData.history?.length || 0,
        extraCredits: legacyData.extraCredits || 0,
        dailyUsage: legacyData.dailyUsage?.count || 0
      });
      
      const response = await fetch('/api/migrate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(legacyData)
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse migration response:', parseError);
        throw new Error('Invalid server response format');
      }

      if (!response.ok) {
        console.error('Migration request failed:', response.status, result);
        throw new Error('Migration server error: ' + response.status + ' - ' + (result.error || 'Unknown error'));
      }
      
      console.log('Migration successful:', result);
      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

// DOM elements
const button = document.getElementById('patchBtn');
const textarea = document.getElementById('userInput');
const output = document.getElementById('output');
const resultContent = document.getElementById('resultContent');
const historySection = document.getElementById('historySection');
const startAnalysisBtn = document.getElementById('startAnalysisBtn');
const mainInputSection = document.getElementById('mainInputSection');

// Session management
let sessionId = ClientDataService.getOrCreateSessionId();
let userData = null;

async function migrateLegacyData() {
  const attempts = ClientDataService.incrementMigrationAttempts();
  
  try {
    const legacyData = ClientDataService.getLegacyData();
    
    if (legacyData.history.length === 0 && legacyData.extraCredits === 0 && (!legacyData.dailyUsage.count || legacyData.dailyUsage.count === 0)) {
      console.log('No meaningful legacy data to migrate, clearing localStorage');
      ClientDataService.clearLegacyData();
      ClientDataService.clearMigrationAttempts();
      return;
    }

    const migrationResult = await ServerDataService.migrateLegacyData(sessionId, legacyData);
    
    if (migrationResult && migrationResult.success && !migrationResult.preserveLocalData) {
      console.log('✅ Migration successful, clearing localStorage:', migrationResult.migrated);
      
      if (migrationResult.migrated.extraCredits > 0) {
        const userData = await ServerDataService.getUserData(sessionId);
        if (userData.credits.extra >= migrationResult.migrated.extraCredits) {
          ClientDataService.clearLegacyData();
          ClientDataService.clearMigrationAttempts();
          showMigrationSuccessNotice(migrationResult.migrated);
        } else {
          throw new Error('Credits not properly saved to server');
        }
      } else {
        ClientDataService.clearLegacyData();
        ClientDataService.clearMigrationAttempts();
        showMigrationSuccessNotice(migrationResult.migrated);
      }
    } else {
      throw new Error('Migration failed or incomplete');
    }
  } catch (error) {
    console.error('Migration failed (attempt ' + attempts + '):', error);
    
    if (attempts >= 3) {
      showMigrationSkippedNotice();
    } else {
      showMigrationErrorNotice('Temporary error - credits safe, will retry');
    }
  }
}

function updateUIWithUserData(data) {
  if (!data) return;
  
  if (data.history && data.history.length > 0) {
    ClientDataService.markFirstTimeComplete();
    showHistorySection(data.history);
    
    const pendingAssignments = getPendingAssignments(data.history);
    if (pendingAssignments.length > 0) {
      showAssignmentReminder(pendingAssignments);
    }
  }
  
  updateCreditsDisplay(data.credits);
}

function showHistorySection(history) {
  const historyCount = document.getElementById('historyCount');
  if (historyCount) {
    historyCount.textContent = history.length;
  }
  
  const historyContent = document.getElementById('history-content');
  if (!historyContent) return;
  
  function renderHistoryItem(item, index) {
    const followUpBadge = item.isFollowUp ? '<span class="follow-up-badge">FOLLOW-UP</span>' : '';
    
    let assignmentBadge = '';
    if (item.response && item.response.includes('Your assignment:') && !item.isFollowUp) {
      if (item.completed) {
        assignmentBadge = '<span class="assignment-badge completed">COMPLETED</span>';
      } else {
        assignmentBadge = '<span class="assignment-badge">PENDING</span>';
      }
    }
    
    return '<div class="history-item">' +
      '<div class="history-input">"' + item.input + '"' + followUpBadge + assignmentBadge + '</div>' +
      '<div class="history-response">' + item.response + '</div>' +
      '<div class="history-timestamp">' + new Date(item.timestamp).toLocaleDateString() + '</div>' +
      '</div>';
  }
  
  const recentHistory = history.slice(-3).reverse();
  const olderHistory = history.slice(0, -3).reverse();
  
  let historyHTML = recentHistory.map(renderHistoryItem).join('');
  
  if (olderHistory.length > 0) {
    historyHTML += 
      '<div class="older-history-section">' +
        '<div class="older-history-toggle" onclick="toggleOlderHistory()">' +
          '<span id="older-history-indicator" data-count="' + olderHistory.length + '">&gt; Show ' + olderHistory.length + ' older patches</span>' +
        '</div>' +
        '<div class="older-history-content" id="older-history-content" style="display: none;">' +
          olderHistory.map(renderHistoryItem).join('') +
        '</div>' +
      '</div>';
  }
  
  historyContent.innerHTML = historyHTML;
  
  if (historySection) {
    historySection.style.display = 'block';
  }
}

window.toggleOlderHistory = function() {
  const content = document.getElementById('older-history-content');
  const indicator = document.getElementById('older-history-indicator');
  
  if (!content || !indicator) return;
  
  const isCurrentlyVisible = content.style.display !== 'none';
  const count = indicator.getAttribute('data-count');
  
  if (isCurrentlyVisible) {
    content.style.display = 'none';
    indicator.textContent = '> Show ' + count + ' older patches';
  } else {
    content.style.display = 'block';
    indicator.textContent = '> Hide older patches';
  }
}

function updateCreditsDisplay(credits) {
  let creditsDisplay = document.getElementById('credits-display');
  
  if (credits && credits.extra > 0) {
    if (!creditsDisplay) {
      creditsDisplay = document.createElement('div');
      creditsDisplay.id = 'credits-display';
      creditsDisplay.className = 'credits-display';
      const header = document.querySelector('.header');
      if (header) {
        header.insertAdjacentElement('afterend', creditsDisplay);
      }
    }
    
    creditsDisplay.innerHTML = 
      '<div class="credits-header">&gt; EXTRA_CREDITS.AVAILABLE</div>' +
      '<div class="credits-count">' + credits.extra + ' patches remaining</div>';
  } else if (creditsDisplay) {
    creditsDisplay.remove();
  }
}

function getPendingAssignments(history) {
  const now = Date.now();
  return history
    .filter(item => 
      item.response && 
      item.response.includes('Your assignment:') && 
      !item.isFollowUp &&
      !item.completed
    )
    .map(item => {
      const timeSince = now - new Date(item.timestamp).getTime();
      const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));
      return Object.assign({}, item, { hoursSince: hoursSince });
    })
    .filter(item => item.hoursSince >= 12);
}

function showAssignmentReminder(pendingAssignments) {
  const reminderHeader = '&gt; ASSIGNMENT_STATUS: OVERDUE';
  const reminderContent = 'It has been ' + pendingAssignments[0].hoursSince + ' hours. Did you complete your assignment or do you have an excuse?';
  
  const reminderHtml = '<div id="assignment-reminder" class="assignment-reminder">' +
    '<div class="reminder-header">' + reminderHeader + '</div>' +
    '<div class="reminder-content">' + reminderContent + '</div>' +
    '</div>';
  
  const header = document.querySelector('.header');
  if (header) {
    header.insertAdjacentHTML('afterend', reminderHtml);
  }
}

async function handlePatchSubmission() {
  const text = textarea.value.trim();
  if (!text) {
    textarea.focus();
    return;
  }
  
  button.disabled = true;
  button.textContent = 'PROCESSING...';
  
  output.classList.add('show');
  resultContent.innerHTML = '<div class="loading">&gt; Analyzing psychological patterns<span class="loading-dots"></span></div>';

  try {
    const permissionCheck = await ServerDataService.canMakeRequest(sessionId);

    if (!permissionCheck.allowed) {
      showUpgradeMessage();
      return;
    }

    if (window.va) {
      window.va('track', 'RealityPatchRequest', { 
        inputLength: text.length,
        willUseExtra: permissionCheck.willUseExtra
      });
    }
    
    const response = await ServerDataService.submitPatch(sessionId, text);
    
    if (response.limitReached) {
      showUpgradeMessage();
      return;
    }
    
    typewriterEffect(response.patch, () => {
      setTimeout(() => {
        const statusHtml = response.isFollowUp 
          ? '<div class="status-message follow-up">Progress tracking activated.</div>'
          : '<div class="status-message">Assignment given. Come back in 24 hours.</div>';
        
        resultContent.innerHTML += statusHtml;
      }, 1000);
      
      if (response.userData) {
        userData = response.userData;
        ClientDataService.cacheData('userData', userData, 15);
        updateUIWithUserData(userData);
      }
      
      textarea.value = '';
      textarea.style.height = '120px';
    });
    
  } catch (error) {
    console.error('Request failed:', error);
    resultContent.innerHTML = '<div class="error">&gt; ERROR: ' + error.message + '</div>';
  } finally {
    button.disabled = false;
    button.textContent = 'GET MY ANALYSIS';
  }
}

function typewriterEffect(text, callback) {
  let i = 0;
  resultContent.innerHTML = '';
  
  const typewriter = setInterval(() => {
    if (i < text.length) {
      resultContent.innerHTML += text.charAt(i);
      i++;
    } else {
      clearInterval(typewriter);
      if (callback) callback();
    }
  }, 20);
}

function showUpgradeMessage() {
  const upgradeHtml = 
    '<div class="upgrade-message">' +
    '<div class="upgrade-header">&gt; DAILY_LIMIT_REACHED</div>' +
    '<div class="upgrade-content">' +
    '<p>You have used your 10 daily reality checks.</p>' +
    '<p>Ready for more brutal honesty?</p>' +
    '<a href="https://buy.stripe.com/fZu7sNccYevN7bR8ON3wQ00" class="upgrade-btn-primary">' +
    'Get 10 More Patches - $4.99' +
    '</a>' +
    '</div>' +
    '</div>';
  
  resultContent.innerHTML = upgradeHtml;
  output.classList.add('show');
}

function showMigrationSuccessNotice(migrated) {
  if (migrated.extraCredits > 0 || migrated.historyItems > 0) {
    const message = 'Data synced: ' + 
      (migrated.extraCredits > 0 ? migrated.extraCredits + ' credits' : '') +
      (migrated.historyItems > 0 ? (migrated.extraCredits > 0 ? ', ' : '') + migrated.historyItems + ' history items' : '');
    
    showSimpleNotification(message, 'success', 5000);
  }
}

function showMigrationErrorNotice(message) {
  showSimpleNotification('Sync issue: ' + message, 'warning', 8000);
}

function showMigrationSkippedNotice() {
  showSimpleNotification('Using local data - sync will be attempted later', 'info', 6000);
}

window.toggleHistory = function() {
  const content = document.getElementById('history-content');
  const toggle = document.getElementById('history-toggle');
  
  if (!content || !toggle) return;
  
  const isCurrentlyVisible = window.getComputedStyle(content).display !== 'none';
  
  if (isCurrentlyVisible) {
    content.style.display = 'none';
    toggle.textContent = '> Show';
    ClientDataService.safeSet('rp-history-visible', 'false');
  } else {
    content.style.display = 'block';
    toggle.textContent = '> Hide';
    ClientDataService.safeSet('rp-history-visible', 'true');
  }
}

// Debug functions for console
async function exhaustDailyLimit() {
  console.log('Making 10 requests to exhaust daily limit...');
  
  for (let i = 1; i <= 10; i++) {
    try {
      const response = await fetch('/api/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': ClientDataService.getOrCreateSessionId()
        },
        body: JSON.stringify({ 
          userInput: 'Test request ' + i 
        })
      });
      
      const data = await response.json();
      console.log('Request ' + i + ':', data.limitReached ? 'LIMIT REACHED' : 'Success');
      
      if (data.userData) {
        window.userData = data.userData;
        updateUIWithUserData(data.userData);
      }
      
      if (data.limitReached) {
        console.log('Daily limit exhausted!');
        break;
      }
    } catch (error) {
      console.log('Request ' + i + ' failed:', error.message);
    }
  }
  
  console.log('Requests complete - checking final state...');
  await refreshUserData();
}

async function refreshUserData() {
  const sessionId = ClientDataService.getOrCreateSessionId();
  const freshData = await ServerDataService.getUserData(sessionId);
  
  window.userData = freshData;
  updateUIWithUserData(freshData);
  
  console.log('UI refreshed');
  console.log('Usage: ' + freshData.usage.count + '/' + freshData.usage.limit);
  console.log('History count: ' + (freshData.history ? freshData.history.length : 0));
  console.log('Credits: ' + freshData.credits.extra);
}

window.exhaustDailyLimit = exhaustDailyLimit;
window.refreshUserData = refreshUserData;

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = 
  '@keyframes slideInRight {' +
    'from { transform: translateX(100%); opacity: 0; }' +
    'to { transform: translateX(0); opacity: 1; }' +
  '}' +
  '@keyframes slideOutRight {' +
    'from { transform: translateX(0); opacity: 1; }' +
    'to { transform: translateX(100%); opacity: 0; }' +
  '}';
document.head.appendChild(style);

if (window.va) {
  window.va('track', 'PageView');
}
`;