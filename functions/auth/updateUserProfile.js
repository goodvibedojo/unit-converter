/**
 * Cloud Function: updateUserProfile
 *
 * Type: HTTP Callable
 * Purpose: Update user profile information
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validateRequired, validateEmail } = require('../utils/validators');

exports.updateUserProfile = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to update profile'
      );
    }

    const userId = context.auth.uid;
    const { displayName, photoURL, preferences } = data;

    // Build update object
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Display name must be a non-empty string'
        );
      }
      updateData.displayName = displayName.trim();
    }

    if (photoURL !== undefined) {
      if (photoURL !== null && typeof photoURL !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Photo URL must be a string or null'
        );
      }
      updateData.photoURL = photoURL;
    }

    if (preferences !== undefined) {
      if (typeof preferences !== 'object') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Preferences must be an object'
        );
      }

      // Validate and update preferences
      const validPreferences = {};

      if (preferences.theme) {
        if (!['light', 'dark'].includes(preferences.theme)) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Theme must be "light" or "dark"'
          );
        }
        validPreferences['preferences.theme'] = preferences.theme;
      }

      if (preferences.defaultLanguage) {
        const validLanguages = ['python', 'javascript', 'java'];
        if (!validLanguages.includes(preferences.defaultLanguage)) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            `Default language must be one of: ${validLanguages.join(', ')}`
          );
        }
        validPreferences['preferences.defaultLanguage'] = preferences.defaultLanguage;
      }

      if (preferences.voiceEnabled !== undefined) {
        if (typeof preferences.voiceEnabled !== 'boolean') {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'voiceEnabled must be a boolean'
          );
        }
        validPreferences['preferences.voiceEnabled'] = preferences.voiceEnabled;
      }

      Object.assign(updateData, validPreferences);
    }

    // Update Firestore
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);

    await userRef.update(updateData);

    // Get updated profile
    const updatedDoc = await userRef.get();
    const updatedProfile = updatedDoc.data();

    console.log('User profile updated:', userId);

    return {
      success: true,
      profile: updatedProfile,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to update user profile');
  }
});
