# AI Mock Interview Platform - API Documentation

## Overview

This document describes all Cloud Functions (APIs) available for the AI Mock Interview Platform.

**Base URL (Production)**: `https://us-central1-your-project-id.cloudfunctions.net`
**Base URL (Emulator)**: `http://localhost:5001/your-project-id/us-central1`

## Authentication

All API endpoints require Firebase Authentication. Include the user's ID token in the request:

```javascript
// Get ID token
const idToken = await firebase.auth().currentUser.getIdToken();

// Call Cloud Function
const result = await functions.httpsCallable('functionName')({ data });
```

## Response Format

All responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## API Endpoints

### Authentication Functions

#### `onUserCreate` (Trigger)
**Type**: Auth Trigger (automatic)
**Purpose**: Automatically creates user profile when a new user signs up

**Trigger**: Firebase Auth user creation

**Created Document**:
```javascript
users/{userId} {
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  subscriptionStatus: 'trial',
  trialSessionsUsed: 0,
  trialSessionsTotal: 3,
  stats: { ... },
  preferences: { ... },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

#### `updateUserProfile`
**Type**: Callable Function
**Purpose**: Update user profile information

**Request**:
```javascript
{
  displayName: string (optional),
  photoURL: string | null (optional),
  preferences: {
    theme: 'light' | 'dark',
    defaultLanguage: 'python' | 'javascript' | 'java',
    voiceEnabled: boolean
  } (optional)
}
```

**Response**:
```javascript
{
  success: true,
  profile: { ... } // Updated user profile
}
```

**Errors**:
- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid input data

---

#### `onUserDelete` (Trigger)
**Type**: Auth Trigger (automatic)
**Purpose**: Cleans up user data when account is deleted

**Trigger**: Firebase Auth user deletion

**Actions**:
- Deletes user profile
- Deletes all user sessions
- Deletes subscription data

---

### Interview Session Functions

#### `startSession`
**Type**: Callable Function
**Purpose**: Initialize a new interview session

**Request**:
```javascript
{
  difficulty: 'easy' | 'medium' | 'hard' (default: 'easy'),
  language: 'python' | 'javascript' | 'java' | 'cpp' (default: 'python'),
  category: string (optional) // e.g., 'array', 'tree', 'graph'
}
```

**Response**:
```javascript
{
  success: true,
  session: {
    id: string,
    problemId: string,
    language: string,
    code: string // Starter code
  },
  problem: {
    id: string,
    title: string,
    difficulty: string,
    category: string[],
    description: string,
    constraints: string[],
    examples: [...],
    hints: [...],
    starterCode: {...},
    testCases: [...] // Only non-hidden test cases
  },
  trialInfo: {
    sessionsUsed: number,
    sessionsTotal: number,
    sessionsRemaining: number
  } | null
}
```

**Errors**:
- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid difficulty or language
- `permission-denied`: Trial expired or no active subscription
- `not-found`: No problems match criteria

**Example**:
```javascript
const result = await startSession({
  difficulty: 'medium',
  language: 'python',
  category: 'array'
});
console.log(result.problem.title); // "Two Sum"
```

---

#### `saveProgress`
**Type**: Callable Function
**Purpose**: Auto-save code progress during interview

**Request**:
```javascript
{
  sessionId: string,
  code: string,
  action: 'edit' | 'run' | 'submit' (default: 'edit')
}
```

**Response**:
```javascript
{
  success: true,
  sessionId: string,
  saved: true
}
```

**Errors**:
- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid session ID or code
- `not-found`: Session not found
- `permission-denied`: Not session owner
- `failed-precondition`: Session already ended

**Rate Limit**: Debounce saves on client-side to 500ms

---

#### `chatWithAI`
**Type**: Callable Function
**Purpose**: Send message to AI interviewer and get response

**Request**:
```javascript
{
  sessionId: string,
  message: string
}
```

**Response**:
```javascript
{
  success: true,
  aiResponse: string,
  timestamp: string
}
```

**Errors**:
- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid session ID or message
- `not-found`: Session not found
- `permission-denied`: Not session owner
- `failed-precondition`: Session already ended

**Example**:
```javascript
const result = await chatWithAI({
  sessionId: 'abc123',
  message: 'Can you explain the problem?'
});
console.log(result.aiResponse);
```

**Current Implementation**:
- Uses Mock AI for development (set `USE_MOCK_AI=false` to disable)
- OpenAI integration coming in Phase 4

---

#### `executeCode`
**Type**: Callable Function
**Purpose**: Execute user code and return results

**Request**:
```javascript
{
  sessionId: string,
  code: string,
  language: 'python' | 'javascript' | 'java' | 'cpp',
  stdin: string (optional) // Input for the program
}
```

**Response**:
```javascript
{
  success: true,
  result: {
    stdout: string,
    stderr: string,
    exitCode: number,
    executionTime: number, // milliseconds
    memory: number // bytes
  },
  timestamp: string
}
```

**Errors**:
- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid inputs
- `not-found`: Session not found
- `permission-denied`: Not session owner

**Current Implementation**:
- Uses Mock execution for development (set `USE_MOCK_EXECUTION=false` to disable)
- Judge0/Docker integration coming in Phase 3

**Security**:
- 30-second timeout
- 512MB memory limit
- No network access
- Sandboxed execution

---

#### `endSession`
**Type**: Callable Function
**Purpose**: End interview session and generate AI feedback

**Request**:
```javascript
{
  sessionId: string,
  testResults: {
    passed: number,
    total: number,
    details: [...]
  } (optional)
}
```

**Response**:
```javascript
{
  success: true,
  sessionId: string,
  feedback: {
    score: number, // 0-100
    overall: string,
    strengths: string[],
    improvements: string[],
    complexity: {
      time: string,
      space: string
    }
  },
  stats: {
    averageScore: number,
    totalSessions: number,
    problemsSolved: number
  }
}
```

**Errors**:
- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid session ID
- `not-found`: Session not found
- `permission-denied`: Not session owner
- `failed-precondition`: Session already ended

**Side Effects**:
- Updates user stats (average score, total sessions, streak)
- Marks session as completed
- Increments problemsSolved if all tests passed

---

#### `getSessionHistory`
**Type**: Callable Function
**Purpose**: Get user's interview session history

**Request**:
```javascript
{
  page: number (default: 1),
  limit: number (default: 10, max: 100),
  status: 'active' | 'completed' | 'abandoned' (optional),
  difficulty: 'easy' | 'medium' | 'hard' (optional)
}
```

**Response**:
```javascript
{
  success: true,
  sessions: [
    {
      id: string,
      problemId: string,
      problemTitle: string,
      difficulty: string,
      language: string,
      startTime: timestamp,
      endTime: timestamp,
      duration: number, // minutes
      status: string,
      testResults: {...},
      aiScore: number
    },
    ...
  ],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Errors**:
- `unauthenticated`: User not logged in

---

### Problem Bank Functions

#### `getRandomProblem`
**Type**: Callable Function
**Purpose**: Get a random problem by difficulty and category

**Request**:
```javascript
{
  difficulty: 'easy' | 'medium' | 'hard' (default: 'easy'),
  category: string (optional),
  excludeIds: string[] (optional) // Problem IDs to exclude
}
```

**Response**:
```javascript
{
  success: true,
  problem: {
    id: string,
    title: string,
    slug: string,
    difficulty: string,
    category: string[],
    companyTags: string[],
    description: string,
    constraints: string[],
    examples: [...],
    hints: [...],
    starterCode: {...},
    testCases: [...] // Only non-hidden
  }
}
```

**Errors**:
- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid difficulty
- `not-found`: No problems found

---

#### `getProblemsByCategory`
**Type**: Callable Function
**Purpose**: Get all problems filtered by category/difficulty

**Request**:
```javascript
{
  category: string (optional),
  difficulty: 'easy' | 'medium' | 'hard' (optional),
  page: number (default: 1),
  limit: number (default: 20, max: 100)
}
```

**Response**:
```javascript
{
  success: true,
  problems: [
    {
      id: string,
      title: string,
      slug: string,
      difficulty: string,
      category: string[],
      companyTags: string[],
      description: string
    },
    ...
  ],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Errors**:
- `unauthenticated`: User not logged in

---

#### `seedProblems` (Admin Only)
**Type**: Callable Function
**Purpose**: Seed database with initial problems

**Request**:
```javascript
{}
```

**Response**:
```javascript
{
  success: true,
  count: number,
  message: string
}
```

**Errors**:
- `unauthenticated`: User not logged in
- `permission-denied`: Not an admin

**Note**: Admin check to be implemented in production

---

### Payment Functions

#### `createCheckoutSession`
**Type**: Callable Function
**Purpose**: Create Stripe checkout session for subscription

**Status**: Coming in Phase 7

**Request**:
```javascript
{
  plan: 'monthly' | 'annual' (default: 'monthly')
}
```

**Response**:
```javascript
{
  success: true,
  checkoutUrl: string
}
```

---

#### `webhookHandler`
**Type**: HTTP Function
**Purpose**: Handle Stripe webhook events

**Status**: Coming in Phase 7

**Endpoint**: `POST /webhookHandler`

**Events Handled**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

#### `cancelSubscription`
**Type**: Callable Function
**Purpose**: Cancel user subscription

**Status**: Coming in Phase 7

---

## Rate Limiting

All API endpoints have rate limiting:

- **Default**: 100 requests per hour per user
- **Code Execution**: 10 requests per minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

Rate limit exceeded response:
```javascript
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Maximum 100 requests per hour.',
    retryAfter: 3600 // seconds
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication token |
| `PERMISSION_DENIED` | User doesn't have permission |
| `NOT_FOUND` | Resource not found |
| `INVALID_ARGUMENT` | Invalid input parameters |
| `FAILED_PRECONDITION` | Operation not allowed in current state |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `NOT_IMPLEMENTED` | Feature coming soon |
| `TRIAL_EXPIRED` | Trial sessions exhausted |
| `SUBSCRIPTION_REQUIRED` | Active subscription needed |

---

## Development vs Production

### Environment Variables

```bash
# Development
USE_MOCK_AI=true
USE_MOCK_EXECUTION=true
NODE_ENV=development

# Production
USE_MOCK_AI=false
USE_MOCK_EXECUTION=false
NODE_ENV=production
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
```

### Firebase Emulator

Run locally:
```bash
firebase emulators:start
```

Emulator URLs:
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Functions: http://localhost:5001
- UI: http://localhost:4000

---

## Testing

### Example: Complete Interview Flow

```javascript
// 1. Start session
const sessionResult = await startSession({
  difficulty: 'easy',
  language: 'python'
});
const { sessionId, problem } = sessionResult.session;

// 2. Chat with AI
await chatWithAI({
  sessionId,
  message: 'Can you give me a hint?'
});

// 3. Save code progress
await saveProgress({
  sessionId,
  code: 'def two_sum(nums, target):\n    ...',
  action: 'edit'
});

// 4. Execute code
const executeResult = await executeCode({
  sessionId,
  code: 'def two_sum(nums, target):\n    return [0, 1]',
  language: 'python'
});

// 5. End session
const feedbackResult = await endSession({
  sessionId,
  testResults: { passed: 3, total: 3 }
});

console.log(feedbackResult.feedback);
```

---

## Changelog

### Version 1.0.0 (Week 1 - January 2025)
- Initial API implementation
- Authentication functions
- Session management
- Problem bank
- Mock AI service
- Payment stubs

### Coming Soon
- OpenAI integration (Week 2)
- Judge0 code execution (Week 3)
- Voice features (Week 3)
- Stripe payments (Week 4)

---

_Last Updated: 2025-01-15_
_Engineer 2: Backend & Infrastructure Lead_
