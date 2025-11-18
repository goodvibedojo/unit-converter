# Firebase Functions - Code Execution Service

Firebase Cloud Functions for the AI Mock Interview Platform, providing secure code execution and test validation.

## 📁 Structure

```
functions/
├── index.js                    # Main exports
├── executeCode.js              # Single code execution
├── runTestCases.js            # Test case runner
├── utils/
│   ├── judge0Client.js        # Judge0 API wrapper
│   ├── securityChecker.js     # Code security validation
│   └── testValidator.js       # Test result validation
├── package.json
└── .env                       # Environment variables (not in git)
```

## 🚀 Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
JUDGE0_RAPIDAPI_KEY=your_rapidapi_key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
```

### 3. Get Judge0 API Key

#### Option A: RapidAPI (Recommended for MVP)

1. Go to [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce)
2. Sign up for a free account
3. Subscribe to Judge0 CE (Free tier: 50 requests/day)
4. Copy your API key

#### Option B: Self-hosted Judge0

1. Follow [Judge0 CE installation guide](https://github.com/judge0/judge0/blob/master/CHANGELOG.md)
2. Deploy to your server
3. Update `JUDGE0_API_URL` to your instance URL

## 🧪 Local Development

### Start Firebase Emulator

```bash
# From project root
firebase emulators:start
```

This starts:
- Functions emulator: http://localhost:5001
- Firestore emulator: http://localhost:8080
- Emulator UI: http://localhost:4000

### Test Functions Locally

```bash
# Call executeCode function
curl -X POST http://localhost:5001/your-project/us-central1/executeCode \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "code": "print(\"Hello World\")",
      "language": "python"
    }
  }'
```

## 📝 API Reference

### executeCode

Execute a single code snippet.

**Request:**
```javascript
{
  code: string,        // Source code
  language: string,    // 'python' | 'javascript' | 'java' | 'cpp'
  stdin: string        // Optional: standard input
}
```

**Response:**
```javascript
{
  success: boolean,
  output: string,
  error: string,
  executionTime: number,
  cpuTime: number,
  memory: number,
  status: string,
  totalTime: number
}
```

**Example (Frontend):**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const executeCode = httpsCallable(functions, 'executeCode');

const result = await executeCode({
  code: 'print("Hello World")',
  language: 'python',
  stdin: ''
});

console.log(result.data);
```

### runTestCases

Execute code against multiple test cases.

**Request:**
```javascript
{
  code: string,
  language: string,
  testCases: [
    {
      input: string,
      expectedOutput: string,
      isHidden: boolean
    }
  ],
  sessionId: string  // Optional: session to save results
}
```

**Response:**
```javascript
{
  results: [
    {
      input: string,
      expectedOutput: string,
      actualOutput: string,
      passed: boolean,
      error: string,
      executionTime: number
    }
  ],
  passed: number,
  total: number,
  score: number,
  feedback: string,
  report: {
    summary: object,
    executionStats: object
  }
}
```

## 🔒 Security

### Code Security Checks

Before execution, all code is scanned for:
- OS/system operations
- File I/O operations
- Network requests
- Subprocess spawning
- Dynamic code execution (eval, exec)

### Execution Sandbox

Judge0 provides:
- ✅ Isolated containers
- ✅ No network access
- ✅ CPU time limits (10s)
- ✅ Memory limits (256 MB)
- ✅ Process limits

### Rate Limiting

- Single executions: 100/hour per user
- Test runs: 50/hour per user

## 🌐 Supported Languages

| Language   | Judge0 ID | Version       | Status |
|------------|-----------|---------------|--------|
| Python     | 71        | 3.8.1         | ✅     |
| JavaScript | 63        | Node.js 12    | ✅     |
| Java       | 62        | OpenJDK 13    | ✅     |
| C++        | 54        | GCC 9.2.0     | ✅     |
| C          | 50        | GCC 9.2.0     | ✅     |
| TypeScript | 74        | 3.7.4         | 🚧     |

## 📊 Cost Estimation

### Judge0 Pricing (RapidAPI)

- **Free**: 50 requests/day
- **Basic**: $0.004/request (5,000 req/month = $20)
- **Pro**: $0.003/request (50,000 req/month = $150)

### Estimated Usage

- 100 users × 10 sessions/month × 5 test runs = 5,000 requests
- **Monthly cost**: ~$20 (Basic plan)

### Optimization Strategies

1. **Caching**: Cache common problem solutions
2. **Batching**: Combine related test cases
3. **Quotas**: Limit free tier users
4. **Self-hosting**: Switch to self-hosted Judge0 when volume increases

## 🐛 Debugging

### View Function Logs

```bash
# Real-time logs
firebase functions:log

# Specific function
firebase functions:log --only executeCode

# Recent errors
firebase functions:log --only executeCode --lines 50
```

### Common Issues

**Issue**: "Judge0 API authentication failed"
- **Solution**: Check `JUDGE0_RAPIDAPI_KEY` in `.env`

**Issue**: "Rate limit exceeded"
- **Solution**: Upgrade RapidAPI plan or implement caching

**Issue**: "Execution timeout"
- **Solution**: Optimize code or increase Judge0 time limit

## 🚀 Deployment

### Deploy to Firebase

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:executeCode

# Deploy with environment variables
firebase functions:config:set \
  judge0.api_key="YOUR_KEY" \
  judge0.api_url="https://judge0-ce.p.rapidapi.com"
```

### Environment Variables (Production)

```bash
firebase functions:config:set \
  judge0.rapidapi_key="your_key" \
  judge0.api_url="https://judge0-ce.p.rapidapi.com" \
  judge0.rapidapi_host="judge0-ce.p.rapidapi.com"
```

## 📈 Monitoring

### Firebase Console

- Function invocations
- Error rates
- Execution time
- Resource usage

### Logs

```bash
# View logs in Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Test with emulator
firebase emulators:start
npm run test:integration
```

## 📚 Resources

- [Judge0 Documentation](https://ce.judge0.com/)
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce)

---

**Engineer 4: Code Execution & Testing Engineer**
Last Updated: 2025-11-18
