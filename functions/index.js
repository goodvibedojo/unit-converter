/**
 * Firebase Cloud Functions for AI Mock Interview Platform
 *
 * This file exports all Cloud Functions organized by domain:
 * - auth: User authentication and profile management
 * - interviews: Interview session management
 * - problems: Problem bank management
 * - payments: Stripe subscription management
 * - realtime: Real-time listeners and presence management
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all functions
// Auth functions
exports.onUserCreate = require('./auth/onUserCreate');
exports.onUserDelete = require('./auth/onUserDelete');
exports.updateUserProfile = require('./auth/updateUserProfile');

// Interview functions
exports.startSession = require('./interviews/startSession');
exports.saveProgress = require('./interviews/saveProgress');
exports.endSession = require('./interviews/endSession');
exports.getSessionHistory = require('./interviews/getSessionHistory');
exports.chatWithAI = require('./interviews/chatWithAI');
exports.executeCode = require('./interviews/executeCode');

// Problem functions
exports.getRandomProblem = require('./problems/getRandomProblem');
exports.getProblemsByCategory = require('./problems/getProblemsByCategory');
exports.seedProblems = require('./problems/seedProblems');

// Payment functions
exports.createCheckoutSession = require('./payments/createCheckoutSession');
exports.webhookHandler = require('./payments/webhookHandler');
exports.cancelSubscription = require('./payments/cancelSubscription');

// Real-time functions
exports.subscribeToSession = require('./realtime/subscribeToSession').subscribeToSession;
exports.updatePresence = require('./realtime/updatePresence').updatePresence;
exports.getOnlineUsers = require('./realtime/updatePresence').getOnlineUsers;
