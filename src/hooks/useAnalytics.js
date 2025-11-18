// useAnalytics Hook
// Engineer 5 - Custom React Hook for Analytics Integration

import { useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as analytics from '../services/analytics';

/**
 * Custom hook for easy analytics tracking
 * Automatically tracks user and provides tracking functions
 */
export const useAnalytics = () => {
  const { currentUser } = useAuth();

  // Set user properties when user changes
  useEffect(() => {
    if (currentUser) {
      analytics.setAnalyticsUser(currentUser.uid, {
        subscriptionStatus: currentUser.subscriptionStatus,
        trialSessionsUsed: currentUser.trialSessionsUsed,
        totalSessions: currentUser.stats?.totalSessions,
        createdAt: currentUser.createdAt
      });
    }
  }, [currentUser]);

  // Interview tracking
  const trackInterviewStart = useCallback((params) => {
    analytics.trackInterviewStart(params);
  }, []);

  const trackInterviewEnd = useCallback((params) => {
    analytics.trackInterviewEnd(params);
  }, []);

  const trackCodeExecution = useCallback((params) => {
    analytics.trackCodeExecution(params);
  }, []);

  const trackTestRun = useCallback((params) => {
    analytics.trackTestRun(params);
  }, []);

  // AI interaction tracking
  const trackAIMessage = useCallback((params) => {
    analytics.trackAIMessage(params);
  }, []);

  const trackHintRequested = useCallback((params) => {
    analytics.trackHintRequested(params);
  }, []);

  // Subscription tracking
  const trackSubscriptionStarted = useCallback((params) => {
    analytics.trackSubscriptionStarted(params);
  }, []);

  const trackSubscriptionCanceled = useCallback((params) => {
    analytics.trackSubscriptionCanceled(params);
  }, []);

  const trackCheckoutInitiated = useCallback((params) => {
    analytics.trackCheckoutInitiated(params);
  }, []);

  // Problem tracking
  const trackProblemViewed = useCallback((params) => {
    analytics.trackProblemViewed(params);
  }, []);

  const trackProblemSolved = useCallback((params) => {
    analytics.trackProblemSolved(params);
  }, []);

  // Page tracking
  const trackPageView = useCallback((pageName, pageTitle) => {
    analytics.trackPageView(pageName, pageTitle);
  }, []);

  // Error tracking
  const trackError = useCallback((params) => {
    analytics.trackError(params);
  }, []);

  return {
    // Interview events
    trackInterviewStart,
    trackInterviewEnd,
    trackCodeExecution,
    trackTestRun,

    // AI events
    trackAIMessage,
    trackHintRequested,

    // Subscription events
    trackSubscriptionStarted,
    trackSubscriptionCanceled,
    trackCheckoutInitiated,

    // Problem events
    trackProblemViewed,
    trackProblemSolved,

    // General events
    trackPageView,
    trackError
  };
};

export default useAnalytics;
