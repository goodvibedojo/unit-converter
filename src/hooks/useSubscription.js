// useSubscription Hook
// Engineer 5 - Subscription Management Hook

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { redirectToCheckout, createPortalSession } from '../services/stripe';
import * as analytics from '../services/analytics';

/**
 * Custom hook for subscription management
 * Handles trial tracking, subscription status, and payment flows
 */
export const useSubscription = () => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load subscription data
  useEffect(() => {
    if (!currentUser) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Real-time subscription listener
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setSubscription({
            status: userData.subscriptionStatus || 'trial',
            plan: userData.subscriptionPlan || null,
            trialSessionsUsed: userData.trialSessionsUsed || 0,
            trialSessionsTotal: userData.trialSessionsTotal || 3,
            stripeCustomerId: userData.stripeCustomerId || null,
            stripeSubscriptionId: userData.stripeSubscriptionId || null,
            currentPeriodEnd: userData.currentPeriodEnd || null,
            cancelAtPeriodEnd: userData.cancelAtPeriodEnd || false
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching subscription:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Check if user can start interview
  const canStartInterview = useCallback(() => {
    if (!subscription) return false;

    // Active subscribers can always start
    if (subscription.status === 'active') {
      return true;
    }

    // Trial users have limited sessions
    if (subscription.status === 'trial') {
      return subscription.trialSessionsUsed < subscription.trialSessionsTotal;
    }

    return false;
  }, [subscription]);

  // Get remaining trial sessions
  const getRemainingTrialSessions = useCallback(() => {
    if (!subscription || subscription.status !== 'trial') {
      return 0;
    }

    return Math.max(
      0,
      subscription.trialSessionsTotal - subscription.trialSessionsUsed
    );
  }, [subscription]);

  // Increment trial sessions used
  const incrementTrialSession = useCallback(async () => {
    if (!currentUser || !subscription || subscription.status !== 'trial') {
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        trialSessionsUsed: (subscription.trialSessionsUsed || 0) + 1
      });
    } catch (err) {
      console.error('Error incrementing trial session:', err);
      throw err;
    }
  }, [currentUser, subscription]);

  // Check if trial is expired
  const isTrialExpired = useCallback(() => {
    if (!subscription || subscription.status !== 'trial') {
      return false;
    }

    return subscription.trialSessionsUsed >= subscription.trialSessionsTotal;
  }, [subscription]);

  // Start checkout flow
  const startCheckout = useCallback(async (planId) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      // Track checkout initiation
      const plan = planId === 'monthly' ? { plan: 'monthly', amount: 20 } : { plan: 'annual', amount: 200 };
      analytics.trackCheckoutInitiated(plan);

      // Redirect to Stripe Checkout
      await redirectToCheckout(planId, currentUser.uid, currentUser.email);
    } catch (err) {
      console.error('Error starting checkout:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Manage subscription (customer portal)
  const manageSubscription = useCallback(async () => {
    if (!subscription?.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    try {
      setLoading(true);
      setError(null);

      const { url } = await createPortalSession(subscription.stripeCustomerId);
      window.location.href = url;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  // Check if subscription is active
  const isActive = useCallback(() => {
    return subscription?.status === 'active';
  }, [subscription]);

  // Check if on trial
  const isOnTrial = useCallback(() => {
    return subscription?.status === 'trial';
  }, [subscription]);

  // Get subscription status display text
  const getStatusText = useCallback(() => {
    if (!subscription) return 'Loading...';

    switch (subscription.status) {
      case 'active':
        return `Active - ${subscription.plan || 'Unknown'} plan`;
      case 'trial':
        return `Trial - ${getRemainingTrialSessions()} sessions remaining`;
      case 'canceled':
        return 'Canceled';
      case 'past_due':
        return 'Payment Past Due';
      default:
        return 'Inactive';
    }
  }, [subscription, getRemainingTrialSessions]);

  // Get days until renewal
  const getDaysUntilRenewal = useCallback(() => {
    if (!subscription?.currentPeriodEnd) return null;

    const now = new Date();
    const endDate = subscription.currentPeriodEnd.toDate
      ? subscription.currentPeriodEnd.toDate()
      : new Date(subscription.currentPeriodEnd);

    const diff = endDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [subscription]);

  return {
    subscription,
    loading,
    error,

    // Status checks
    canStartInterview,
    isActive,
    isOnTrial,
    isTrialExpired,

    // Trial management
    getRemainingTrialSessions,
    incrementTrialSession,

    // Actions
    startCheckout,
    manageSubscription,

    // Utilities
    getStatusText,
    getDaysUntilRenewal
  };
};

export default useSubscription;
