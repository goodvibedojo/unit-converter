// Firebase Cloud Functions - Main Entry Point
// Engineer 5 - Backend Functions for Payments & Analytics

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Export payment functions
exports.createCheckoutSession = require('./payments/createCheckoutSession');
exports.createPortalSession = require('./payments/createPortalSession');
exports.handleStripeWebhook = require('./payments/handleStripeWebhook');

// Export analytics functions
exports.updateUserStats = require('./analytics/updateUserStats');
exports.onSessionComplete = require('./analytics/onSessionComplete');

// Export problem functions
exports.getRandomProblem = require('./problems/getRandomProblem');
exports.getProblemsByFilter = require('./problems/getProblemsByFilter');

// Export auth trigger
exports.onUserCreate = require('./auth/onUserCreate');

console.log('✅ Cloud Functions loaded successfully');
