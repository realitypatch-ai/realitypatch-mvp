// src/handlers/patchHandler.js - Handle patch requests with assignment completion tracking
import { AIService } from '../services/aiService.js';
import { DatabaseService } from '../services/databaseService.js';
import { DATABASE_CONFIG } from '../config.js';

export const handlePatchRequest = async (req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });

  req.on('end', async () => {
    try {
      const { userInput } = JSON.parse(body);

      // Get or create user ID
      let userId = req.headers['x-session-id'];
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Check usage limits using config value
      const usageCheck = await DatabaseService.checkUsageLimit(userId, DATABASE_CONFIG.dailyRequestLimit);
      
      if (!usageCheck.allowed) {
        res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ 
          patch: `Daily limit reached (${usageCheck.limit} requests). You've used ${usageCheck.count} requests today. Try again tomorrow or upgrade for unlimited access.`,
          limitReached: true,
          usage: usageCheck
        }));
        return;
      }

      // Get user data and check for follow-ups
      const userData = await DatabaseService.getUserData(userId);
      const lastInteraction = userData.history[userData.history.length - 1];
      
      // Improved follow-up detection
      const isFollowUp = checkIsFollowUp(userInput, lastInteraction);
      
      // Check for assignment completion indicators
      let completedAssignmentId = null;
      if (isFollowUp) {
        completedAssignmentId = checkAssignmentCompletion(userInput, userData);
        console.log('🔍 Assignment completion debug:', {
          completedAssignmentId,
          pendingAssignments: getPendingAssignments(userData).map(a => ({
            id: a.id,
            input: a.input.substring(0, 30) + '...',
            timestamp: a.timestamp
          }))
        });
      }
            
      // Build contextual input with enhanced multiple assignment support
      const contextualInput = buildContextualInput(userInput, lastInteraction, isFollowUp, userData);

      // Debug log
      console.log('🔍 Follow-up detection:', {
        isFollowUp,
        userInput: userInput.substring(0, 50) + '...',
        hasLastInteraction: !!lastInteraction,
        timeSinceLastInteraction: lastInteraction ? 
          Math.round((Date.now() - new Date(lastInteraction.timestamp).getTime()) / (1000 * 60)) + ' minutes' : 
          'N/A',
        pendingAssignments: isFollowUp ? getPendingAssignments(userData).length : 0,
        completedAssignmentId: completedAssignmentId
      });

      // Generate AI response
      const patch = await AIService.generatePatch(contextualInput);

      // Mark assignment as completed if detected
      if (completedAssignmentId && completedAssignmentId !== 'unclear' && completedAssignmentId !== 'mass_unclear') {
        await DatabaseService.markAssignmentCompleted(userId, completedAssignmentId);
        console.log('✅ Marked assignment as completed:', completedAssignmentId);
      }

      // Save interaction to database
      const updatedUserData = await DatabaseService.addInteraction(userId, {
        input: userInput,
        response: patch,
        isFollowUp: isFollowUp,
        completedAssignmentId: completedAssignmentId
      });

      res.writeHead(200, { 
        'Content-Type': 'application/json; charset=utf-8',
        'X-Session-ID': userId 
      });
      res.end(JSON.stringify({ 
        patch, 
        sessionId: userId, 
        historyCount: updatedUserData.history.length,
        isFollowUp,
        completedAssignmentId,
        usage: {
          count: updatedUserData.usage.count,
          remaining: Math.max(0, DATABASE_CONFIG.dailyRequestLimit - updatedUserData.usage.count)
        }
      }));

    } catch (error) {
      console.error('Patch handler error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ 
        patch: error.message.includes('OpenRouter') 
          ? 'AI service temporarily unavailable. Please try again.' 
          : 'Server error. Please try again.' 
      }));
    }
  });
};

// Helper function to get pending assignments (incomplete only)
function getPendingAssignments(userData) {
  return userData.history
    .filter(interaction => 
      interaction.response && 
      interaction.response.toLowerCase().includes('your assignment:') &&
      !interaction.isFollowUp && // Only get original assignments, not follow-ups
      !interaction.completed // Only get incomplete assignments
    )
    .slice(-5); // Only consider last 5 assignments to avoid overwhelming context
}

// Improved follow-up detection (UTC-aware) - RESTORED FUNCTION
function checkIsFollowUp(userInput, lastInteraction) {
  if (!lastInteraction) {
    console.log('❌ No last interaction found');
    return false;
  }

  const userInputLower = userInput.toLowerCase();
  console.log('🔍 Checking follow-up for input:', userInputLower);
  
  // Strong follow-up indicators - these work immediately
  const strongFollowUpKeywords = [
    'did what you asked',
    'did the assignment', 
    'completed the',
    'finished the',
    'did it',
    'didn\'t do',
    'couldn\'t do',
    'excuse',
    'sorry i didn\'t',
    'reporting back',
    'here\'s what happened',
    'like you asked',
    'as you asked'
  ];
  
  // Weaker indicators that need more context
  const followUpKeywords = [
    'did', 'didn\'t', 'done', 'completed', 'finished', 
    'assignment', 'task', 'back', 'reporting',
    'here\'s what', 'so i', 'okay i', 'well i',
    'update:', 'result:'
  ];
  
  // Check for strong indicators first (immediate follow-up)
  const hasStrongFollowUp = strongFollowUpKeywords.some(phrase => 
    userInputLower.includes(phrase)
  );
  
  // Check for weaker indicators
  const hasFollowUpKeywords = followUpKeywords.some(keyword => 
    userInputLower.includes(keyword)
  );
  
  // Time-based check - 12 hours using UTC
  const timeSinceLastInteraction = Date.now() - new Date(lastInteraction.timestamp).getTime();
  const hoursSinceLastInteraction = timeSinceLastInteraction / (1000 * 60 * 60);
  const isTimeBasedFollowUp = hoursSinceLastInteraction > 12;
  
  // Check if last interaction had an assignment
  const lastResponseHadAssignment = lastInteraction.response && 
    lastInteraction.response.toLowerCase().includes('your assignment:');
  
  // Logic: 
  // 1. Strong keywords = immediate follow-up (regardless of time/assignment)
  // 2. Weak keywords + had assignment = follow-up (good for same-day reporting)
  // 3. Time-based + had assignment = follow-up (good for next-day reporting)
  const result = hasStrongFollowUp || 
    (hasFollowUpKeywords && lastResponseHadAssignment) || 
    (isTimeBasedFollowUp && lastResponseHadAssignment);
  
  console.log('🔍 Follow-up analysis:', {
    hasStrongFollowUp,
    hasFollowUpKeywords,
    lastResponseHadAssignment,
    hoursSinceLastInteraction: Math.round(hoursSinceLastInteraction * 100) / 100,
    isTimeBasedFollowUp,
    finalResult: result,
    detectionMethod: hasStrongFollowUp ? 'STRONG_KEYWORDS' : 
                    (hasFollowUpKeywords && lastResponseHadAssignment) ? 'WEAK_KEYWORDS' :
                    (isTimeBasedFollowUp && lastResponseHadAssignment) ? 'TIME_BASED' : 'NONE'
  });
  
  return result;
}

// Enhanced assignment completion logic
function checkAssignmentCompletion(userInput, userData) {
  const userInputLower = userInput.toLowerCase();
  
  // Strong completion indicators
  const strongCompletionKeywords = [
    'did what you asked',
    'like you asked',        // FIXED: Added this critical phrase
    'as you asked',          // FIXED: Added this variation
    'did the assignment',
    'completed the',
    'finished the',
    'did it',
    'here\'s what happened',
    'here\'s the result',
    'reporting back',
    'i wrote down',          // FIXED: Common completion phrase
    'i scheduled',           // FIXED: Common completion phrase
    'i outlined'             // FIXED: Common completion phrase
  ];

  // Mass completion indicators (claims to have done multiple/all)
  const massCompletionKeywords = [
    'finished all',
    'completed all',
    'did all',
    'done all',
    'finished both',
    'completed both',
    'did both'
  ];

  const hasStrongCompletion = strongCompletionKeywords.some(phrase => 
    userInputLower.includes(phrase)
  );
  
  const hasMassCompletion = massCompletionKeywords.some(phrase => 
    userInputLower.includes(phrase)
  );

  if (!hasStrongCompletion && !hasMassCompletion) {
    return null; // No clear completion indicator
  }

  const pendingAssignments = getPendingAssignments(userData);
  
  if (pendingAssignments.length === 0) {
    return null; // No pending assignments to complete
  }
  
  // Handle mass completion claims
  if (hasMassCompletion) {
    // User claims to have done multiple assignments
    if (pendingAssignments.length === 1) {
      // Only one pending, so they must mean that one
      return pendingAssignments[0].id;
    } else {
      // Multiple pending assignments - mark as unclear but flag for special handling
      return 'mass_unclear';
    }
  }
  
  if (pendingAssignments.length === 1) {
    // Only one pending assignment, assume they completed it
    return pendingAssignments[0].id;
  }
  
  // Multiple pending assignments - try to match based on content
  // Look for keywords that might indicate which assignment
  const assignmentKeywords = [
    { keywords: ['wrote down', 'writing', 'list', 'traits', 'behaviors', 'business ideas', 'three ideas', 'ideas'], type: 'writing' },
    { keywords: ['worked on', 'spent time', 'dedicated', 'project', 'outline', 'scheduled', 'planned'], type: 'project' },
    { keywords: ['reflected', 'thought about', 'considered', 'realized'], type: 'reflection' },
    { keywords: ['practiced', 'tried', 'attempted', 'exercise'], type: 'practice' }
  ];
  
  for (const category of assignmentKeywords) {
    const hasKeyword = category.keywords.some(keyword => 
      userInputLower.includes(keyword)
    );
    
    if (hasKeyword) {
      // Try to match to assignment content
      for (const assignment of pendingAssignments) {
        const assignmentText = assignment.response.toLowerCase();
        const hasMatchInAssignment = category.keywords.some(keyword => 
          assignmentText.includes(keyword) || 
          assignmentText.includes(keyword.replace(/ed$/, '')) || 
          assignmentText.includes(keyword.replace(/ing$/, ''))
        );
        
        if (hasMatchInAssignment) {
          return assignment.id;
        }
      }
    }
  }
  
  // If we can't determine which assignment, return 'unclear'
  return 'unclear';
}

// Enhanced UI feedback for unclear completions
function getUICompletionStatus(completedAssignmentId, pendingCount) {
  if (!completedAssignmentId) return 'none';
  
  if (completedAssignmentId === 'mass_unclear') {
    return 'mass_unclear'; // User claims multiple completions but unclear which ones
  }
  
  if (completedAssignmentId === 'unclear') {
    return 'single_unclear'; // User claims completion but unclear which assignment
  }
  
  return 'completed'; // Clear completion detected
}

// Modified contextual input builder with better mass completion handling
function buildContextualInput(userInput, lastInteraction, isFollowUp, userData) {
  if (!isFollowUp || !lastInteraction) {
    return userInput;
  }

  const pendingAssignments = getPendingAssignments(userData);
  const completedAssignments = userData.history
    .filter(interaction => 
      interaction.response && 
      interaction.response.toLowerCase().includes('your assignment:') &&
      !interaction.isFollowUp &&
      interaction.completed
    )
    .slice(-3);

  if (pendingAssignments.length === 0) {
    if (completedAssignments.length > 0) {
      const completedList = completedAssignments
        .map(item => `"${item.input}" (COMPLETED)`)
        .join(', ');
      
      return `FOLLOW-UP: User's recent completed assignments: ${completedList}
           
           User now says: "${userInput}"
           
           They seem to be reporting on something. Acknowledge their progress and give the next assignment.`;
    } else {
      return `FOLLOW-UP: User's previous situation was: "${lastInteraction.input}" and my last response was: "${lastInteraction.response}". 
           
           User now says: "${userInput}"
           
           Respond appropriately to their follow-up.`;
    }
  } else if (pendingAssignments.length === 1) {
    const assignment = pendingAssignments[0];
    const completedContext = completedAssignments.length > 0 ? 
      ` Previously completed: ${completedAssignments.map(item => `"${item.input}"`).join(', ')}.` : '';
    
    return `FOLLOW-UP: User's pending assignment was: "${assignment.input}" → Assignment: ${assignment.response}.${completedContext}
         
         User now says: "${userInput}"
         
         Determine if they completed the assignment or are making excuses. If completed, acknowledge and give next assignment. If excuses, call them out.`;
  } else {
    // Multiple pending assignments - enhanced handling
    const userInputLower = userInput.toLowerCase();
    const claimsMassCompletion = ['finished all', 'completed all', 'did all', 'done all', 'finished both', 'completed both'].some(phrase => 
      userInputLower.includes(phrase)
    );
    
    const assignmentList = pendingAssignments
      .map((item, index) => {
        const daysSince = Math.floor((Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60 * 24));
        const assignmentMatch = item.response.match(/Your assignment: (.+?)(?=Come back in|$)/s);
        const assignment = assignmentMatch ? assignmentMatch[1].trim() : 'Assignment not found';
        const timeAgo = daysSince === 0 ? 'today' : daysSince === 1 ? '1 day ago' : `${daysSince} days ago`;
        return `${index + 1}. "${item.input}" → Assignment: ${assignment} (${timeAgo})`;
      })
      .join('\n');

    const completedContext = completedAssignments.length > 0 ? 
      `\nRecently completed: ${completedAssignments.map(item => `"${item.input}"`).join(', ')}.` : '';

    if (claimsMassCompletion) {
      return `FOLLOW-UP: User claims to have completed ALL assignments, but has ${pendingAssignments.length} pending:
${assignmentList}${completedContext}

User now says: "${userInput}"

IMPORTANT: User is being vague about completing "all" tasks. This is avoidance behavior. Call them out for being non-specific and demand they clarify WHICH assignments they actually completed with specific details. Don't let them hide behind generalities.`;
    } else {
      return `FOLLOW-UP: User has ${pendingAssignments.length} pending assignments:
${assignmentList}${completedContext}

User now says: "${userInput}"

Determine which assignment they're referring to. If they completed one, acknowledge and give next assignment. If unclear which one, ask for clarification. Call out excuses directly.`;
    }
  }
}