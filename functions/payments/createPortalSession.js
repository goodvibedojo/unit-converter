// Create Stripe Customer Portal Session
// Engineer 5 - Payment Function

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

/**
 * Create a Stripe Customer Portal Session
 * Allows users to manage their subscription
 */
module.exports = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { returnUrl } = data;

  try {
    // Get user's Stripe customer ID
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No subscription found for this user'
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl || `${functions.config().app.url}/dashboard`
    });

    console.log(`Portal session created for user ${userId}`);

    return {
      url: session.url
    };
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create portal session',
      error.message
    );
  }
});
