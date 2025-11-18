// Firebase Analytics Service
// Engineer 5 - Analytics & Tracking Implementation

import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { app } from './firebase';

// Initialize Firebase Analytics
let analytics = null;

try {
  analytics = getAnalytics(app);
  console.log('Firebase Analytics initialized');
} catch (error) {
  console.warn('Firebase Analytics not available:', error);
}

// ==========================================
// User Events
// ==========================================

/**
 * Track user signup
 * @param {string} method - 'email' or 'google'
 */
export const trackSignup = (method) => {
  if (!analytics) return;

  logEvent(analytics, 'sign_up', {
    method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track user login
 * @param {string} method - 'email' or 'google'
 */
export const trackLogin = (method) => {
  if (!analytics) return;

  logEvent(analytics, 'login', {
    method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Set user properties for analytics
 * @param {string} userId
 * @param {object} properties
 */
export const setAnalyticsUser = (userId, properties = {}) => {
  if (!analytics) return;

  setUserId(analytics, userId);
  setUserProperties(analytics, {
    subscription_status: properties.subscriptionStatus || 'trial',
    trial_sessions_used: properties.trialSessionsUsed || 0,
    total_sessions: properties.totalSessions || 0,
    account_created: properties.createdAt || new Date().toISOString()
  });
};

// ==========================================
// Interview Session Events
// ==========================================

/**
 * Track interview session start
 * @param {object} params
 */
export const trackInterviewStart = ({ sessionId, problemId, difficulty, category }) => {
  if (!analytics) return;

  logEvent(analytics, 'interview_started', {
    session_id: sessionId,
    problem_id: problemId,
    difficulty,
    category,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track interview session end
 * @param {object} params
 */
export const trackInterviewEnd = ({
  sessionId,
  problemId,
  duration,
  completed,
  testsPassed,
  testsTotal,
  score
}) => {
  if (!analytics) return;

  logEvent(analytics, 'interview_completed', {
    session_id: sessionId,
    problem_id: problemId,
    duration_minutes: Math.round(duration / 60),
    completed,
    tests_passed: testsPassed,
    tests_total: testsTotal,
    success_rate: testsTotal > 0 ? (testsPassed / testsTotal) * 100 : 0,
    score,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track code execution
 * @param {object} params
 */
export const trackCodeExecution = ({ sessionId, language, success, executionTime }) => {
  if (!analytics) return;

  logEvent(analytics, 'code_executed', {
    session_id: sessionId,
    language,
    success,
    execution_time_ms: executionTime,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track test run
 * @param {object} params
 */
export const trackTestRun = ({ sessionId, passed, total }) => {
  if (!analytics) return;

  logEvent(analytics, 'tests_run', {
    session_id: sessionId,
    passed,
    total,
    success_rate: total > 0 ? (passed / total) * 100 : 0,
    timestamp: new Date().toISOString()
  });
};

// ==========================================
// AI Interaction Events
// ==========================================

/**
 * Track AI message sent
 * @param {object} params
 */
export const trackAIMessage = ({ sessionId, messageType, codePresent }) => {
  if (!analytics) return;

  logEvent(analytics, 'ai_message_sent', {
    session_id: sessionId,
    message_type: messageType, // 'question', 'hint_request', 'general'
    code_present: codePresent,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track hint requested
 * @param {object} params
 */
export const trackHintRequested = ({ sessionId, problemId }) => {
  if (!analytics) return;

  logEvent(analytics, 'hint_requested', {
    session_id: sessionId,
    problem_id: problemId,
    timestamp: new Date().toISOString()
  });
};

// ==========================================
// Subscription Events
// ==========================================

/**
 * Track trial started
 */
export const trackTrialStarted = () => {
  if (!analytics) return;

  logEvent(analytics, 'trial_started', {
    timestamp: new Date().toISOString()
  });
};

/**
 * Track subscription started
 * @param {object} params
 */
export const trackSubscriptionStarted = ({ plan, amount, currency = 'USD' }) => {
  if (!analytics) return;

  logEvent(analytics, 'subscription_started', {
    plan, // 'monthly' or 'annual'
    amount,
    currency,
    timestamp: new Date().toISOString()
  });

  // Also track as purchase event for revenue tracking
  logEvent(analytics, 'purchase', {
    transaction_id: `sub_${Date.now()}`,
    value: amount,
    currency,
    items: [{
      item_id: `plan_${plan}`,
      item_name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
      price: amount
    }]
  });
};

/**
 * Track subscription renewed
 * @param {object} params
 */
export const trackSubscriptionRenewed = ({ plan, amount }) => {
  if (!analytics) return;

  logEvent(analytics, 'subscription_renewed', {
    plan,
    amount,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track subscription canceled
 * @param {object} params
 */
export const trackSubscriptionCanceled = ({ plan, reason }) => {
  if (!analytics) return;

  logEvent(analytics, 'subscription_canceled', {
    plan,
    reason: reason || 'user_initiated',
    timestamp: new Date().toISOString()
  });
};

/**
 * Track trial converted to paid
 * @param {object} params
 */
export const trackTrialConverted = ({ plan, daysInTrial }) => {
  if (!analytics) return;

  logEvent(analytics, 'trial_converted', {
    plan,
    days_in_trial: daysInTrial,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track payment succeeded
 * @param {object} params
 */
export const trackPaymentSucceeded = ({ amount, plan }) => {
  if (!analytics) return;

  logEvent(analytics, 'payment_succeeded', {
    amount,
    plan,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track payment failed
 * @param {object} params
 */
export const trackPaymentFailed = ({ amount, error }) => {
  if (!analytics) return;

  logEvent(analytics, 'payment_failed', {
    amount,
    error_message: error,
    timestamp: new Date().toISOString()
  });
};

// ==========================================
// Page View Events
// ==========================================

/**
 * Track page view
 * @param {string} pageName
 * @param {string} pageTitle
 */
export const trackPageView = (pageName, pageTitle) => {
  if (!analytics) return;

  logEvent(analytics, 'page_view', {
    page_name: pageName,
    page_title: pageTitle,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track pricing page view
 */
export const trackPricingPageView = () => {
  if (!analytics) return;

  logEvent(analytics, 'view_item_list', {
    item_list_name: 'Subscription Plans',
    timestamp: new Date().toISOString()
  });
};

/**
 * Track checkout initiated
 * @param {object} params
 */
export const trackCheckoutInitiated = ({ plan, amount }) => {
  if (!analytics) return;

  logEvent(analytics, 'begin_checkout', {
    plan,
    value: amount,
    currency: 'USD',
    items: [{
      item_id: `plan_${plan}`,
      item_name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
      price: amount
    }]
  });
};

// ==========================================
// Problem Events
// ==========================================

/**
 * Track problem viewed
 * @param {object} params
 */
export const trackProblemViewed = ({ problemId, title, difficulty, category }) => {
  if (!analytics) return;

  logEvent(analytics, 'problem_viewed', {
    problem_id: problemId,
    title,
    difficulty,
    category,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track problem solved
 * @param {object} params
 */
export const trackProblemSolved = ({ problemId, difficulty, attempts, timeSpent }) => {
  if (!analytics) return;

  logEvent(analytics, 'problem_solved', {
    problem_id: problemId,
    difficulty,
    attempts,
    time_spent_minutes: Math.round(timeSpent / 60),
    timestamp: new Date().toISOString()
  });
};

// ==========================================
// Error Tracking
// ==========================================

/**
 * Track application error
 * @param {object} params
 */
export const trackError = ({ errorType, errorMessage, component }) => {
  if (!analytics) return;

  logEvent(analytics, 'app_error', {
    error_type: errorType,
    error_message: errorMessage,
    component,
    timestamp: new Date().toISOString()
  });
};

// ==========================================
// Export analytics instance
// ==========================================

export { analytics };
