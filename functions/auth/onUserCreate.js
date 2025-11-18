// On User Create Trigger
// Engineer 5 - Auth Function

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Initialize user profile when a new user signs up
 */
module.exports = functions.auth.user().onCreate(async (user) => {
  const userId = user.uid;
  const email = user.email;
  const displayName = user.displayName || email?.split('@')[0] || 'User';

  console.log(`New user created: ${userId}`);

  try {
    // Create user profile in Firestore
    await admin.firestore().collection('users').doc(userId).set({
      uid: userId,
      email: email,
      displayName: displayName,
      photoURL: user.photoURL || null,

      // Subscription info
      subscriptionStatus: 'trial',
      subscriptionPlan: null,
      trialSessionsUsed: 0,
      trialSessionsTotal: 3,
      trialStartDate: admin.firestore.FieldValue.serverTimestamp(),

      // Stripe info
      stripeCustomerId: null,
      stripeSubscriptionId: null,

      // Stats
      stats: {
        totalSessions: 0,
        completedSessions: 0,
        problemsSolved: 0,
        averageScore: 0,
        averageSessionDuration: 0,
        successRate: 0,
        totalCodingTime: 0,
        streakDays: 0,
        lastActiveDate: admin.firestore.FieldValue.serverTimestamp(),
        problemsByDifficulty: {
          easy: { attempted: 0, solved: 0 },
          medium: { attempted: 0, solved: 0 },
          hard: { attempted: 0, solved: 0 }
        },
        categoriesStats: {}
      },

      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Created Firestore profile for user ${userId}`);

    // Send welcome email (optional)
    // await sendWelcomeEmail(email, displayName);

  } catch (error) {
    console.error('Error creating user profile:', error);
    // Don't throw error - user is already created in Auth
  }
});
