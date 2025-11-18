# Engineer 2 Development Log - Backend & Infrastructure

## 角色職責
作為 **Backend & Infrastructure Lead**,我的主要職責包括:
- Firebase 項目配置與管理
- Cloud Functions 開發
- Firestore 數據庫架構設計
- API 設計與實現
- 後端服務集成

## 開發時間線

### Week 1: 基礎設施搭建 (P0 - 阻塞其他工程師)

#### Day 1-2: Firebase 項目設置
**目標**: 建立 Firebase 基礎架構,讓其他工程師可以開始工作

**任務清單**:
- [x] 檢查現有 Firebase 配置 (src/services/firebase.js)
- [ ] 初始化 Firebase Functions 項目
- [ ] 配置 Firebase Emulator Suite (本地開發)
- [ ] 設置環境變量管理
- [ ] 配置 CORS 和安全設置

**當前發現**:
- 前端已經有基本的 Firebase 配置 (firebase.js)
- 使用環境變量管理配置
- 已安裝 firebase SDK (v12.6.0)
- 缺少 Firebase Functions 目錄結構

---

#### Day 3-4: Firestore 數據架構
**目標**: 定義所有數據模型和安全規則

**Collections 設計**:
```javascript
// 1. users/{userId}
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  subscriptionStatus: 'trial' | 'active' | 'inactive',
  trialSessionsUsed: number,
  trialSessionsTotal: number (default: 3),
  createdAt: timestamp,
  updatedAt: timestamp,
  stats: {
    totalSessions: number,
    problemsSolved: number,
    averageScore: number,
    totalTimeSpent: number (minutes),
    currentStreak: number
  },
  preferences: {
    theme: 'light' | 'dark',
    defaultLanguage: 'python' | 'javascript' | 'java',
    voiceEnabled: boolean
  }
}

// 2. sessions/{sessionId}
{
  id: string,
  userId: string,
  problemId: string,
  language: 'python' | 'javascript' | 'java',
  startTime: timestamp,
  endTime: timestamp | null,
  duration: number | null (minutes),
  status: 'active' | 'completed' | 'abandoned',
  code: string,
  codeHistory: [{
    timestamp: timestamp,
    code: string,
    action: 'edit' | 'run' | 'submit'
  }],
  chatHistory: [{
    role: 'user' | 'ai',
    content: string,
    timestamp: timestamp,
    audioUrl: string | null
  }],
  testResults: {
    passed: number,
    total: number,
    details: [{
      testId: string,
      passed: boolean,
      input: string,
      expectedOutput: string,
      actualOutput: string,
      error: string | null
    }]
  },
  aiScore: number | null (0-100),
  aiFeedback: {
    overall: string,
    strengths: string[],
    improvements: string[],
    complexity: {
      time: string,
      space: string
    }
  } | null,
  metadata: {
    ipAddress: string,
    userAgent: string
  }
}

// 3. problems/{problemId}
{
  id: string,
  title: string,
  slug: string,
  difficulty: 'easy' | 'medium' | 'hard',
  category: string[], // ['array', 'hash-table', 'two-pointers']
  companyTags: string[], // ['google', 'amazon', 'meta']
  description: string,
  constraints: string[],
  examples: [{
    input: string,
    output: string,
    explanation: string
  }],
  starterCode: {
    python: string,
    javascript: string,
    java: string
  },
  testCases: [{
    id: string,
    input: string,
    expectedOutput: string,
    isHidden: boolean,
    weight: number // for scoring
  }],
  hints: string[],
  officialSolution: string | null,
  stats: {
    totalAttempts: number,
    successRate: number,
    averageTime: number
  },
  createdAt: timestamp,
  updatedAt: timestamp
}

// 4. subscriptions/{subscriptionId}
{
  id: string,
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  plan: 'monthly' | 'annual',
  status: 'active' | 'canceled' | 'past_due' | 'trialing',
  currentPeriodStart: timestamp,
  currentPeriodEnd: timestamp,
  cancelAtPeriodEnd: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Security Rules 設計**: (firestore.rules)

---

#### Day 5: Cloud Functions 框架
**目標**: 創建可擴展的 Cloud Functions 架構

**Functions 結構**:
```
functions/
├── index.js                    # Main exports
├── package.json
├── .eslintrc.js
├── auth/
│   ├── onUserCreate.js        # Trigger: 用戶創建時初始化 profile
│   ├── onUserDelete.js        # Trigger: 清理用戶數據
│   └── updateUserProfile.js   # HTTP: 更新用戶資料
├── interviews/
│   ├── startSession.js        # HTTP: 初始化面試會話
│   ├── saveProgress.js        # HTTP: 自動保存代碼
│   ├── endSession.js          # HTTP: 結束會話並生成反饋
│   ├── getSessionHistory.js   # HTTP: 獲取用戶歷史
│   ├── chatWithAI.js          # HTTP: AI 對話接口
│   └── executeCode.js         # HTTP: 代碼執行
├── problems/
│   ├── getRandomProblem.js    # HTTP: 按難度獲取隨機題目
│   ├── getProblemsByCategory.js # HTTP: 按分類獲取題目
│   └── seedProblems.js        # HTTP: 初始化題庫 (admin only)
├── payments/
│   ├── createCheckoutSession.js # HTTP: Stripe checkout
│   ├── webhookHandler.js      # HTTP: Stripe webhooks
│   └── cancelSubscription.js  # HTTP: 取消訂閱
└── utils/
    ├── middleware.js          # Auth, CORS, validation
    ├── validators.js          # Input validation
    └── mockAI.js             # Mock AI responses for dev
```

---

### Week 2: 核心 API 開發

#### Day 1-2: 認證 Cloud Functions
- [ ] onUserCreate trigger
- [ ] updateUserProfile HTTP function
- [ ] deleteUserAccount HTTP function

#### Day 2-3: 會話管理 Functions
- [ ] startSession (初始化面試)
- [ ] saveSessionProgress (自動保存)
- [ ] endSession (生成反饋)
- [ ] getSessionHistory

#### Day 3-4: 問題庫 Functions
- [ ] getRandomProblem
- [ ] getProblemsByCategory
- [ ] seedProblemDatabase

#### Day 4-5: 實時同步
- [ ] Firestore listeners 設置
- [ ] 代碼自動保存 (debounce 500ms)
- [ ] 聊天消息實時同步

---

## 技術決策記錄

### Decision 1: Mock AI Service
**問題**: 開發階段需要 AI 功能但不想每次都調用 OpenAI API (成本和速度)

**解決方案**: 創建 Mock AI Service
- 規則引擎識別常見問題類型
- 預定義響應庫
- 開發環境自動使用 mock
- 生產環境切換到真實 OpenAI

**實現**: functions/utils/mockAI.js

---

### Decision 2: Code Execution Strategy
**問題**: 需要安全執行用戶代碼

**階段性方案**:
- **Phase 1 (MVP)**: Judge0 API (快速集成,有限控制)
- **Phase 2 (生產)**: 自建 Docker Sandbox (完全控制,更安全)

**當前選擇**: Judge0 API
- 優點: 快速開發, 無需管理基礎設施
- 缺點: 成本較高, 依賴第三方服務

---

### Decision 3: Real-time vs Polling
**問題**: 代碼同步和聊天消息更新機制

**選擇**: Firestore Real-time Listeners
- 優點: 即時更新, 無需輪詢
- 缺點: 連接成本 (可接受)

**實現**: onSnapshot listeners + debouncing

---

## API 設計規範

### 統一響應格式
```javascript
// Success
{
  success: true,
  data: {...},
  timestamp: "2025-01-15T10:30:00Z"
}

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input parameters",
    details: {...}
  },
  timestamp: "2025-01-15T10:30:00Z"
}
```

### 認證機制
- 所有 HTTP Functions 需要 Firebase Auth token
- 使用 middleware 驗證 token
- 從 token 提取 userId

### 速率限制
- 每用戶每小時 100 次請求
- 代碼執行: 每分鐘 10 次
- 使用 Firestore 計數器實現

---

## 開發日誌

### 2025-01-15 (Day 1 - Week 1)
**完成** ✅:
- ✅ 閱讀所有項目文檔 (PARALLEL_DEVELOPMENT_PLAN, README_INTERVIEW, PRODUCT_PLAN)
- ✅ 分析現有代碼結構
- ✅ 創建開發日誌和任務清單
- ✅ 初始化 Firebase Functions 項目結構
  - 創建 functions/ 目錄及子目錄 (auth, interviews, problems, payments, utils)
  - 創建 package.json 配置
  - 創建主 index.js 導出文件
- ✅ 實現工具函數
  - middleware.js (認證、CORS、速率限制、訂閱檢查)
  - validators.js (輸入驗證工具)
  - mockAI.js (開發用 Mock AI 服務)
- ✅ 實現認證 Cloud Functions (auth/)
  - onUserCreate.js (自動創建用戶 profile)
  - onUserDelete.js (清理用戶數據)
  - updateUserProfile.js (更新用戶資料)
- ✅ 實現會話管理 Cloud Functions (interviews/)
  - startSession.js (初始化面試會話)
  - saveProgress.js (自動保存代碼)
  - chatWithAI.js (AI 對話接口 - 使用 Mock AI)
  - executeCode.js (代碼執行 - 使用 Mock 執行)
  - endSession.js (結束會話並生成反饋)
  - getSessionHistory.js (獲取歷史記錄)
- ✅ 實現問題庫 Cloud Functions (problems/)
  - getRandomProblem.js (隨機獲取題目)
  - getProblemsByCategory.js (按分類獲取)
  - seedProblems.js (初始化題庫 - 包含 2 個示例題目)
- ✅ 創建支付 Cloud Functions 骨架 (payments/)
  - createCheckoutSession.js (Stripe checkout - 待實現)
  - webhookHandler.js (Stripe webhooks - 待實現)
  - cancelSubscription.js (取消訂閱 - 待實現)
- ✅ 編寫 Firestore Security Rules (firestore.rules)
  - 用戶只能讀寫自己的數據
  - 訂閱狀態保護
  - 問題庫只讀
- ✅ 創建 Firebase 配置文件
  - firebase.json (Functions, Hosting, Emulators)
  - firestore.indexes.json (複合索引)
  - .firebaserc (項目配置)
  - functions/.eslintrc.js (代碼規範)
- ✅ 編寫完整 API 文檔 (API_DOCUMENTATION.md)

**技術亮點**:
1. **Mock-First 開發**: 所有 AI 和代碼執行都有 Mock 實現,支持快速開發和測試
2. **統一響應格式**: 所有 API 使用一致的 success/error 格式
3. **完整的中間件**: 認證、速率限制、訂閱檢查都已實現
4. **安全優先**: Firestore security rules 完整,防止未授權訪問
5. **可擴展架構**: 清晰的目錄結構,易於添加新功能

**數據模型亮點**:
- Users: 包含統計數據、偏好設置、試用會話追蹤
- Sessions: 完整的代碼歷史、聊天記錄、測試結果
- Problems: 多語言支持、測試用例、提示系統
- 實現了連續簽到獎勵 (streak tracking)

**下一步 (Day 2)**:
- 測試 Firebase Functions (使用 Emulator)
- 前端集成測試
- 添加更多示例問題到 seedProblems
- 準備 Week 1 End 交付物檢查清單

**阻塞其他工程師的工作已完成**:
✅ Engineer 1 (Frontend) - 可以開始集成 API
✅ Engineer 3 (AI) - 可以使用 Cloud Functions 框架
✅ Engineer 4 (Code Execution) - 可以使用 Sessions schema
✅ Engineer 5 (Payments) - 可以使用 Subscriptions schema

---

## 遇到的問題與解決方案

### 問題記錄
_(將在開發過程中持續更新)_

---

## 代碼審查清單

在提交 PR 前檢查:
- [ ] 所有 functions 有適當的錯誤處理
- [ ] 輸入驗證完整
- [ ] 安全規則已測試
- [ ] API 文檔已更新
- [ ] 單元測試覆蓋率 >70%
- [ ] 環境變量已文檔化
- [ ] CORS 配置正確
- [ ] Rate limiting 已實現

---

## 性能優化筆記

### Firestore 優化
- 使用 composite indexes for complex queries
- 實現分頁 (limit + startAfter)
- 緩存常用數據 (problems)
- 批量寫入 (batch writes)

### Cloud Functions 優化
- Cold start 優化 (最小化依賴)
- 使用 global variables for reusable connections
- 實現 response caching
- 監控執行時間和內存使用

---

## 與其他工程師的協作

### Engineer 1 (Frontend) 依賴
- 需要我的 API 接口定義
- 需要 Firebase Auth 配置完成
- 需要 Firestore 結構文檔

### Engineer 3 (AI) 依賴
- 需要 Cloud Functions 框架
- 需要 Mock AI Service

### Engineer 4 (Code Execution) 依賴
- 需要 Cloud Functions 框架
- 需要 Sessions collection schema

### Engineer 5 (Payments) 依賴
- 需要 Cloud Functions 框架
- 需要 Subscriptions collection schema

**關鍵**: Week 1 的工作是 P0 優先級,阻塞所有其他工程師!

---

_此文檔將持續更新以記錄開發進度和技術決策_
