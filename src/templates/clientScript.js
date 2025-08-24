// src/templates/clientScript.js - Complete client-side JavaScript
export const getClientScript = () => `
// ClientDataService implementation (inline)
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
}

// ServerDataService implementation (inline)
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

  static async migrateLegacyData(sessionId, legacyData) {
    try {
      console.log('Migrating legacy data to server...');
      
      const response = await fetch('/api/migrate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(legacyData)
      });

      if (!response.ok) throw new Error('Migration failed: ' + response.status);
      
      const result = await response.json();
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

// DOM elements
const button = document.getElementById('patchBtn');
const textarea = document.getElementById('userInput');
const output = document.getElementById('output');
const resultContent = document.getElementById('resultContent');
const historySection = document.getElementById('historySection');
const startAnalysisBtn = document.getElementById('startAnalysisBtn');
const mainInputSection = document.getElementById('mainInputSection');

// Demo section interaction
if (startAnalysisBtn) {
  startAnalysisBtn.addEventListener('click', () => {
    // Hide demo section and show main input
    document.querySelector('.demo-section').style.display = 'none';
    mainInputSection.style.display = 'block';
    
    // Trigger the show animation
    setTimeout(() => {
      mainInputSection.classList.add('show');
      // Focus on textarea for immediate interaction
      textarea.focus();
    }, 100);
    
    // Track demo conversion
    if (window.va) {
      window.va('track', 'DemoToInputConversion');
    }
  });
}

// Session management
let sessionId = ClientDataService.getOrCreateSessionId();
let userData = null;

// Load user data on page load
window.addEventListener('load', async () => {
  await initializeUserData();
});

async function initializeUserData() {
  try {
    // Check for legacy data migration
    if (ClientDataService.hasLegacyData()) {
      await migrateLegacyData();
    }
    
    // Load user data from server
    userData = await ServerDataService.getUserData(sessionId);
    
    // Update UI
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

async function migrateLegacyData() {
  try {
    console.log('Migrating legacy localStorage data...');
    const legacyData = ClientDataService.getLegacyData();
    
    if (legacyData.history.length > 0 || legacyData.extraCredits > 0) {
      await ServerDataService.migrateLegacyData(sessionId, legacyData);
      ClientDataService.clearLegacyData();
      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.error('Migration failed, keeping localStorage data:', error);
  }
}

function updateUIWithUserData(data) {
  if (!data) return;
  
  // Show history if exists
  if (data.history && data.history.length > 0) {
    showHistorySection(data.history);
    
    // Check for pending assignments
    const pendingAssignments = getPendingAssignments(data.history);
    if (pendingAssignments.length > 0) {
      showAssignmentReminder(pendingAssignments);
    }
    
    // Skip demo, show main input
    const demoSection = document.querySelector('.demo-section');
    if (demoSection) demoSection.style.display = 'none';
    if (mainInputSection) {
      mainInputSection.style.display = 'block';
      mainInputSection.classList.add('show');
    }
  }
  
  // Update credits display
  updateCreditsDisplay(data.credits);
  
  // Update usage info
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
  // Update any usage display elements
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
  
  // Start countdown to midnight reset
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
  
  // Clear timer when user navigates away
  window.addEventListener('beforeunload', () => clearInterval(timer));
}

// Helper function to get pending assignments from history
function getPendingAssignments(history) {
  const now = Date.now();
  return history
    .filter(item => 
      item.response && 
      item.response.includes('Your assignment:') && 
      !item.isFollowUp &&
      !item.completed // Only show incomplete assignments
    )
    .map(item => {
      const timeSince = now - new Date(item.timestamp).getTime();
      const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));
      return Object.assign({}, item, { hoursSince: hoursSince });
    })
    .filter(item => item.hoursSince >= 12); // Only show assignments that are 12+ hours old
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
    
    // Enhanced assignment badge with completion status
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
  
  // Check user's saved preference, default to visible for new users
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
  
  // Check actual computed display style
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

// Update assignment completion to work with server data
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
    
    // Remove reminder
    const reminder = document.getElementById('assignment-reminder');
    if (reminder) reminder.remove();
  }
}

// Example buttons functionality (only when main input is visible)
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (textarea) {
        textarea.value = btn.dataset.example;
        textarea.focus();
      }
      
      // Remove assignment reminder if it exists
      const reminder = document.getElementById('assignment-reminder');
      if (reminder) reminder.remove();

      // Track example button clicks
      if (window.va) {
        window.va('track', 'ExampleButtonClick', { example: btn.dataset.example });
      }
    });
  });
});

// Auto-resize textarea (only when visible)
if (textarea) {
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 250);
    textarea.style.height = newHeight + 'px';
  });
}

// Enhanced button click with proper credit system integration
if (button) {
  button.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) {
      textarea.focus();
      return;
    }
    
    button.disabled = true;
    button.textContent = 'PROCESSING...';
    
    // Show loading
    output.classList.add('show');
    resultContent.innerHTML = '<div class="loading">&gt; Analyzing psychological patterns<span class="loading-dots"></span></div>';

    // Remove assignment reminder
    const reminder = document.getElementById('assignment-reminder');
    if (reminder) reminder.remove();

    try {
      // Check if can make request
      const permissionCheck = await ServerDataService.canMakeRequest(sessionId);
      
      if (!permissionCheck.allowed) {
        showUpgradeMessage();
        return;
      }
      
      // Track request
      if (window.va) {
        window.va('track', 'RealityPatchRequest', { 
          inputLength: text.length,
          willUseExtra: permissionCheck.willUseExtra
        });
      }
      
      // Submit to server
      const response = await ServerDataService.submitPatch(sessionId, text);
      
      if (response.limitReached) {
        showUpgradeMessage();
        return;
      }
      
      // Update local user data
      if (response.userData) {
        userData = response.userData;
        updateUIWithUserData(userData);
      }
      
      // Handle assignment completion
      if (response.completedAssignmentId) {
        markAssignmentCompletedLocally(response.completedAssignmentId);
      }
      
      // Typewriter effect
      typewriterEffect(response.patch, () => {
        // Add status message after typewriter
        setTimeout(() => {
          const statusHtml = response.isFollowUp 
            ? '<div class="status-message follow-up">Progress tracking activated.</div>'
            : '<div class="status-message">Assignment given. Come back in 24 hours.</div>';
          
          resultContent.innerHTML += statusHtml;
        }, 1000);
        
        // Update history display
        if (userData && userData.history) {
          showHistorySection(userData.history);
        }
        
        // Clear textarea
        textarea.value = '';
        textarea.style.height = '120px';
      });
      
      // Track success
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

// Track page views
if (window.va) {
  window.va('track', 'PageView');
}
`;