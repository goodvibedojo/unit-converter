# Testing Guide - AI Mock Interview Platform

This guide covers testing strategies, examples, and best practices for the AI Mock Interview Platform.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Setting Up Testing Environment](#setting-up-testing-environment)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Firebase Testing](#firebase-testing)
7. [API Testing](#api-testing)
8. [Performance Testing](#performance-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [CI/CD Integration](#cicd-integration)

---

## Testing Strategy

### Testing Pyramid

```
          /\
         /E2E\        <- Few, critical user flows
        /------\
       /Integration\ <- API calls, Firebase operations
      /--------------\
     /  Unit Tests    \ <- Most tests: components, utilities
    /------------------\
```

### Coverage Goals

- **Unit Tests**: > 70% coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: Main user flows
- **Performance**: Lighthouse score > 90

---

## Setting Up Testing Environment

### Install Dependencies

```bash
# Install testing libraries
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  vitest \
  @vitest/ui \
  jsdom \
  firebase-functions-test \
  supertest

# Install E2E testing
npm install --save-dev \
  @playwright/test \
  playwright
```

### Configure Vitest

Create `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
});
```

### Setup File

Create `src/test/setup.js`:

```javascript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
  analytics: {}
}));
```

---

## Unit Testing

### Component Testing Example

**Test: PricingCard Component**

```javascript
// src/components/Subscription/PricingCard.test.jsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PricingCard from './PricingCard';

describe('PricingCard', () => {
  const mockPlan = {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 20,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited sessions',
      'Full history',
      'Advanced analytics'
    ]
  };

  it('renders plan information correctly', () => {
    render(<PricingCard plan={mockPlan} />);

    expect(screen.getByText('Monthly Plan')).toBeInTheDocument();
    expect(screen.getByText('$20')).toBeInTheDocument();
    expect(screen.getByText('/month')).toBeInTheDocument();
  });

  it('renders all features', () => {
    render(<PricingCard plan={mockPlan} />);

    mockPlan.features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it('calls onSubscribe when button clicked', () => {
    const handleSubscribe = vi.fn();
    render(
      <PricingCard
        plan={mockPlan}
        onSubscribe={handleSubscribe}
      />
    );

    const button = screen.getByRole('button', { name: /subscribe/i });
    fireEvent.click(button);

    expect(handleSubscribe).toHaveBeenCalledWith('monthly');
    expect(handleSubscribe).toHaveBeenCalledTimes(1);
  });

  it('shows popular badge when isPopular is true', () => {
    render(<PricingCard plan={mockPlan} isPopular={true} />);

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    render(<PricingCard plan={mockPlan} loading={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

### Utility Function Testing

**Test: Analytics Helpers**

```javascript
// src/utils/analyticsHelpers.test.js

import { describe, it, expect } from 'vitest';
import {
  calculateUserStats,
  calculateSessionDuration,
  groupByDifficulty
} from './analyticsHelpers';

describe('analyticsHelpers', () => {
  describe('calculateSessionDuration', () => {
    it('calculates duration correctly', () => {
      const session = {
        startTime: { toMillis: () => 1000000 },
        endTime: { toMillis: () => 1003600 }
      };

      expect(calculateSessionDuration(session)).toBe(3600);
    });

    it('returns 0 for incomplete session', () => {
      const session = {
        startTime: { toMillis: () => 1000000 },
        endTime: null
      };

      expect(calculateSessionDuration(session)).toBe(0);
    });
  });

  describe('groupByDifficulty', () => {
    it('groups sessions by difficulty', () => {
      const sessions = [
        { difficulty: 'easy', completed: true },
        { difficulty: 'easy', completed: false },
        { difficulty: 'medium', completed: true },
        { difficulty: 'hard', completed: true }
      ];

      const result = groupByDifficulty(sessions);

      expect(result.easy).toEqual({ attempted: 2, solved: 1 });
      expect(result.medium).toEqual({ attempted: 1, solved: 1 });
      expect(result.hard).toEqual({ attempted: 1, solved: 1 });
    });
  });

  describe('calculateUserStats', () => {
    it('calculates comprehensive stats', () => {
      const sessions = [
        {
          completed: true,
          testResults: { passed: 10, total: 10, score: 100 },
          duration: 1800
        },
        {
          completed: true,
          testResults: { passed: 8, total: 10, score: 80 },
          duration: 2400
        }
      ];

      const stats = calculateUserStats(sessions);

      expect(stats.totalSessions).toBe(2);
      expect(stats.completedSessions).toBe(2);
      expect(stats.averageScore).toBe(90);
      expect(stats.successRate).toBe(90);
    });
  });
});
```

### Custom Hook Testing

**Test: useSubscription Hook**

```javascript
// src/hooks/useSubscription.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscription } from './useSubscription';

// Mock Firebase
vi.mock('../services/firebase', () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        onSnapshot: vi.fn()
      }))
    }))
  }
}));

describe('useSubscription', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useSubscription('user123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.subscription).toBeNull();
  });

  it('returns subscription data when loaded', async () => {
    const mockSubscription = {
      status: 'active',
      plan: 'monthly',
      trialSessionsUsed: 0
    };

    // Mock Firestore to return data
    vi.mocked(db.collection).mockReturnValue({
      doc: vi.fn(() => ({
        onSnapshot: (callback) => {
          callback({ data: () => mockSubscription });
          return vi.fn(); // unsubscribe function
        }
      }))
    });

    const { result } = renderHook(() => useSubscription('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscription).toEqual(mockSubscription);
  });

  it('calculates canStartInterview correctly for trial user', () => {
    const mockSubscription = {
      status: 'trial',
      trialSessionsUsed: 2,
      trialSessionsTotal: 3
    };

    const { result } = renderHook(() => useSubscription('user123'));

    // Simulate loaded state
    result.current.subscription = mockSubscription;
    result.current.loading = false;

    expect(result.current.canStartInterview()).toBe(true);
  });

  it('prevents interview when trial sessions exhausted', () => {
    const mockSubscription = {
      status: 'trial',
      trialSessionsUsed: 3,
      trialSessionsTotal: 3
    };

    const { result } = renderHook(() => useSubscription('user123'));

    result.current.subscription = mockSubscription;
    result.current.loading = false;

    expect(result.current.canStartInterview()).toBe(false);
  });
});
```

---

## Integration Testing

### Firebase Operations

**Test: Session Creation**

```javascript
// src/test/integration/session.test.js

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, addDoc, getDoc } from 'firebase/firestore';

describe('Session Integration Tests', () => {
  let testEnv;
  let db;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });

    db = testEnv.authenticatedContext('user123').firestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('creates session with correct structure', async () => {
    const sessionData = {
      userId: 'user123',
      problemId: 'two-sum',
      startTime: new Date(),
      code: 'def twoSum(nums, target):',
      language: 'python',
      completed: false
    };

    const docRef = await addDoc(collection(db, 'sessions'), sessionData);
    const docSnap = await getDoc(docRef);

    expect(docSnap.exists()).toBe(true);
    expect(docSnap.data()).toMatchObject(sessionData);
  });

  it('prevents creating session for other user', async () => {
    const sessionData = {
      userId: 'otherUser',
      problemId: 'two-sum',
      startTime: new Date()
    };

    await expect(
      addDoc(collection(db, 'sessions'), sessionData)
    ).rejects.toThrow();
  });
});
```

### API Testing

**Test: Stripe Checkout**

```javascript
// functions/test/checkout.test.js

import { describe, it, expect, beforeAll } from 'vitest';
import { createCheckoutSession } from '../payments/createCheckoutSession';
import { testEnv } from './setup';

describe('Create Checkout Session', () => {
  let wrapped;

  beforeAll(() => {
    wrapped = testEnv.wrap(createCheckoutSession);
  });

  it('creates checkout session successfully', async () => {
    const data = {
      priceId: 'price_monthly',
      userId: 'user123'
    };

    const result = await wrapped({ data }, {
      auth: { uid: 'user123' }
    });

    expect(result).toHaveProperty('sessionId');
    expect(result).toHaveProperty('url');
  });

  it('rejects unauthorized requests', async () => {
    const data = {
      priceId: 'price_monthly',
      userId: 'user123'
    };

    await expect(
      wrapped({ data }, { auth: null })
    ).rejects.toThrow('Unauthenticated');
  });
});
```

---

## End-to-End Testing

### Playwright Setup

```javascript
// playwright.config.js

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

### E2E Test Example

**Test: Complete Interview Flow**

```javascript
// e2e/interview-flow.spec.js

import { test, expect } from '@playwright/test';

test.describe('Interview Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('complete interview session', async ({ page }) => {
    // Start interview
    await page.click('text=Start New Interview');
    await expect(page).toHaveURL('/interview');

    // Wait for problem to load
    await expect(page.locator('.problem-title')).toBeVisible();

    // Write code
    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.type('def solution(nums):\n    return sum(nums)');

    // Run tests
    await page.click('text=Run Tests');

    // Wait for results
    await expect(page.locator('.test-results')).toBeVisible();

    // End session
    await page.click('text=End Session');
    await page.click('text=Yes'); // Confirm dialog

    // Verify redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('use AI chat during interview', async ({ page }) => {
    await page.goto('/interview');

    // Send message to AI
    const chatInput = page.locator('[placeholder*="Ask"]');
    await chatInput.fill('Can you give me a hint?');
    await chatInput.press('Enter');

    // Wait for AI response
    await expect(page.locator('.ai-message')).toBeVisible();

    // Verify hint appears
    const aiMessage = await page.locator('.ai-message').last().textContent();
    expect(aiMessage.length).toBeGreaterThan(0);
  });
});
```

---

## Running Tests

### Run Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific file
npm test src/components/Subscription/PricingCard.test.jsx
```

### Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e interview-flow.spec.js
```

### Run Firebase Tests

```bash
# Test Firestore rules
firebase emulators:exec --only firestore \"npm run test:rules\"

# Test Cloud Functions
npm run test:functions
```

---

## Best Practices

### Writing Good Tests

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Arrange, Act, Assert pattern**
4. **One assertion per test (when possible)**
5. **Mock external dependencies**
6. **Test edge cases**
7. **Keep tests independent**

### Coverage Guidelines

Focus on:
- Critical business logic
- User-facing features
- Error handling
- Edge cases

Don't obsess over 100% coverage for:
- Simple presentational components
- Third-party library wrappers
- Configuration files

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

      - name: Run E2E tests
        run: npx playwright install && npm run test:e2e
```

---

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout in config
- Check for unresolved promises
- Mock slow operations

**Flaky tests**
- Add proper waits
- Avoid hard-coded delays
- Mock time-dependent code

**Firebase emulator issues**
- Ensure emulators are running
- Check port conflicts
- Clear emulator data

---

**Happy Testing! 🧪**
