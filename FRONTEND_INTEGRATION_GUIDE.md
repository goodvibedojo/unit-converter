# Frontend Integration Guide

Complete guide for integrating Firebase Cloud Functions with the React frontend.

## 🎯 Quick Start

### 1. Setup Firebase SDK

The Firebase SDK is already configured in `src/services/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
```

### 2. Connect to Emulators (Development)

```javascript
// src/services/firebase.js
import { connectFunctionsEmulator } from 'firebase/functions';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';

if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## 📞 Calling Cloud Functions

### Basic Pattern

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Call a function
const functionName = httpsCallable(functions, 'functionName');

try {
  const result = await functionName({ param1, param2 });
  console.log(result.data); // { success: true, data: {...} }
} catch (error) {
  console.error(error.code, error.message);
}
```

## 🎯 Complete Integration Examples

### 1. Authentication Flow

```javascript
// src/services/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { auth } from './firebase';

// Sign up with email/password
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // onUserCreate trigger automatically creates profile
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Sign in with email/password
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Sign out
export async function logout() {
  await signOut(auth);
}

// Update profile
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export async function updateProfile(updates) {
  const updateUserProfile = httpsCallable(functions, 'updateUserProfile');
  const result = await updateUserProfile(updates);
  return result.data;
}
```

### 2. Interview Session Management

```javascript
// src/services/interviewService.js
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Start new interview session
export async function startInterview({ difficulty, language, category }) {
  const startSession = httpsCallable(functions, 'startSession');

  try {
    const result = await startSession({ difficulty, language, category });
    return result.data;
  } catch (error) {
    console.error('Start session error:', error);
    throw error;
  }
}

// Save code progress
export async function saveCode(sessionId, code, action = 'edit') {
  const saveProgress = httpsCallable(functions, 'saveProgress');

  try {
    await saveProgress({ sessionId, code, action });
  } catch (error) {
    console.error('Save progress error:', error);
    // Non-blocking - continue even if save fails
  }
}

// Chat with AI interviewer
export async function chatWithAI(sessionId, message) {
  const chatWithAI = httpsCallable(functions, 'chatWithAI');

  try {
    const result = await chatWithAI({ sessionId, message });
    return result.data.aiResponse;
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}

// Execute code
export async function executeCode(sessionId, code, language, stdin = '') {
  const executeCode = httpsCallable(functions, 'executeCode');

  try {
    const result = await executeCode({ sessionId, code, language, stdin });
    return result.data.result;
  } catch (error) {
    console.error('Execute error:', error);
    throw error;
  }
}

// End interview session
export async function endInterview(sessionId, testResults) {
  const endSession = httpsCallable(functions, 'endSession');

  try {
    const result = await endSession({ sessionId, testResults });
    return result.data;
  } catch (error) {
    console.error('End session error:', error);
    throw error;
  }
}

// Get session history
export async function getSessionHistory(page = 1, limit = 10, filters = {}) {
  const getSessionHistory = httpsCallable(functions, 'getSessionHistory');

  try {
    const result = await getSessionHistory({ page, limit, ...filters });
    return result.data;
  } catch (error) {
    console.error('Get history error:', error);
    throw error;
  }
}
```

### 3. Problem Bank Access

```javascript
// src/services/problemService.js
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Get random problem
export async function getRandomProblem(difficulty = 'easy', category = null) {
  const getRandomProblem = httpsCallable(functions, 'getRandomProblem');

  try {
    const result = await getRandomProblem({ difficulty, category });
    return result.data.problem;
  } catch (error) {
    console.error('Get problem error:', error);
    throw error;
  }
}

// Browse problems by category
export async function getProblemsByCategory(filters = {}) {
  const getProblemsByCategory = httpsCallable(functions, 'getProblemsByCategory');

  try {
    const result = await getProblemsByCategory(filters);
    return result.data;
  } catch (error) {
    console.error('Get problems error:', error);
    throw error;
  }
}

// Seed problems (admin only)
export async function seedProblems() {
  const seedProblems = httpsCallable(functions, 'seedProblems');

  try {
    const result = await seedProblems();
    return result.data;
  } catch (error) {
    console.error('Seed problems error:', error);
    throw error;
  }
}
```

## 🎨 React Component Examples

### Interview Session Component

```javascript
// src/components/Interview/InterviewSession.jsx
import { useState, useEffect } from 'react';
import { startInterview, saveCode, chatWithAI, executeCode, endInterview } from '../../services/interviewService';

export function InterviewSession({ difficulty, language }) {
  const [session, setSession] = useState(null);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // Start interview on mount
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        const result = await startInterview({ difficulty, language });
        setSession(result.session);
        setProblem(result.problem);
        setCode(result.session.code);

        // Add initial AI message
        if (result.problem.title) {
          setChatHistory([{
            role: 'ai',
            content: `Hi! Let's work on "${result.problem.title}". Ready to start?`,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Failed to start interview:', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [difficulty, language]);

  // Auto-save code with debouncing
  useEffect(() => {
    if (!session?.id || !code) return;

    const timer = setTimeout(() => {
      saveCode(session.id, code, 'edit');
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [code, session?.id]);

  // Send message to AI
  async function handleSendMessage(message) {
    if (!session?.id || !message.trim()) return;

    // Add user message
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date()
    }]);

    try {
      const aiResponse = await chatWithAI(session.id, message);

      // Add AI response
      setChatHistory(prev => [...prev, {
        role: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
    }
  }

  // Run code
  async function handleRunCode() {
    if (!session?.id || !code) return;

    setLoading(true);
    try {
      await saveCode(session.id, code, 'run');
      const result = await executeCode(session.id, code, language);
      setOutput(result.stdout || result.stderr);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // End interview
  async function handleEndInterview() {
    if (!session?.id) return;

    setLoading(true);
    try {
      const result = await endInterview(session.id, {
        passed: 3,
        total: 5
      });

      // Show feedback
      alert(`Session complete! Score: ${result.feedback.score}/100`);

      // Navigate to feedback page
      // navigate('/feedback', { state: { feedback: result.feedback } });
    } catch (error) {
      console.error('End interview error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !session) {
    return <div>Loading interview...</div>;
  }

  return (
    <div className="interview-session">
      {/* Problem Display */}
      <div className="problem-panel">
        <h2>{problem?.title}</h2>
        <p>{problem?.description}</p>
      </div>

      {/* Code Editor */}
      <div className="editor-panel">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write your code here..."
        />
        <button onClick={handleRunCode} disabled={loading}>
          Run Code
        </button>
      </div>

      {/* Chat */}
      <div className="chat-panel">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      {/* Output */}
      <div className="output-panel">
        <pre>{output}</pre>
      </div>

      {/* Controls */}
      <button onClick={handleEndInterview} disabled={loading}>
        End Interview
      </button>
    </div>
  );
}
```

### Session History Component

```javascript
// src/components/Dashboard/SessionHistory.jsx
import { useState, useEffect } from 'react';
import { getSessionHistory } from '../../services/interviewService';

export function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const result = await getSessionHistory(page, 10);
        setSessions(result.sessions);
        setTotalPages(result.pagination.totalPages);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [page]);

  if (loading) {
    return <div>Loading history...</div>;
  }

  return (
    <div className="session-history">
      <h2>Interview History</h2>

      <div className="sessions-list">
        {sessions.map(session => (
          <div key={session.id} className="session-card">
            <h3>{session.problemTitle}</h3>
            <p>Difficulty: {session.difficulty}</p>
            <p>Language: {session.language}</p>
            <p>Duration: {session.duration} minutes</p>
            <p>Score: {session.aiScore}/100</p>
            <p>Tests: {session.testResults.passed}/{session.testResults.total}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPage(p => p - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## 🔄 Real-time Data with Firestore

```javascript
// src/hooks/useRealtimeSession.js
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useRealtimeSession(sessionId) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = doc(db, 'sessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        setSession({ id: snapshot.id, ...snapshot.data() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { session, loading };
}
```

## 🔒 Error Handling

```javascript
// src/utils/errorHandler.js
export function handleFunctionError(error) {
  console.error('Function error:', error);

  // Firebase error codes
  if (error.code === 'unauthenticated') {
    return 'Please log in to continue.';
  }

  if (error.code === 'permission-denied') {
    return 'You do not have permission to perform this action.';
  }

  if (error.code === 'not-found') {
    return 'Resource not found.';
  }

  if (error.code === 'resource-exhausted') {
    return 'Rate limit exceeded. Please try again later.';
  }

  // Custom error codes
  if (error.message?.includes('TRIAL_EXPIRED')) {
    return 'Your trial has expired. Please subscribe to continue.';
  }

  return error.message || 'An unexpected error occurred.';
}

// Usage in component
try {
  await startInterview({ difficulty, language });
} catch (error) {
  const message = handleFunctionError(error);
  alert(message);
}
```

## 🎯 Best Practices

### 1. Use Custom Hooks

```javascript
// src/hooks/useInterview.js
import { useState } from 'react';
import { startInterview, saveCode, endInterview } from '../services/interviewService';

export function useInterview() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function start(options) {
    setLoading(true);
    setError(null);
    try {
      const result = await startInterview(options);
      setSession(result.session);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function save(code, action) {
    if (!session?.id) return;
    await saveCode(session.id, code, action);
  }

  async function end(testResults) {
    if (!session?.id) return;
    setLoading(true);
    try {
      const result = await endInterview(session.id, testResults);
      return result;
    } finally {
      setLoading(false);
    }
  }

  return { session, loading, error, start, save, end };
}
```

### 2. Implement Loading States

```javascript
function MyComponent() {
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    setLoading(true);
    try {
      await someFunction();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleAction} disabled={loading}>
      {loading ? 'Loading...' : 'Click Me'}
    </button>
  );
}
```

### 3. Debounce Expensive Operations

```javascript
import { useEffect, useRef } from 'react';

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

// Usage
const debouncedSave = useDebounce((code) => {
  saveCode(sessionId, code);
}, 500);
```

## 🐛 Debugging

### Enable Debug Mode

```javascript
// src/services/firebase.js
import { setLogLevel } from 'firebase/functions';

if (import.meta.env.DEV) {
  setLogLevel('debug');
}
```

### Monitor Network Requests

Open browser DevTools → Network tab → Filter by "functions"

### Check Emulator Logs

Terminal running `firebase emulators:start` shows all function logs.

---

**Engineer 2 (Backend & Infrastructure Lead)**
*Ready for Engineer 1 (Frontend) integration!*
