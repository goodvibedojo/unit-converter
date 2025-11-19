/**
 * Cloud Function: onUserCreate
 *
 * Trigger: Auth user creation
 * Purpose: Initialize user profile in Firestore when a new user signs up
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    console.log('New user created:', user.uid);

    const db = admin.firestore();

    // Create user profile document
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified || false,

      // Subscription settings
      subscriptionStatus: 'trial',
      trialSessionsUsed: 0,
      trialSessionsTotal: 3,

      // User stats
      stats: {
        totalSessions: 0,
        problemsSolved: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        lastSessionDate: null,
      },

      // User preferences
      preferences: {
        theme: 'light',
        defaultLanguage: 'python',
        voiceEnabled: false,
      },

      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Write to Firestore
    await db.collection('users').doc(user.uid).set(userProfile);

    console.log('User profile created successfully:', user.uid);

    return {
      success: true,
      userId: user.uid,
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create user profile');
  }
});
