/**
 * Cloud Function: onUserDelete
 *
 * Trigger: Auth user deletion
 * Purpose: Clean up user data from Firestore when user deletes their account
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    console.log('User deleted:', user.uid);

    const db = admin.firestore();
    const batch = db.batch();

    // Delete user profile
    const userRef = db.collection('users').doc(user.uid);
    batch.delete(userRef);

    // Delete all user sessions
    const sessionsSnapshot = await db
      .collection('sessions')
      .where('userId', '==', user.uid)
      .get();

    sessionsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete subscription data
    const subscriptionsSnapshot = await db
      .collection('subscriptions')
      .where('userId', '==', user.uid)
      .get();

    subscriptionsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit batch deletion
    await batch.commit();

    console.log('User data cleaned up successfully:', user.uid);

    return {
      success: true,
      userId: user.uid,
      deletedCollections: ['users', 'sessions', 'subscriptions'],
    };
  } catch (error) {
    console.error('Error cleaning up user data:', error);
    // Don't throw error - user is already deleted from Auth
    return {
      success: false,
      error: error.message,
    };
  }
});
