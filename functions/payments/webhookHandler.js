/**
 * Cloud Function: webhookHandler
 *
 * Type: HTTP
 * Purpose: Handle Stripe webhook events for subscription management
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { logger } = require('../utils/monitoring');

// Lazy load Stripe to reduce cold start time
let stripe = null;

function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe');
    const apiKey = functions.config().stripe?.secretkey || process.env.STRIPE_SECRET_KEY;

    if (!apiKey) {
      throw new Error('Stripe secret key not configured');
    }

    stripe = Stripe(apiKey);
    logger.info('Stripe client initialized');
  }

  return stripe;
}

/**
 * Stripe webhook handler
 *
 * Handles subscription lifecycle events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - customer.subscription.trial_will_end
 */
exports.webhookHandler = functions.https.onRequest(async (req, res) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const stripe = getStripe();
    const webhookSecret = functions.config().stripe?.webhooksecret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook configuration error' });
    }

    // Verify Stripe signature
    const signature = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      logger.error('Webhook signature verification failed', {
        error: err.message,
      });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info('Received Stripe webhook', {
      type: event.type,
      id: event.id,
    });

    // Handle the event
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.trial_will_end':
          await handleTrialWillEnd(event.data.object);
          break;

        default:
          logger.info('Unhandled event type', { type: event.type });
      }

      // Return success response
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Error processing webhook event', {
        type: event.type,
        error: error.message,
      });

      // Return 500 so Stripe will retry
      res.status(500).json({ error: 'Event processing failed' });
    }
  } catch (error) {
    logger.error('Webhook handler error', {
      error: error.message,
    });

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription) {
  const db = admin.firestore();

  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  logger.info('Processing subscription.created', {
    subscriptionId,
    customerId,
    status,
  });

  // Find user by Stripe customer ID
  const usersSnapshot = await db
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    logger.error('User not found for customer', { customerId });
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // Create subscription record
  const subscriptionData = {
    userId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    status,
    plan: subscription.items.data[0]?.price?.id || null,
    currentPeriodStart: admin.firestore.Timestamp.fromDate(
      new Date(subscription.current_period_start * 1000)
    ),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('subscriptions').doc(subscriptionId).set(subscriptionData);

  // Update user subscription status
  await userDoc.ref.update({
    subscriptionStatus: status === 'active' || status === 'trialing' ? 'active' : 'trial',
    stripeSubscriptionId: subscriptionId,
    subscriptionPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info('Subscription created', {
    userId,
    subscriptionId,
    status,
  });
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription) {
  const db = admin.firestore();

  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  logger.info('Processing subscription.updated', {
    subscriptionId,
    status,
  });

  // Update subscription record
  const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
  const subscriptionDoc = await subscriptionRef.get();

  if (!subscriptionDoc.exists) {
    logger.warn('Subscription not found', { subscriptionId });
    // Create it if it doesn't exist
    return handleSubscriptionCreated(subscription);
  }

  const updateData = {
    status,
    currentPeriodStart: admin.firestore.Timestamp.fromDate(
      new Date(subscription.current_period_start * 1000)
    ),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await subscriptionRef.update(updateData);

  // Update user subscription status
  const userId = subscriptionDoc.data().userId;

  await db.collection('users').doc(userId).update({
    subscriptionStatus: status === 'active' || status === 'trialing' ? 'active' : status,
    subscriptionPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info('Subscription updated', {
    userId,
    subscriptionId,
    status,
  });
}

/**
 * Handle subscription deleted (canceled) event
 */
async function handleSubscriptionDeleted(subscription) {
  const db = admin.firestore();

  const subscriptionId = subscription.id;

  logger.info('Processing subscription.deleted', {
    subscriptionId,
  });

  // Update subscription record
  const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
  const subscriptionDoc = await subscriptionRef.get();

  if (!subscriptionDoc.exists) {
    logger.warn('Subscription not found for deletion', { subscriptionId });
    return;
  }

  await subscriptionRef.update({
    status: 'canceled',
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update user subscription status
  const userId = subscriptionDoc.data().userId;

  await db.collection('users').doc(userId).update({
    subscriptionStatus: 'canceled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info('Subscription deleted', {
    userId,
    subscriptionId,
  });
}

/**
 * Handle payment succeeded event
 */
async function handlePaymentSucceeded(invoice) {
  const db = admin.firestore();

  const subscriptionId = invoice.subscription;
  const amountPaid = invoice.amount_paid / 100; // Convert cents to dollars
  const invoiceId = invoice.id;

  logger.info('Processing payment.succeeded', {
    subscriptionId,
    amountPaid,
    invoiceId,
  });

  if (!subscriptionId) {
    // Not a subscription payment, could be one-time payment
    return;
  }

  // Update subscription last payment
  const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
  const subscriptionDoc = await subscriptionRef.get();

  if (!subscriptionDoc.exists) {
    logger.warn('Subscription not found for payment', { subscriptionId });
    return;
  }

  await subscriptionRef.update({
    lastPaymentAmount: amountPaid,
    lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
    lastInvoiceId: invoiceId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info('Payment recorded', {
    subscriptionId,
    amountPaid,
  });
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(invoice) {
  const db = admin.firestore();

  const subscriptionId = invoice.subscription;
  const invoiceId = invoice.id;
  const attemptCount = invoice.attempt_count;

  logger.warn('Processing payment.failed', {
    subscriptionId,
    invoiceId,
    attemptCount,
  });

  if (!subscriptionId) {
    return;
  }

  // Update subscription with payment failure
  const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
  const subscriptionDoc = await subscriptionRef.get();

  if (!subscriptionDoc.exists) {
    logger.warn('Subscription not found for failed payment', { subscriptionId });
    return;
  }

  await subscriptionRef.update({
    lastPaymentFailed: true,
    lastPaymentAttempt: admin.firestore.FieldValue.serverTimestamp(),
    paymentAttemptCount: attemptCount,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // If this is the final attempt, update user status
  if (attemptCount >= 4) {
    const userId = subscriptionDoc.data().userId;

    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'past_due',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.warn('Subscription marked as past_due', {
      userId,
      subscriptionId,
    });
  }

  logger.info('Payment failure recorded', {
    subscriptionId,
    attemptCount,
  });
}

/**
 * Handle trial ending soon event
 */
async function handleTrialWillEnd(subscription) {
  const db = admin.firestore();

  const subscriptionId = subscription.id;
  const trialEnd = new Date(subscription.trial_end * 1000);

  logger.info('Processing trial_will_end', {
    subscriptionId,
    trialEnd,
  });

  // Find subscription
  const subscriptionDoc = await db.collection('subscriptions').doc(subscriptionId).get();

  if (!subscriptionDoc.exists) {
    logger.warn('Subscription not found for trial ending', { subscriptionId });
    return;
  }

  const userId = subscriptionDoc.data().userId;

  // TODO: Send email notification to user about trial ending
  // This could be implemented with SendGrid, Firebase Extensions, etc.

  logger.info('Trial ending notification triggered', {
    userId,
    subscriptionId,
    daysUntilEnd: Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)),
  });
}
