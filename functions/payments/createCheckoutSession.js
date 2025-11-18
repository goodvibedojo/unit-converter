// Create Stripe Checkout Session
// Engineer 5 - Payment Function

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

/**
 * Create a Stripe Checkout Session for subscription
 * Callable function from frontend
 */
module.exports = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to create checkout session'
    );
  }

  const userId = context.auth.uid;
  const { priceId, successUrl, cancelUrl } = data;

  // Validate input
  if (!priceId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Price ID is required'
    );
  }

  try {
    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    let customerId = userData?.stripeCustomerId;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await admin.firestore().collection('users').doc(userId).update({
        stripeCustomerId: customerId
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl || `${functions.config().app.url}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${functions.config().app.url}/pricing`,
      metadata: {
        firebaseUID: userId
      },
      subscription_data: {
        metadata: {
          firebaseUID: userId
        }
      }
    });

    // Log checkout initiation
    console.log(`Checkout session created: ${session.id} for user ${userId}`);

    return {
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create checkout session',
      error.message
    );
  }
});
