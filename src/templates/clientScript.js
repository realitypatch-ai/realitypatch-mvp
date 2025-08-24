// src/templates/clientScript.js - Client-side JavaScript with demo section handling
export const getClientScript = () => `
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
let sessionId = localStorage.getItem('rp-session-id');

// Load history on page load
window.addEventListener('load', loadHistory);

async function loadHistory() {
  const localHistory = loadHistoryFromLocal();
  
  if (localHistory && localHistory.length > 0) {
    showHistorySection(localHistory);
    
    // Check if user has pending assignments (incomplete only)
    const pendingAssignments = getPendingAssignments(localHistory);
    
    if (pendingAssignments.length > 0) {
      showAssignmentReminder(pendingAssignments);
    }
    
    // If user has history, skip demo and show main input
    document.querySelector('.demo-section').style.display = 'none';
    mainInputSection.style.display = 'block';
    mainInputSection.classList.add('show');
  }
  
  // Update credits display on page load
  updateCreditsDisplay();
}

// Credit management functions
function getExtraCredits() {
  const credits = localStorage.getItem('rp-extra-credits');
  const expiry = localStorage.getItem('rp-extra-credits-expiry');
  
  if (!credits || !expiry) return 0;
  
  // Check if credits have expired
  if (Date.now() > parseInt(expiry)) {
    localStorage.removeItem('rp-extra-credits');
    localStorage.removeItem('rp-extra-credits-expiry');
    return 0;
  }
  
  return parseInt(credits) || 0;
}

function useExtraCredit() {
  let credits = getExtraCredits();
  if (credits > 0) {
    credits--;
    localStorage.setItem('rp-extra-credits', credits.toString());
    console.log('Extra credit used. Remaining: ' + credits);
    return true;
  }
  return false;
}

function getDailyUsage() {
  const today = new Date().toDateString();
  const stored = localStorage.getItem('rp-daily-usage');
  
  if (!stored) return 0;
  
  try {
    const usage = JSON.parse(stored);
    if (usage.date === today) {
      return usage.count || 0;
    }
  } catch (e) {
    console.log('Error parsing daily usage:', e);
  }
  
  return 0;
}

function incrementDailyUsage() {
  const today = new Date().toDateString();
  const currentUsage = getDailyUsage();
  
  const newUsage = {
    date: today,
    count: currentUsage + 1
  };
  
  localStorage.setItem('rp-daily-usage', JSON.stringify(newUsage));
  console.log('Daily usage incremented to:', newUsage.count);
}

// FIXED: This function now properly checks if user can make a request
function canMakeRequest() {
  const dailyUsage = getDailyUsage();
  const extraCredits = getExtraCredits();
  
  console.log('Credit check:', { dailyUsage, extraCredits });
  
  // Can make request if:
  // 1. Haven't hit daily limit (under 10 daily uses), OR
  // 2. Have extra credits available
  return dailyUsage < 10 || extraCredits > 0;
}

function updateCreditsDisplay() {
  const extraCredits = getExtraCredits();
  
  // Add credits counter to UI
  let creditsDisplay = document.getElementById('credits-display');
  if (!creditsDisplay && extraCredits > 0) {
    creditsDisplay = document.createElement('div');
    creditsDisplay.id = 'credits-display';
    creditsDisplay.className = 'credits-display';
    creditsDisplay.innerHTML = 
      '<div class="credits-header">&gt; EXTRA_CREDITS.AVAILABLE</div>' +
      '<div class="credits-count">' + extraCredits + ' patches remaining</div>';
    
    // Insert after the header
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', creditsDisplay);
  } else if (creditsDisplay && extraCredits > 0) {
    creditsDisplay.querySelector('.credits-count').textContent = extraCredits + ' patches remaining';
  } else if (creditsDisplay && extraCredits === 0) {
    creditsDisplay.remove();
  }
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

// Helper function to get pending assignments from local history (incomplete only)
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
      return { ...item, hoursSince };
    })
    .filter(item => item.hoursSince >= 12); // Only show assignments that are 12+ hours old
}

function saveHistoryToLocal(historyData) {
  localStorage.setItem('rp-history', JSON.stringify(historyData));
}

function loadHistoryFromLocal() {
  const stored = localStorage.getItem('rp-history');
  return stored ? JSON.parse(stored) : [];
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
    const oldestHours = Math.max(...pendingAssignments.map(a => a.hoursSince));
    reminderContent = 'You have ' + pendingAssignments.length + ' overdue assignments. The oldest is ' + oldestHours + ' hours old. Time to report back!';
  }
  
  const reminderHtml = '<div id="assignment-reminder" class="assignment-reminder">' +
    '<div class="reminder-header">' + reminderHeader + '</div>' +
    '<div class="reminder-content">' + reminderContent + '</div>' +
    '</div>';
  
  document.querySelector('.header').insertAdjacentHTML('afterend', reminderHtml);
}

function showHistorySection(history) {
  const historyCount = document.getElementById('historyCount');
  historyCount.textContent = history.length;
  
  const historyContent = document.getElementById('history-content');
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
  
  historySection.style.display = 'block';
  
  // Check user's saved preference, default to visible for new users
  const savedState = localStorage.getItem('rp-history-visible');
  const shouldShow = savedState === null ? true : savedState === 'true';
  
  const toggle = document.getElementById('history-toggle');
  if (shouldShow) {
    historyContent.style.display = 'block';
    toggle.textContent = '> Hide';
  } else {
    historyContent.style.display = 'none';
    toggle.textContent = '> Show';
  }
}

window.toggleHistory = function() {
  const content = document.getElementById('history-content');
  const toggle = document.getElementById('history-toggle');
  
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

// Enhanced function to mark assignment as completed in local storage
function markAssignmentCompletedLocally(completedAssignmentId) {
  if (!completedAssignmentId || completedAssignmentId === 'unclear' || completedAssignmentId === 'mass_unclear') {
    console.log('No valid assignment ID to complete:', completedAssignmentId);
    return;
  }
  
  console.log('Looking for assignment to complete:', completedAssignmentId);
  
  const currentHistory = loadHistoryFromLocal();
  console.log('Current history count:', currentHistory.length);
  
  // Find assignment by multiple methods since server uses different ID system
  let assignment = null;
  
  // Method 1: Direct ID match
  assignment = currentHistory.find(item => item.id === completedAssignmentId);
  if (assignment) {
    console.log('Found by direct ID match');
  }
  
  // Method 2: Timestamp match (server sometimes uses timestamp as ID)
  if (!assignment) {
    assignment = currentHistory.find(item => 
      item.timestamp && new Date(item.timestamp).getTime() === completedAssignmentId
    );
    if (assignment) {
      console.log('Found by timestamp match');
    }
  }
  
  // Method 3: Find assignments and use smart matching
  if (!assignment) {
    // Get pending assignments from local history
    const pendingAssignments = currentHistory.filter(item => 
      item.response && 
      item.response.includes('Your assignment:') && 
      !item.isFollowUp && 
      !item.completed
    );
    
    console.log('Found pending assignments:', pendingAssignments.length);
    pendingAssignments.forEach((item, idx) => {
      console.log('Assignment ' + (idx + 1) + '. ID: ' + item.id + ', Timestamp: ' + item.timestamp + ', Input: "' + item.input.substring(0, 40) + '..."');
    });
    
    if (pendingAssignments.length === 1) {
      // Only one pending assignment, that must be it
      assignment = pendingAssignments[0];
      console.log('Using single pending assignment');
    } else if (pendingAssignments.length > 1) {
      // Multiple pending - try to find the one most likely to be completed
      // Sort by timestamp (oldest first, most likely to be completed first)
      const sortedPending = pendingAssignments.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      assignment = sortedPending[0];
      console.log('Using oldest pending assignment as best guess');
    }
  }
  
  if (assignment) {
    console.log('Marking assignment as completed:', {
      id: assignment.id,
      input: assignment.input.substring(0, 50) + '...',
      timestamp: assignment.timestamp,
      wasCompleted: assignment.completed
    });
    
    assignment.completed = true;
    assignment.completedAt = new Date().toISOString();
    saveHistoryToLocal(currentHistory);

    // Refresh the history display to show updated badges
    showHistorySection(currentHistory);
    
    console.log('Assignment marked as completed locally');
    
    // Remove assignment reminder if it exists
    const reminder = document.getElementById('assignment-reminder');
    if (reminder) {
      reminder.remove();
      console.log('Removed assignment reminder');
    }
    
  } else {
    console.log('Could not find assignment to complete with ID:', completedAssignmentId);
    console.log('Available history items:');
    currentHistory.forEach((item, idx) => {
      console.log('Item ' + (idx + 1) + '. ID: ' + item.id + ', Timestamp: ' + new Date(item.timestamp).getTime() + ', Input: "' + (item.input ? item.input.substring(0, 30) : 'N/A') + '..."', {
        hasAssignment: item.response ? item.response.includes('Your assignment:') : false,
        isFollowUp: item.isFollowUp,
        completed: item.completed
      });
    });
  }
}

// Example buttons functionality (only when main input is visible)
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      textarea.value = btn.dataset.example;
      textarea.focus();
      
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

// FIXED: Enhanced button click with proper credit system integration
if (button) {
  button.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) {
      textarea.focus();
      return;
    }
    
    // FIXED: Check if user can make a request BEFORE processing
    if (!canMakeRequest()) {
      // Show upgrade message instead of processing
      showUpgradeMessage();
      return;
    }
    
    const dailyUsage = getDailyUsage();
    const usingExtraCredit = dailyUsage >= 10;
    
    // Track reality patch request
    if (window.va) {
      window.va('track', 'RealityPatchRequest', { 
        inputLength: text.length,
        usingExtraCredit: usingExtraCredit,
        fromDemo: document.querySelector('.demo-section').style.display === 'none'
      });
    }
    
    button.disabled = true;
    button.textContent = 'PROCESSING...';
    
    // Show output section and loading state
    output.classList.add('show');
    resultContent.innerHTML = '<div class="loading">&gt; Analyzing psychological patterns<span class="loading-dots"></span></div>';

    // Remove assignment reminder if it exists
    const reminder = document.getElementById('assignment-reminder');
    if (reminder) reminder.remove();

    try {
      const res = await fetch('/api/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId || ''
        },
        body: JSON.stringify({ 
          userInput: text,
          usingExtraCredit: usingExtraCredit
        })
      });

      const data = await res.json();
      console.log('Server response:', data);
      
      // Handle error responses before processing success
      if (!res.ok || data.patch.includes('Server error') || data.patch.includes('AI service temporarily unavailable')) {
        throw new Error(data.patch || 'Server error occurred');
      }
      
      // Handle limit reached response from server
      if (data.limitReached) {
        showUpgradeMessage();
        return;
      }
      
      // FIXED: Handle credit usage and daily count tracking
      if (usingExtraCredit) {
        // Using extra credit
        useExtraCredit();
        updateCreditsDisplay();
        console.log('Used extra credit');
      } else {
        // Using regular daily allowance
        incrementDailyUsage();
        console.log('Used daily allowance');
      }
      
      // Store session ID
      if (data.sessionId) {
        sessionId = data.sessionId;
        localStorage.setItem('rp-session-id', sessionId);
      }
      
      // CRITICAL: Mark assignment as completed BEFORE saving new interaction
      if (data.completedAssignmentId) {
        console.log('Server detected completed assignment:', data.completedAssignmentId);
        markAssignmentCompletedLocally(data.completedAssignmentId);
      }
      
      // Typewriter effect for results
      let i = 0;
      const response = data.patch;
      resultContent.innerHTML = '';
      
      const typewriter = setInterval(() => {
        if (i < response.length) {
          resultContent.innerHTML += response.charAt(i);
          i++;
        } else {
          clearInterval(typewriter);
          
          // Add success message after typewriter completes ONLY if no error occurred
          if (!data.patch.includes('Server error') && !data.patch.includes('AI service temporarily unavailable')) {
            setTimeout(() => {
              const statusHtml = data.isFollowUp 
                ? '<div class="status-message follow-up">Progress tracking activated. Keep coming back - accountability is what separates the doers from the dreamers.</div>'
                : '<div class="status-message">Assignment given. Come back in 24 hours and report what you actually did.</div>';
              
              resultContent.innerHTML += statusHtml;
            }, 1000);
          }
        }
      }, 20);
      
      // Track successful patch delivery - only if no error
      if (window.va && !data.patch.includes('Server error')) {
        window.va('track', 'RealityPatchDelivered', { 
          isFollowUp: data.isFollowUp,
          historyCount: data.historyCount,
          completedAssignmentId: data.completedAssignmentId
        });
      }
      
      // Save to local storage - only if successful
      if (!data.patch.includes('Server error') && !data.patch.includes('AI service temporarily unavailable')) {
        const currentHistory = loadHistoryFromLocal();
        const newItem = {
          input: text,
          response: data.patch,
          timestamp: new Date().toISOString(),
          id: Date.now(),
          isFollowUp: data.isFollowUp,
          completed: false, // New assignments start as incomplete
          completedAssignmentId: data.completedAssignmentId
        };
        
        currentHistory.push(newItem);

        // Keep only last 10
        if (currentHistory.length > 10) {
          currentHistory.shift();
        }

        saveHistoryToLocal(currentHistory);
        showHistorySection(currentHistory);

        // Clear textarea after successful submission
        textarea.value = '';
        textarea.style.height = '120px';
      }
      
    } catch (err) {
      console.error('Request failed:', err);
      resultContent.innerHTML = '<div class="error">&gt; ERROR: ' + err.message + '</div>';
      
      // Track errors
      if (window.va) {
        window.va('track', 'RealityPatchError', { error: err.message });
      }
    } finally {
      button.disabled = false;
      button.textContent = 'ANALYZE PATTERN';
    }
  });

  // Enter to submit (Ctrl+Enter or Cmd+Enter)
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!button.disabled) {
        button.click();
      }
    }
  });
}

// Track page views
if (window.va) {
  window.va('track', 'PageView');
}
`;