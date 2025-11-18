# AI Mock Interview Platform 🎯

A comprehensive SaaS platform for practicing FAANG-style technical interviews with an AI-powered interviewer. Built with React, Firebase, and OpenAI.

## 🚀 Features

### Core Features (MVP - Phase 1-4)
- ✅ **Authentication System**: Email/Password + Google OAuth with Firebase
- ✅ **Monaco Code Editor**: VSCode-like editing experience with syntax highlighting
- ✅ **Terminal Emulator**: Real-time code execution output
- ✅ **AI Interviewer**: GPT-4 powered conversational interviewer
- ✅ **Test Case Validation**: Automated testing with detailed feedback
- ✅ **Problem Bank**: 5 curated LeetCode-style problems (expandable to 100+)
- ✅ **Session Management**: Track interview sessions in Firestore

### Upcoming Features
- 🎙️ **Voice Interaction** (Phase 5): Speech-to-Text & Text-to-Speech with OpenAI Whisper/TTS
- 💳 **Subscription System** (Phase 7): Stripe integration for $20/month subscriptions
- 📊 **Analytics & History** (Phase 6): Session replay, performance tracking
- 🌐 **Multi-language Support**: JavaScript, Java, C++ (currently Python)

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project (for auth, database, and cloud functions)
- OpenAI API key (for AI interviewer)
- Stripe account (for payments - Phase 7)

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **TailwindCSS 4** for styling
- **Monaco Editor** for code editing
- **React Router** for navigation
- **Firebase SDK** for auth and database

### Backend
- **Firebase Authentication**: User management
- **Firestore**: NoSQL database for sessions, users, problems
- **Firebase Cloud Functions**: Serverless backend
- **OpenAI API**: GPT-4 for interviewer, Whisper for STT, TTS for speech

### Code Execution
- **Judge0 API** (Phase 3 - initial approach)
- **Docker Sandbox** (future - for secure code execution)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd unit-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your Firebase and OpenAI credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   VITE_OPENAI_API_KEY=sk-your-openai-api-key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Auth/              # Login, Signup, ProtectedRoute
│   ├── Dashboard/         # Main dashboard
│   ├── Editor/            # CodeEditor, LanguageSelector
│   ├── Terminal/          # Terminal emulator
│   ├── Interview/         # InterviewSession, ChatInterface, ProblemDisplay
│   ├── TestCases/         # TestCasePanel, TestRunner
│   └── Subscription/      # Pricing, Checkout (Phase 7)
├── contexts/
│   └── AuthContext.jsx    # Authentication context
├── services/
│   ├── firebase.js        # Firebase configuration
│   ├── openai.js          # OpenAI service
│   ├── codeExecution.js   # Code execution service
│   └── stripe.js          # Stripe integration (Phase 7)
├── utils/
│   └── problemBank.js     # Problem definitions
└── App.jsx                # Main app with routing
```

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password + Google)
4. Create a Firestore database

### 2. Firestore Collections

```javascript
// users/{userId}
{
  uid: string,
  email: string,
  displayName: string,
  subscriptionStatus: 'trial' | 'active' | 'inactive',
  trialSessionsUsed: number,
  createdAt: timestamp,
  stats: {
    totalSessions: number,
    problemsSolved: number,
    averageScore: number
  }
}

// sessions/{sessionId}
{
  id: string,
  userId: string,
  problemId: string,
  startTime: timestamp,
  endTime: timestamp,
  code: string,
  language: string,
  chatHistory: [{role: 'user'|'ai', content: string, timestamp: timestamp}],
  testResults: {passed: number, total: number},
  completed: boolean
}

// problems/{problemId}
{
  id: string,
  title: string,
  difficulty: 'easy' | 'medium' | 'hard',
  category: string[],
  description: string,
  testCases: [{input: string, expectedOutput: string, isHidden: boolean}],
  starterCode: {python: string, javascript: string}
}
```

### 3. Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read/write their own sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Authenticated users can read problems
    match /problems/{problemId} {
      allow read: if request.auth != null;
    }
  }
}
```

## 🎨 Usage

### Starting an Interview

1. **Sign up / Log in** to your account
2. Navigate to **Dashboard**
3. Click **"Start Interview"**
4. The system will:
   - Select a random problem
   - Initialize the AI interviewer
   - Load starter code in the editor
5. **Chat with AI** to ask clarifying questions
6. **Write your solution** in the code editor
7. **Run tests** to validate your code
8. **End session** when complete

### AI Interviewer Features

The AI interviewer can:
- Explain the problem in natural language
- Answer clarifying questions
- Provide hints when you're stuck
- Discuss time/space complexity
- Give constructive feedback
- Suggest optimizations

## 📝 Development Roadmap

See [PRODUCT_PLAN.md](./PRODUCT_PLAN.md) for the complete development plan.

### Current Phase: Phase 1-4 (MVP) ✅
- [x] Authentication system
- [x] Code editor with Monaco
- [x] Terminal emulator
- [x] AI chat interface
- [x] Test case validation
- [x] Basic session management

### Next Phases:
- **Phase 5**: Voice interaction (Whisper + TTS)
- **Phase 6**: Session history & analytics
- **Phase 7**: Subscription & payments (Stripe)
- **Phase 8**: Polish, testing & deployment
- **Phase 9**: Post-launch iteration

## 🧪 Testing

```bash
# Run tests (when implemented in Phase 8)
npm run test

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint
```

## 🚢 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploy to Firebase (Phase 8)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init

# Deploy
firebase deploy
```

## 💰 Business Model

- **Free Trial**: 3 interview sessions
- **Subscription**: $20/month for unlimited interviews
- **Features**:
  - 100+ coding problems
  - AI-powered interviewer
  - Session history & analytics
  - Multiple programming languages
  - Voice interaction (Phase 5+)

## 🔐 Security Considerations

### Code Execution Sandbox
- Docker containers with resource limits
- No network access
- Read-only filesystem (except /tmp)
- 30-second timeout
- Memory limit: 512MB

### API Security
- Firebase Auth tokens for all requests
- Rate limiting: 100 requests/hour
- Server-side OpenAI API calls (keys never exposed)
- Input sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙋‍♂️ Support

For issues or questions:
- Open a GitHub issue
- Email: support@aimockinterview.com (placeholder)

## 🗺️ Future Roadmap

### Q2 2025
- Voice-based interviews
- Mobile app (React Native)
- Multi-user sessions (pair programming)

### Q3 2025
- System design interview mode
- Behavioral interview practice
- Company-specific prep tracks

### Q4 2025
- Enterprise plans (bootcamps, universities)
- API for third-party integrations
- Community features (forums, leaderboards)

---

**Built with ❤️ for engineers preparing for FAANG interviews**
