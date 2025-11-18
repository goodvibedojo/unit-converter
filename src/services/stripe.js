// Stripe Service
// Engineer 5 - Stripe Payment Integration

import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
let stripePromise = null;

/**
 * Get Stripe instance
 * @returns {Promise<Stripe>}
 */
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('Stripe publishable key not found in environment variables');
      return null;
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 20,
    currency: 'USD',
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
    features: [
      'Unlimited interview sessions',
      '100+ coding problems',
      'AI-powered interviewer',
      'Session history & analytics',
      'Multiple programming languages',
      'Priority support'
    ],
    popular: false
  },
  annual: {
    id: 'annual',
    name: 'Annual Plan',
    price: 200,
    currency: 'USD',
    interval: 'year',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL,
    features: [
      'Unlimited interview sessions',
      '100+ coding problems',
      'AI-powered interviewer',
      'Session history & analytics',
      'Multiple programming languages',
      'Priority support',
      'Voice interview mode (coming soon)',
      'Save $40 per year'
    ],
    popular: true,
    savings: 40
  }
};

/**
 * Create Stripe checkout session
 * This should call a Firebase Cloud Function that creates the checkout session
 * @param {string} priceId - Stripe price ID
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @returns {Promise<{sessionId: string}>}
 */
export const createCheckoutSession = async (priceId, userId, userEmail) => {
  try {
    // TODO: This should call Firebase Cloud Function
    // For now, this is a placeholder
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/pricing`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout
 * @param {string} planId - Plan ID ('monthly' or 'annual')
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 */
export const redirectToCheckout = async (planId, userId, userEmail) => {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    // Create checkout session via Firebase Function
    const { sessionId } = await createCheckoutSession(
      plan.stripePriceId,
      userId,
      userEmail
    );

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};

/**
 * Create customer portal session
 * Allows users to manage their subscription
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<{url: string}>}
 */
export const createPortalSession = async (customerId) => {
  try {
    // TODO: Call Firebase Cloud Function
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/dashboard`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};

/**
 * Format price for display
 * @param {number} amount - Amount in dollars
 * @param {string} currency - Currency code
 * @returns {string} Formatted price
 */
export const formatPrice = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculate monthly equivalent for annual plan
 * @param {number} annualPrice
 * @returns {number} Monthly equivalent
 */
export const calculateMonthlyEquivalent = (annualPrice) => {
  return Math.round((annualPrice / 12) * 100) / 100;
};

/**
 * Get plan by ID
 * @param {string} planId
 * @returns {Object} Plan details
 */
export const getPlan = (planId) => {
  return SUBSCRIPTION_PLANS[planId] || null;
};

/**
 * Get all plans
 * @returns {Array} All subscription plans
 */
export const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS);
};

export default {
  getStripe,
  redirectToCheckout,
  createPortalSession,
  SUBSCRIPTION_PLANS,
  formatPrice,
  calculateMonthlyEquivalent,
  getPlan,
  getAllPlans
};
