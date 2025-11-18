# API Reference - AI Mock Interview Platform

Complete API documentation for Firebase Cloud Functions, Firestore data models, and analytics events.

## Table of Contents

1. [Firebase Cloud Functions](#firebase-cloud-functions)
2. [Firestore Data Models](#firestore-data-models)
3. [Analytics Events](#analytics-events)
4. [Client-Side Services](#client-side-services)
5. [Error Codes](#error-codes)

---

## Firebase Cloud Functions

### Payment Functions

#### createCheckoutSession

Creates a Stripe checkout session for subscription purchase.

**Type**: Callable HTTPS Function

**Authentication**: Required

**Request:**
```javascript
{
  priceId: string,      // Stripe Price ID (monthly or annual)
  successUrl?: string,  // Optional custom success URL
  cancelUrl?: string    // Optional custom cancel URL
}
```

**Response:**
```javascript
{
  sessionId: string,    // Stripe Session ID
  url: string          // Checkout URL to redirect user to
}
```

**Example:**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createCheckout = httpsCallable(functions, 'createCheckoutSession');

const result = await createCheckout({
  priceId: 'price_1MXXXXmonthly'
});

window.location.href = result.data.url;
```

**Errors:**
- `unauthenticated`: User not logged in
- `invalid-argument`: Missing or invalid priceId
- `internal`: Stripe API error

---

#### createPortalSession

Creates a Stripe Customer Portal session for subscription management.

**Type**: Callable HTTPS Function

**Authentication**: Required

**Request:**
```javascript
{
  returnUrl?: string    // Optional return URL after portal
}
```

**Response:**
```javascript
{
  url: string          // Customer Portal URL
}
```

**Example:**
```javascript
const createPortal = httpsCallable(functions, 'createPortalSession');

const result = await createPortal({
  returnUrl: window.location.origin + '/subscription'
});

window.location.href = result.data.url;
```

---

#### handleStripeWebhook

Processes Stripe webhook events.

**Type**: HTTPS Function (webhook endpoint)

**Authentication**: Stripe signature verification

**Handled Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

**Configuration:**
Set webhook URL in Stripe Dashboard:
```
https://[region]-[project-id].cloudfunctions.net/handleStripeWebhook
```

---

### Authentication Functions

#### onUserCreate

Triggered when a new user signs up.

**Type**: Auth Trigger

**Actions:**
- Creates user profile in Firestore
- Initializes trial subscription
- Sets default stats
- Logs user creation event

**Created Document:**
```javascript
users/{userId} {
  uid: string,
  email: string,
  displayName: string,
  subscriptionStatus: 'trial',
  trialSessionsUsed: 0,
  trialSessionsTotal: 3,
  stats: { /* default stats */ },
  createdAt: Timestamp
}
```

---

### Analytics Functions

#### updateUserStats

Updates user statistics when a session is completed.

**Type**: Firestore Trigger

**Trigger**: `sessions/{sessionId}` onCreate, onUpdate

**Actions:**
- Aggregates session data
- Updates user stats document
- Calculates averages and success rates
- Updates problem-by-difficulty stats

---

#### onSessionComplete

Calculates session metrics when a session ends.

**Type**: Firestore Trigger

**Trigger**: `sessions/{sessionId}` onUpdate (when completed=true)

**Actions:**
- Calculates comprehensive metrics
- Updates session document with metrics
- Updates problem statistics

**Calculated Metrics:**
- Duration, time to first code, time to first test
- Code changes count, lines of code
- Test results and pass rate
- Code quality score
- Problem solving score
- Communication score
- Overall score

---

### Problem Functions

#### getRandomProblem

Returns a random coding problem, optionally filtered by difficulty/category.

**Type**: Callable HTTPS Function

**Authentication**: Required

**Request:**
```javascript
{
  difficulty?: 'easy' | 'medium' | 'hard',
  category?: string
}
```

**Response:**
```javascript
{
  id: string,
  title: string,
  difficulty: string,
  category: string[],
  description: string,
  examples: Example[],
  constraints: string[],
  starterCode: {
    python: string,
    javascript: string
  },
  hints: Hint[],
  // testCases omitted for security
}
```

**Example:**
```javascript
const getRandomProblem = httpsCallable(functions, 'getRandomProblem');

const result = await getRandomProblem({
  difficulty: 'medium',
  category: 'arrays'
});

console.log(result.data); // Problem object
```

---

#### getProblemsByFilter

Returns multiple problems matching filter criteria.

**Type**: Callable HTTPS Function

**Authentication**: Required

**Request:**
```javascript
{
  difficulty?: string,
  category?: string,
  companyTag?: string,
  limit?: number,        // Default: 10, Max: 50
  offset?: number        // For pagination
}
```

**Response:**
```javascript
{
  problems: Problem[],
  total: number,
  hasMore: boolean
}
```

---

## Firestore Data Models

### Users Collection

**Path**: `users/{userId}`

**Structure:**
```javascript
{
  // Identity
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,

  // Subscription
  subscriptionStatus: 'trial' | 'active' | 'inactive' | 'canceled' | 'past_due',
  subscriptionPlan: 'monthly' | 'annual' | null,
  trialSessionsUsed: number,
  trialSessionsTotal: number,
  trialStartDate: Timestamp,

  // Stripe
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,

  // Statistics
  stats: {
    totalSessions: number,
    completedSessions: number,
    problemsSolved: number,
    averageScore: number,
    successRate: number,
    totalCodingTime: number,
    streakDays: number,
    lastActiveDate: Timestamp,

    problemsByDifficulty: {
      easy: { attempted: number, solved: number },
      medium: { attempted: number, solved: number },
      hard: { attempted: number, solved: number }
    },

    categoriesStats: {
      [category: string]: {
        attempted: number,
        solved: number,
        avgScore: number
      }
    }
  },

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### Sessions Collection

**Path**: `sessions/{sessionId}`

**Structure:**
```javascript
{
  // Identity
  id: string,
  userId: string,
  problemId: string,
  problemTitle?: string,
  difficulty?: string,

  // Session Data
  startTime: Timestamp,
  endTime: Timestamp | null,
  completed: boolean,
  duration?: number,           // seconds

  // Code
  code: string,
  finalCode?: string,
  language: 'python' | 'javascript',
  codeChangeCount?: number,
  codeHistory?: Array<{
    timestamp: Timestamp,
    code: string
  }>,

  // Testing
  testResults: {
    passed: number,
    total: number,
    score: number,
    results: Array<{
      id: string,
      passed: boolean,
      error?: string
    }>
  } | null,
  testRunCount?: number,

  // AI Interaction
  chatHistory: Array<{
    role: 'user' | 'assistant',
    content: string,
    timestamp: Timestamp
  }>,

  // Performance Metrics
  metrics?: {
    // Time
    duration: number,
    timeToFirstCode: number,
    timeToFirstTest: number,

    // Code
    totalCodeChanges: number,
    linesOfCode: number,
    testRunCount: number,

    // Tests
    testsPassed: number,
    testsTotal: number,
    testPassRate: number,

    // AI Interaction
    messageCount: number,
    hintsRequested: number,

    // Scores
    codeQualityScore: number,
    problemSolvingScore: number,
    communicationScore: number,
    overallScore: number
  },

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### Problems Collection

**Path**: `problems/{problemId}`

**Structure:**
```javascript
{
  // Identity
  id: string,
  title: string,
  slug: string,
  difficulty: 'easy' | 'medium' | 'hard',

  // Categorization
  category: string[],           // ['arrays', 'hash-table']
  tags: string[],               // ['two-pointers', 'sorting']
  companyTags: string[],        // ['google', 'facebook']

  // Problem Content
  description: string,
  constraints: string[],
  examples: Array<{
    input: string,
    output: string,
    explanation?: string
  }>,

  // Code
  starterCode: {
    python: string,
    javascript: string,
    java?: string
  },

  // Tests (Hidden from clients)
  testCases: Array<{
    id: string,
    input: string,
    expectedOutput: string,
    isHidden: boolean,
    explanation?: string
  }>,

  // Hints
  hints: Array<{
    order: number,
    text: string
  }>,

  // Solutions (Admin only)
  solutions?: Array<{
    approach: string,
    timeComplexity: string,
    spaceComplexity: string,
    code: {
      python: string,
      javascript: string
    }
  }>,

  // Statistics
  stats: {
    totalAttempts: number,
    totalSolved: number,
    averageTime: number,
    successRate: number
  },

  // Metadata
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Analytics Events

### User Events

**user_signup**
```javascript
{
  method: string,           // 'email', 'google', etc.
  timestamp: string
}
```

**user_login**
```javascript
{
  method: string
}
```

---

### Interview Events

**interview_started**
```javascript
{
  session_id: string,
  problem_id: string,
  difficulty: string,
  category: string,
  timestamp: string
}
```

**interview_ended**
```javascript
{
  session_id: string,
  duration: number,
  tests_passed_percent: number,
  problem_solved: boolean,
  code_changes: number,
  test_runs: number,
  messages_exchanged: number
}
```

**code_executed**
```javascript
{
  session_id: string,
  language: string,
  lines_of_code: number
}
```

**test_run**
```javascript
{
  session_id: string,
  passed: number,
  total: number,
  language: string,
  score: number
}
```

---

### AI Interaction Events

**ai_message_sent**
```javascript
{
  session_id: string,
  type: 'message' | 'hint_request',
  message_count: number
}
```

**hint_requested**
```javascript
{
  session_id: string,
  hint_number: number
}
```

---

### Subscription Events

**trial_started**
```javascript
{
  user_id: string
}
```

**subscription_started**
```javascript
{
  plan: string,
  amount: number
}
```

**subscription_canceled**
```javascript
{
  plan: string,
  reason?: string
}
```

**payment_succeeded**
```javascript
{
  amount: number,
  plan: string
}
```

**payment_failed**
```javascript
{
  error: string,
  plan: string
}
```

---

### Page Events

**page_view**
```javascript
{
  page_title: string,
  page_location: string,
  page_path: string
}
```

---

## Client-Side Services

### Analytics Service

**File**: `src/services/analytics.js`

**Methods:**

```javascript
// Track user events
trackSignup(method: string): void
trackLogin(method: string): void

// Track interview events
trackInterviewStart(data: {
  sessionId: string,
  problemId: string,
  difficulty: string,
  category: string
}): void

trackInterviewEnd(data: {
  sessionId: string,
  duration: number,
  testsPassedPercent: number,
  problemSolved: boolean
}): void

trackCodeExecution(data: {
  sessionId: string,
  language: string,
  linesOfCode: number
}): void

trackTestRun(data: {
  sessionId: string,
  passed: number,
  total: number,
  language: string
}): void

// Track AI interactions
trackAIInteraction(data: {
  sessionId: string,
  type: string,
  messageCount: number
}): void

// Track subscription
trackSubscriptionStart(plan: string, amount: number): void
trackPaymentSuccess(amount: number): void
trackPaymentFailure(error: string): void

// Track pages
trackPageView(pageTitle: string): void

// Track errors
trackError(error: {
  error: string,
  componentStack?: string
}): void
```

---

### Stripe Service

**File**: `src/services/stripe.js`

**Methods:**

```javascript
// Initialize Stripe
loadStripe(): Promise<Stripe>

// Create checkout session
createCheckoutSession(priceId: string): Promise<string>

// Create portal session
createPortalSession(): Promise<string>

// Format currency
formatCurrency(amount: number, currency: string): string
```

---

## Error Codes

### Authentication Errors

- `auth/user-not-found`: User does not exist
- `auth/wrong-password`: Incorrect password
- `auth/email-already-in-use`: Email already registered
- `auth/weak-password`: Password too weak
- `auth/invalid-email`: Invalid email format

### Firestore Errors

- `permission-denied`: Insufficient permissions
- `not-found`: Document not found
- `already-exists`: Document already exists
- `resource-exhausted`: Quota exceeded
- `failed-precondition`: Operation requirements not met

### Function Errors

- `unauthenticated`: User not authenticated
- `permission-denied`: Insufficient permissions
- `invalid-argument`: Invalid function arguments
- `not-found`: Resource not found
- `already-exists`: Resource already exists
- `resource-exhausted`: Quota exceeded
- `failed-precondition`: Prerequisites not met
- `internal`: Internal server error
- `unavailable`: Service temporarily unavailable

### Stripe Errors

- `card_declined`: Card was declined
- `expired_card`: Card has expired
- `incorrect_cvc`: Incorrect CVC code
- `processing_error`: Payment processing error
- `rate_limit`: Too many requests

---

## Rate Limits

### Cloud Functions

- **Callable Functions**: 1000 calls/minute per user
- **Webhooks**: No limit (handled by Stripe)

### Firestore

- **Reads**: 50,000/day (free tier)
- **Writes**: 20,000/day (free tier)
- **Deletes**: 20,000/day (free tier)

### Analytics

- **Events**: 500 events/second
- **User properties**: 25 per user

---

## Versioning

**Current API Version**: v1

**Breaking Changes**: Will be communicated 30 days in advance

**Deprecation Policy**: Deprecated endpoints supported for 6 months

---

## Support

For API questions or issues:
- **Email**: api-support@example.com
- **Documentation**: https://docs.example.com
- **Status Page**: https://status.example.com

---

**Last Updated**: November 18, 2025
**API Version**: 1.0.0
