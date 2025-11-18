# Firebase Cloud Functions - AI Mock Interview Platform

Backend services for the AI Mock Interview Platform built with Firebase Cloud Functions.

## 📁 Project Structure

```
functions/
├── auth/                  # Authentication functions
│   ├── onUserCreate.js   # Auto-create user profile on signup
│   ├── onUserDelete.js   # Clean up user data on deletion
│   └── updateUserProfile.js # Update user profile
├── interviews/            # Interview session management
│   ├── startSession.js   # Initialize interview session
│   ├── saveProgress.js   # Auto-save code progress
│   ├── chatWithAI.js     # AI interviewer chat
│   ├── executeCode.js    # Code execution service
│   ├── endSession.js     # End session & generate feedback
│   └── getSessionHistory.js # Retrieve session history
├── problems/              # Problem bank management
│   ├── getRandomProblem.js # Get random problem
│   ├── getProblemsByCategory.js # Browse problems
│   ├── seedProblems.js   # Seed database
│   └── seedProblemsExtended.js # Extended problem bank (15 problems)
├── payments/              # Subscription & payments
│   ├── createCheckoutSession.js # Stripe checkout
│   ├── webhookHandler.js # Stripe webhooks
│   └── cancelSubscription.js # Cancel subscription
├── utils/                 # Utility modules
│   ├── middleware.js     # Auth, CORS, rate limiting
│   ├── validators.js     # Input validation
│   └── mockAI.js         # Mock AI service for development
└── index.js              # Main exports

## 🚀 Quick Start

### Installation

```bash
cd functions
npm install
```

### Local Development

Run Firebase Emulators:

```bash
# From project root
firebase emulators:start
```

Access:
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8080
- **Auth**: http://localhost:9099
- **Emulator UI**: http://localhost:4000

### Environment Variables

Create `.env` file in functions directory:

```env
# Development
USE_MOCK_AI=true
USE_MOCK_EXECUTION=true
NODE_ENV=development

# Production (set in Firebase Console)
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
JUDGE0_API_KEY=...
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete API reference.

### Example: Start Interview Session

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const startSession = httpsCallable(functions, 'startSession');

const result = await startSession({
  difficulty: 'medium',
  language: 'python',
  category: 'array'
});

console.log(result.data.problem.title); // "Two Sum"
```

## 🔐 Authentication

All functions require Firebase Auth token. Include in request:

```javascript
const idToken = await firebase.auth().currentUser.getIdToken();
```

## 🛠️ Development Features

### Mock AI Service

For development, AI responses use intelligent mock system:

```javascript
// Toggle in environment
USE_MOCK_AI=true  // Use mock (default)
USE_MOCK_AI=false // Use OpenAI API
```

Mock AI features:
- Greeting detection
- Clarification responses
- Hint generation
- Complexity analysis
- Feedback generation

### Mock Code Execution

Code execution uses mock engine in development:

```javascript
USE_MOCK_EXECUTION=true  // Use mock (default)
USE_MOCK_EXECUTION=false // Use Judge0/Docker
```

## 📊 Available Functions

### Authentication (3)
| Function | Type | Description |
|----------|------|-------------|
| `onUserCreate` | Trigger | Auto-create user profile |
| `onUserDelete` | Trigger | Clean up user data |
| `updateUserProfile` | Callable | Update user info |

### Interviews (6)
| Function | Type | Description |
|----------|------|-------------|
| `startSession` | Callable | Start interview |
| `saveProgress` | Callable | Auto-save code |
| `chatWithAI` | Callable | AI chat |
| `executeCode` | Callable | Run code |
| `endSession` | Callable | End & generate feedback |
| `getSessionHistory` | Callable | Get history |

### Problems (3)
| Function | Type | Description |
|----------|------|-------------|
| `getRandomProblem` | Callable | Random problem |
| `getProblemsByCategory` | Callable | Browse problems |
| `seedProblems` | Callable | Seed database (admin) |

### Payments (3)
| Function | Type | Description |
|----------|------|-------------|
| `createCheckoutSession` | Callable | Stripe checkout |
| `webhookHandler` | HTTP | Stripe webhooks |
| `cancelSubscription` | Callable | Cancel subscription |

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Test Coverage

```bash
npm run test:coverage
```

## 🚢 Deployment

### Deploy All Functions

```bash
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:startSession
```

### Deploy with Environment

```bash
# Staging
firebase use staging
firebase deploy --only functions

# Production
firebase use production
firebase deploy --only functions
```

## 📈 Monitoring

### View Logs

```bash
# Real-time logs
firebase functions:log

# Filter by function
firebase functions:log --only startSession

# Limit to errors
firebase functions:log --level ERROR
```

### Performance Monitoring

- Firebase Console → Functions → Usage
- Monitor cold starts, execution time, errors

## 🔒 Security

### Rate Limiting

- **Default**: 100 requests/hour per user
- **Code Execution**: 10 requests/minute

### Middleware

All HTTP functions use:
- ✅ CORS handling
- ✅ Authentication verification
- ✅ Input validation
- ✅ Rate limiting
- ✅ Subscription checking

### Firestore Security Rules

See [firestore.rules](../firestore.rules) for database security.

## 🐛 Troubleshooting

### Function Not Found

```bash
# Ensure function is exported in index.js
# Redeploy
firebase deploy --only functions
```

### CORS Errors

Functions use `cors({ origin: true })` - all origins allowed in development.

### Cold Start Issues

- Functions may take 1-2s on first call
- Use min instances in production:

```javascript
exports.startSession = functions
  .runWith({ minInstances: 1 })
  .https.onCall(async (data, context) => {
    // ...
  });
```

## 📝 Code Style

### ESLint

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

### Pre-commit Hook

```bash
# Add to package.json
"husky": {
  "hooks": {
    "pre-commit": "npm run lint"
  }
}
```

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Functions
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: firebase deploy --only functions
```

## 📚 Problem Bank

### Current Problems (15)

- **Easy (7)**: Two Sum, Reverse String, Valid Palindrome, Best Time to Buy Stock, Valid Parentheses, Merge Sorted Lists, Maximum Subarray
- **Medium (6)**: Longest Substring, Container With Water, 3Sum, Group Anagrams, Product Except Self, Valid Sudoku
- **Hard (2)**: Median of Two Sorted Arrays, Trapping Rain Water

### Add New Problems

Edit `seedProblemsExtended.js` and add to `EXTENDED_PROBLEMS` array.

### Seed Database

```javascript
const seedProblems = httpsCallable(functions, 'seedProblems');
await seedProblems();
```

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests & linting
4. Submit PR

## 📄 License

MIT License - See [LICENSE](../LICENSE)

## 🙋 Support

For issues or questions:
- GitHub Issues
- API Documentation: [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- Engineer 2 Dev Log: [ENGINEER2_DEV_LOG.md](../ENGINEER2_DEV_LOG.md)

---

**Built with ❤️ by Engineer 2 (Backend & Infrastructure Lead)**
