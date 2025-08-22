// src/templates/clientScript.js - Client-side JavaScript
export const getClientScript = () => `
const button = document.getElementById('patchBtn');
const textarea = document.getElementById('userInput');
const output = document.getElementById('output');
const resultContent = document.getElementById('resultContent');
const historySection = document.getElementById('historySection');

// Session management
let sessionId = localStorage.getItem('rp-session-id');

// Load history on page load
window.addEventListener('load', loadHistory);

async function loadHistory() {
  const localHistory = loadHistoryFromLocal();
  
  if (localHistory && localHistory.length > 0) {
    showHistorySection(localHistory);
    
    // Check if user has pending assignment
    const lastPatch = localHistory[localHistory.length - 1];
    if (lastPatch && lastPatch.response.includes('Your assignment:') && !lastPatch.isFollowUp) {
      const timeSince = Date.now() - new Date(lastPatch.timestamp).getTime();
      const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));
      
      if (hoursSince >= 12) {
        showAssignmentReminder(hoursSince);
      }
    }
  }
}

function saveHistoryToLocal(historyData) {
  localStorage.setItem('rp-history', JSON.stringify(historyData));
}

function loadHistoryFromLocal() {
  const stored = localStorage.getItem('rp-history');
  return stored ? JSON.parse(stored) : [];
}

function showAssignmentReminder(hoursSince) {
  const reminderHtml = '<div id="assignment-reminder" class="assignment-reminder">' +
    '<div class="reminder-header">&gt; ASSIGNMENT_STATUS: OVERDUE</div>' +
    '<div class="reminder-content">It\\'s been ' + hoursSince + ' hours. Did you do your assignment or do you have an excuse?</div>' +
    '</div>';
  
  document.querySelector('.header').insertAdjacentHTML('afterend', reminderHtml);
}

function showHistorySection(history) {
  const historyCount = document.getElementById('historyCount');
  historyCount.textContent = history.length;
  
  const historyContent = document.getElementById('history-content');
  historyContent.innerHTML = history.slice(-3).reverse().map(function(item, index) {
    const followUpBadge = item.isFollowUp ? '<span class="follow-up-badge">FOLLOW-UP</span>' : '';
    return '<div class="history-item">' +
      '<div class="history-input">"' + item.input + '"' + followUpBadge + '</div>' +
      '<div class="history-response">' + item.response + '</div>' +
      '<div class="history-timestamp">' + new Date(item.timestamp).toLocaleDateString() + '</div>' +
      '</div>';
  }).join('');
  
  historySection.style.display = 'block';
  
  // Set initial state - history is shown by default when there's content
  historyContent.style.display = 'block';
  const toggle = document.getElementById('history-toggle');
  toggle.textContent = '> Hide';
}

window.toggleHistory = function() {
  const content = document.getElementById('history-content');
  const toggle = document.getElementById('history-toggle');
  
  // Check actual computed display style, not just the style property
  const isCurrentlyVisible = window.getComputedStyle(content).display !== 'none';
  
  if (isCurrentlyVisible) {
    content.style.display = 'none';
    toggle.textContent = '> Show';
  } else {
    content.style.display = 'block';
    toggle.textContent = '> Hide';
  }
}

// Example buttons functionality
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

// Auto-resize textarea
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 250);
  textarea.style.height = newHeight + 'px';
});

// Button click with session management
button.addEventListener('click', async () => {
  const text = textarea.value.trim();
  if (!text) {
    textarea.focus();
    return;
  }
  
  // Track reality patch request
  if (window.va) {
    window.va('track', 'RealityPatchRequest', { inputLength: text.length });
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
      body: JSON.stringify({ userInput: text })
    });

    const data = await res.json();
    
    // Store session ID
    if (data.sessionId) {
      sessionId = data.sessionId;
      localStorage.setItem('rp-session-id', sessionId);
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
        
        // Add success message after typewriter completes
        setTimeout(() => {
          const statusHtml = data.isFollowUp 
            ? '<div class="status-message follow-up">Progress tracking activated. Keep coming back - accountability is what separates the doers from the dreamers.</div>'
            : '<div class="status-message">Assignment given. Come back in 24 hours and report what you actually did.</div>';
          
          resultContent.innerHTML += statusHtml;
        }, 1000);
      }
    }, 20);
    
    // Track successful patch delivery
    if (window.va) {
      window.va('track', 'RealityPatchDelivered', { 
        isFollowUp: data.isFollowUp,
        historyCount: data.historyCount 
      });
    }
    
    // Save to local storage
    const currentHistory = loadHistoryFromLocal();
    currentHistory.push({
      input: text,
      response: data.patch,
      timestamp: new Date().toISOString(),
      id: Date.now(),
      isFollowUp: data.isFollowUp
    });

    // Keep only last 10
    if (currentHistory.length > 10) {
      currentHistory.shift();
    }

    saveHistoryToLocal(currentHistory);
    showHistorySection(currentHistory);

    // Clear textarea after successful submission
    textarea.value = '';
    textarea.style.height = '120px';
    
  } catch (err) {
    console.error(err);
    resultContent.innerHTML = '<div class="error">&gt; ERROR: Connection failed. Please try again.</div>';
    
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

// Track page views
if (window.va) {
  window.va('track', 'PageView');
}`;