// src/templates/clientScript.js - FIXED client migration logic
export const getClientScript = () => `
// ClientDataService implementation (inline) - UNCHANGED
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

  static getPreferences() {
    try {
      const stored = this.safeGet(this.PREFERENCES_KEY);
      return stored ? JSON.parse(stored) : { historyVisible: true };
    } catch (error) {
      return { historyVisible: true };
    }
  }

  static savePreferences(preferences) {
    try {
      const current = this.getPreferences();
      const updated = Object.assign({}, current, preferences);
      this.safeSet(this.PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Cannot save preferences');
    }
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

  // ADDED: Track migration attempts to prevent infinite loops
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
}

// ServerDataService implementation - FIXED migration logic
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

  // COMPLETELY REWRITTEN migration with proper error handling
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

      // Parse response regardless of status code
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
}

// DOM elements - UNCHANGED
const button = document.getElementById('patchBtn');
const textarea = document.getElementById('userInput');
const output = document.getElementById('output');
const resultContent = document.getElementById('resultContent');
const historySection = document.getElementById('historySection');
const startAnalysisBtn = document.getElementById('startAnalysisBtn');
const mainInputSection = document.getElementById('mainInputSection');

// Demo section interaction - UNCHANGED
if (startAnalysisBtn) {
  startAnalysisBtn.addEventListener('click', () => {
    document.querySelector('.demo-section').style.display = 'none';
    mainInputSection.style.display = 'block';
    
    setTimeout(() => {
      mainInputSection.classList.add('show');
      textarea.focus();
    }, 100);
    
    if (window.va) {
      window.va('track', 'DemoToInputConversion');
    }
  });
}

// Session management - UNCHANGED
let sessionId = ClientDataService.getOrCreateSessionId();
let userData = null;

// Load user data on page load - UNCHANGED
window.addEventListener('load', async () => {
  await initializeUserData();
});

// COMPLETELY REWRITTEN initialization with robust migration
async function initializeUserData() {
  try {
    // Check for legacy data migration with attempt limiting
    if (ClientDataService.hasLegacyData()) {
      const attempts = ClientDataService.getMigrationAttempts();
      console.log('Migration attempts so far:', attempts);
      
      if (attempts >= 3) {
        console.warn('Maximum migration attempts reached, proceeding without migration');
        showMigrationSkippedNotice();
        // Don't clear data, just proceed
      } else {
        await migrateLegacyData();
      }
    }
    
    // Load user data from server
    userData = await ServerDataService.getUserData(sessionId);
    updateUIWithUserData(userData);
    
  } catch (error) {
    console.error('Failed to initialize user data:', error);
    // Fallback to basic UI
    const demoSection = document.querySelector('.demo-section');
    if (demoSection) demoSection.style.display = 'none';
    if (mainInputSection) {
      mainInputSection.style.display = 'block';
      mainInputSection.classList.add('show');
    }
  }
}

// COMPLETELY REWRITTEN migration with robust error handling
async function migrateLegacyData() {
  const attempts = ClientDataService.incrementMigrationAttempts();
  
  try {
    console.log('Migration attempt:', attempts);
    const legacyData = ClientDataService.getLegacyData();
    
    // Only attempt migration if there's actual data
    if (legacyData.history.length === 0 && legacyData.extraCredits === 0 && (!legacyData.dailyUsage.count || legacyData.dailyUsage.count === 0)) {
      console.log('No meaningful legacy data to migrate, clearing localStorage');
      ClientDataService.clearLegacyData();
      ClientDataService.clearMigrationAttempts();
      return;
    }

    console.log('Sending migration data:', {
      historyItems: legacyData.history.length,
      extraCredits: legacyData.extraCredits,
      dailyUsage: legacyData.dailyUsage?.count || 0
    });
    
    const migrationResult = await ServerDataService.migrateLegacyData(sessionId, legacyData);
    
    // Check for successful migration
    if (migrationResult && migrationResult.success) {
      console.log('Migration successful, clearing localStorage:', migrationResult.migrated);
      ClientDataService.clearLegacyData();
      ClientDataService.clearMigrationAttempts();
      showMigrationSuccessNotice(migrationResult.migrated);
    } else {
      console.error('Migration response indicates failure:', migrationResult);
      throw new Error('Migration response indicates failure');
    }
  } catch (error) {
    console.error('Migration failed (attempt ' + attempts + '):', error);
    
    // Specific error handling based on error type
    if (error.message.includes('500')) {
      console.log('Server error detected - will retry next time');
      showMigrationErrorNotice('Server error - your data is safe locally');
    } else if (error.message.includes('400')) {
      console.log('Client error detected - clearing invalid data');
      ClientDataService.clearLegacyData();
      ClientDataService.clearMigrationAttempts();
    } else if (attempts >= 3) {
      console.log('Maximum attempts reached - giving up on migration');
      showMigrationSkippedNotice();
    } else {
      console.log('Temporary error - will retry next time');
      showMigrationErrorNotice('Temporary error - will retry later');
    }
  }
}

// User notification functions for migration status
function showMigrationSuccessNotice(migrated) {
  if (migrated.extraCredits > 0 || migrated.historyItems > 0) {
    const message = 'Data synced: ' + 
      (migrated.extraCredits > 0 ? migrated.extraCredits + ' credits' : '') +
      (migrated.historyItems > 0 ? (migrated.extraCredits > 0 ? ', ' : '') + migrated.historyItems + ' history items' : '');
    
    showNotice(message, 'success', 5000);
  }
}

function showMigrationErrorNotice(message) {
  showNotice('Sync issue: ' + message, 'warning', 8000);
}

function showMigrationSkippedNotice() {
  showNotice('Using local data - sync will be attempted later', 'info', 6000);
}

function showNotice(message, type = 'info', duration = 5000) {
  const colors = {
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db'
  };

  const notice = document.createElement('div');
  notice.style.cssText = 'position: fixed; top: 20px; right: 20px; background: ' + colors[type] + '; color: white; padding: 12px 16px; border-radius: 6px; font-family: "JetBrains Mono", monospace; font-size: 13px; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width: 300px; cursor: pointer;';
  notice.textContent = message;
  notice.onclick = () => notice.remove();
  
  document.body.appendChild(notice);
  
  setTimeout(() => {
    if (notice.parentNode) notice.remove();
  }, duration);
}

// Rest of functions remain UNCHANGED...
function updateUIWithUserData(data) {
  if (!data) return;
  
  if (data.history && data.history.length > 0) {
    showHistorySection(data.history);
    
    const pendingAssignments = getPendingAssignments(data.history);
    if (pendingAssignments.length > 0) {
      showAssignmentReminder(pendingAssignments);
    }
    
    const demoSection = document.querySelector('.demo-section');
    if (demoSection) demoSection.style.display = 'none';
    if (mainInputSection) {
      mainInputSection.style.display = 'block';
      mainInputSection.classList.add('show');
    }
  }
  
  updateCreditsDisplay(data.credits);
  updateUsageDisplay(data.usage);
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

function updateUsageDisplay(usage) {
  console.log('Daily usage:', usage.count, '/', usage.limit);
}

function showUpgradeMessage() {
  const upgradeHtml = 
    '<div class="upgrade-message">' +
    '<div class="upgrade-header">&gt; DAILY_LIMIT_REACHED</div>' +
    '<div class="upgrade-content">' +
    '<p>You have used your 10 daily reality checks.</p>' +
    '<p>Ready for more brutal honesty?</p>' +
    '<div class="upgrade-options">' +
    '<a href="https://buy.stripe.com/fZu7sNccYevN7bR8ON3wQ00" class="upgrade-btn-primary">' +
    'Get 10 More Patches - $4.99' +
    '</a>' +
    '<div class="reset-timer">' +
    'Next free patches in: <span id="reset-countdown">calculating...</span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
  
  resultContent.innerHTML = upgradeHtml;
  output.classList.add('show');
  
  startResetCountdown();
}

function startResetCountdown() {
  const countdownEl = document.getElementById('reset-countdown');
  if (!countdownEl) return;
  
  function updateCountdown() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeLeft = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    countdownEl.textContent = hours + 'h ' + minutes + 'm ' + seconds + 's';
  }
  
  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
  
  window.addEventListener('beforeunload', () => clearInterval(timer));
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
  const reminderHeader = pendingAssignments.length === 1 
    ? '&gt; ASSIGNMENT_STATUS: OVERDUE'
    : '&gt; ASSIGNMENT_STATUS: MULTIPLE_OVERDUE (' + pendingAssignments.length + ')';
  
  let reminderContent;
  if (pendingAssignments.length === 1) {
    const assignment = pendingAssignments[0];
    reminderContent = 'It has been ' + assignment.hoursSince + ' hours. Did you complete your assignment or do you have an excuse?';
  } else {
    const oldestHours = Math.max.apply(Math, pendingAssignments.map(a => a.hoursSince));
    reminderContent = 'You have ' + pendingAssignments.length + ' overdue assignments. The oldest is ' + oldestHours + ' hours old. Time to report back!';
  }
  
  const reminderHtml = '<div id="assignment-reminder" class="assignment-reminder">' +
    '<div class="reminder-header">' + reminderHeader + '</div>' +
    '<div class="reminder-content">' + reminderContent + '</div>' +
    '</div>';
  
  const header = document.querySelector('.header');
  if (header) {
    header.insertAdjacentHTML('afterend', reminderHtml);
  }
}

function showHistorySection(history) {
  const historyCount = document.getElementById('historyCount');
  if (historyCount) {
    historyCount.textContent = history.length;
  }
  
  const historyContent = document.getElementById('history-content');
  if (!historyContent) return;
  
  historyContent.innerHTML = history.slice(-3).reverse().map(function(item, index) {
    const followUpBadge = item.isFollowUp ? '<span class="follow-up-badge">FOLLOW-UP</span>' : '';
    
    let assignmentBadge = '';
    if (item.response && item.response.includes('Your assignment:') && !item.isFollowUp) {
      if (item.completed) {
        assignmentBadge = '<span class="assignment-badge completed">COMPLETED</span>';
      } else if (item.completedAssignmentId === 'unclear' || item.completedAssignmentId === 'mass_unclear') {
        assignmentBadge = '<span class="assignment-badge unclear">CLARIFICATION NEEDED</span>';
      } else {
        assignmentBadge = '<span class="assignment-badge">PENDING</span>';
      }
    }
    
    return '<div class="history-item">' +
      '<div class="history-input">"' + item.input + '"' + followUpBadge + assignmentBadge + '</div>' +
      '<div class="history-response">' + item.response + '</div>' +
      '<div class="history-timestamp">' + new Date(item.timestamp).toLocaleDateString() + 
      (item.completed ? ' • Completed: ' + new Date(item.completedAt || item.timestamp).toLocaleDateString() : '') +
      '</div>' +
      '</div>';
  }).join('');
  
  if (historySection) {
    historySection.style.display = 'block';
  }
  
  const savedState = localStorage.getItem('rp-history-visible');
  const shouldShow = savedState === null ? true : savedState === 'true';
  
  const toggle = document.getElementById('history-toggle');
  if (toggle && historyContent) {
    if (shouldShow) {
      historyContent.style.display = 'block';
      toggle.textContent = '> Hide';
    } else {
      historyContent.style.display = 'none';
      toggle.textContent = '> Show';
    }
  }
}

window.toggleHistory = function() {
  const content = document.getElementById('history-content');
  const toggle = document.getElementById('history-toggle');
  
  if (!content || !toggle) return;
  
  const isCurrentlyVisible = window.getComputedStyle(content).display !== 'none';
  
  if (isCurrentlyVisible) {
    content.style.display = 'none';
    toggle.textContent = '> Show';
    localStorage.setItem('rp-history-visible', 'false');
  } else {
    content.style.display = 'block';
    toggle.textContent = '> Hide';
    localStorage.setItem('rp-history-visible', 'true');
  }
}

function markAssignmentCompletedLocally(completedAssignmentId) {
  if (!userData || !userData.history) return;
  
  const assignment = userData.history.find(item => 
    item.id === completedAssignmentId || 
    String(item.id) === String(completedAssignmentId)
  );
  
  if (assignment) {
    assignment.completed = true;
    assignment.completedAt = new Date().toISOString();
    showHistorySection(userData.history);
    
    const reminder = document.getElementById('assignment-reminder');
    if (reminder) reminder.remove();
  }
}

document.addEventListener('DOMContentLoaded', function() {
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
});

if (textarea) {
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 250);
    textarea.style.height = newHeight + 'px';
  });
}

if (button) {
  button.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) {
      textarea.focus();
      return;
    }
    
    button.disabled = true;
    button.textContent = 'PROCESSING...';
    
    output.classList.add('show');
    resultContent.innerHTML = '<div class="loading">&gt; Analyzing psychological patterns<span class="loading-dots"></span></div>';

    const reminder = document.getElementById('assignment-reminder');
    if (reminder) reminder.remove();

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
      
      if (response.userData) {
        userData = response.userData;
        updateUIWithUserData(userData);
      }
      
      if (response.completedAssignmentId) {
        markAssignmentCompletedLocally(response.completedAssignmentId);
      }
      
      typewriterEffect(response.patch, () => {
        setTimeout(() => {
          const statusHtml = response.isFollowUp 
            ? '<div class="status-message follow-up">Progress tracking activated.</div>'
            : '<div class="status-message">Assignment given. Come back in 24 hours.</div>';
          
          resultContent.innerHTML += statusHtml;
        }, 1000);
        
        if (userData && userData.history) {
          showHistorySection(userData.history);
        }
        
        textarea.value = '';
        textarea.style.height = '120px';
      });
      
      if (window.va) {
        window.va('track', 'RealityPatchDelivered', { 
          isFollowUp: response.isFollowUp 
        });
      }
      
    } catch (error) {
      console.error('Request failed:', error);
      resultContent.innerHTML = '<div class="error">&gt; ERROR: ' + error.message + '</div>';
      
      if (window.va) {
        window.va('track', 'RealityPatchError', { error: error.message });
      }
    } finally {
      button.disabled = false;
      button.textContent = 'ANALYZE PATTERN';
    }
  });
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

if (window.va) {
  window.va('track', 'PageView');
}
`;