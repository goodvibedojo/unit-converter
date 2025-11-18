// Handle Stripe Webhooks
// Engineer 5 - Payment Function

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

/**
 * Handle Stripe webhook events
 * Updates user subscription status in Firestore
 */
module.exports = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

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

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// ==========================================
// Webhook Event Handlers
// ==========================================

async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata.firebaseUID;

  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  console.log(`Subscription created: ${subscription.id} for user ${userId}`);

  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: 'active',
    subscriptionPlan: subscription.items.data[0].price.recurring.interval,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata.firebaseUID;

  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  console.log(`Subscription updated: ${subscription.id} for user ${userId}`);

  const status = subscription.status === 'active' ? 'active' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'canceled' ? 'canceled' : 'inactive';

  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: status,
    subscriptionPlan: subscription.items.data[0].price.recurring.interval,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.firebaseUID;

  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  console.log(`Subscription deleted: ${subscription.id} for user ${userId}`);

  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: 'canceled',
    cancelAtPeriodEnd: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  console.log(`Payment succeeded for invoice ${invoice.id}`);

  // Get subscription to find user
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.firebaseUID;

    if (userId) {
      await admin.firestore().collection('users').doc(userId).update({
        lastPaymentDate: admin.firestore.Timestamp.fromMillis(invoice.created * 1000),
        lastPaymentAmount: invoice.amount_paid / 100,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Store payment record
      await admin.firestore().collection('payments').add({
        userId,
        invoiceId: invoice.id,
        subscriptionId,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'succeeded',
        createdAt: admin.firestore.Timestamp.fromMillis(invoice.created * 1000)
      });
    }
  }
}

async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;

  console.error(`Payment failed for invoice ${invoice.id}`);

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.firebaseUID;

    if (userId) {
      await admin.firestore().collection('users').doc(userId).update({
        subscriptionStatus: 'past_due',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Store payment failure record
      await admin.firestore().collection('payments').add({
        userId,
        invoiceId: invoice.id,
        subscriptionId,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: 'failed',
        errorMessage: invoice.last_payment_error?.message || 'Payment failed',
        createdAt: admin.firestore.Timestamp.fromMillis(invoice.created * 1000)
      });
    }
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.firebaseUID;

  if (!userId) {
    console.error('No Firebase UID in checkout session metadata');
    return;
  }

  console.log(`Checkout completed: ${session.id} for user ${userId}`);

  // Mark trial as converted
  await admin.firestore().collection('users').doc(userId).update({
    trialConverted: true,
    trialConvertedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
