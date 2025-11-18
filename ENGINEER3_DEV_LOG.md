# Engineer 3 开发日志 - AI Integration Specialist

**工程师**: Senior Engineer 3
**职责**: OpenAI 集成、AI 面试逻辑、Mock AI 服务
**开发周期**: Week 1 (Day 1-5)
**日期**: 2025-11-18

---

## 📋 任务概览

根据并行开发计划 (PARALLEL_DEVELOPMENT_PLAN.md),我的核心任务是:

### Week 1 任务
- [x] **Day 1-2**: OpenAI 集成设计
  - 设计 AI 面试官系统 prompt
  - 定义对话流程状态机
  - 设计上下文管理策略
  - 创建 prompt 模板库

- [x] **Day 3-4**: AI Service 实现
  - initializeInterview(problem)
  - sendMessage(userMessage, codeContext)
  - generateFeedback(session)
  - generateHint(codeState)

- [x] **Day 5**: Mock AI 响应系统
  - 规则引擎用于开发/测试
  - 预定义响应库
  - A/B 测试不同 prompt 策略

---

## 🏗️ 架构设计

### 系统组件

我设计并实现了以下核心组件:

```
src/services/
├── openai.js                    # 主服务(重构版)
├── interviewStateMachine.js     # 面试状态机(新)
├── promptTemplates.js           # Prompt 模板库(新)
└── mockAIEngine.js             # 智能 Mock AI 引擎(新)
```

### 1️⃣ 面试状态机 (Interview State Machine)

**文件**: `src/services/interviewStateMachine.js`

**设计理念**:
面试是一个有明确阶段的过程,AI 的行为应该根据不同阶段动态调整。

**状态定义**:
```javascript
INTRO         → 介绍问题
CLARIFICATION → 回答澄清问题
CODING        → 候选人编码中
STUCK         → 候选人卡住(3分钟无进展)
TESTING       → 运行测试
DEBUGGING     → 调试失败的测试
COMPLEXITY    → 讨论复杂度
OPTIMIZATION  → 讨论优化
FEEDBACK      → 最终反馈
```

**核心功能**:
- 自动检测状态转换(基于用户行为、代码变化、测试结果)
- 为每个阶段提供特定的系统指令
- 跟踪会话统计数据(代码改动次数、测试运行次数等)

**关键逻辑**:
```javascript
// 自动检测转换
if (code changed && length > 50) → CODING
if (no code changes for 3+ min) → STUCK
if (tests all pass) → COMPLEXITY
if (tests fail) → DEBUGGING
```

---

### 2️⃣ Prompt 模板库 (Prompt Templates)

**文件**: `src/services/promptTemplates.js`

**设计理念**:
不同场景需要不同的 prompt 策略。使用模板化方法可以:
- 统一管理所有 prompts
- 方便 A/B 测试不同策略
- 支持未来的多语言和个性化

**主要组件**:

1. **BASE_SYSTEM_PROMPT**: 基础系统 prompt
   - 定义 AI 的核心身份和原则
   - 适用于所有对话

2. **PHASE_PROMPTS**: 阶段特定指令
   - 每个面试阶段有专门的指令
   - 指导 AI 在该阶段的行为

3. **PromptBuilder**: 上下文感知的 prompt 构建器
   - `buildHintPrompt()` - 根据卡住时间和代码生成提示
   - `buildCodeReviewPrompt()` - 代码审查
   - `buildFeedbackPrompt()` - 综合反馈生成
   - `buildComplexityPrompt()` - 复杂度讨论

4. **RESPONSE_STYLES**: 响应风格配置
   - SUPPORTIVE - 适合初学者
   - PROFESSIONAL - 标准 FAANG 风格
   - CHALLENGING - 适合高级候选人

5. **FOLLOW_UP_QUESTIONS**: 常见跟进问题库
   - 按类别组织(复杂度、边界情况、代码质量等)

---

### 3️⃣ Mock AI 引擎 (Mock AI Engine)

**文件**: `src/services/mockAIEngine.js`

**设计理念**:
在开发阶段,我们需要一个智能的 Mock 系统来:
- 无需 API key 即可测试
- 节省开发成本
- 提供一致的响应用于测试
- 支持快速迭代

**核心功能**:

1. **意图检测 (Intent Detection)**
   ```javascript
   GREETING      - 问候
   READY         - 准备开始
   QUESTION_ASKING - 提问
   HINT_REQUEST  - 请求提示
   COMPLEXITY    - 讨论复杂度
   THINKING_ALOUD - 思考过程
   ```

2. **上下文感知响应**
   - 根据当前阶段 + 用户意图选择响应
   - 分析代码状态(是否有循环、函数、注释等)
   - 考虑对话历史长度

3. **智能提示生成**
   - 根据卡住时间渐进式给出提示
   - 使用问题的预定义 hints
   - 避免直接给出答案

4. **综合反馈评分**
   算法考虑多个因素:
   - 测试通过率(40分)
   - 代码质量(30分) - 是否有函数、注释等
   - 时间效率(30分) - 与预期时间对比

**响应示例**:
```javascript
// INTRO 阶段 + GREETING 意图
→ "Hello! Great to meet you. I'm excited to work through this problem with you today."

// STUCK 阶段 + HINT_REQUEST 意图
→ "I can see you're stuck. Let me help: have you thought about using a hash map?"
```

---

### 4️⃣ 重构的 OpenAI 服务

**文件**: `src/services/openai.js` (重构)

**主要改进**:

1. **集成状态机**
   ```javascript
   this.stateMachine = new InterviewStateMachine();
   // 自动追踪面试阶段,调整 AI 行为
   ```

2. **支持 Mock 和真实 API**
   ```javascript
   USE_MOCK_AI = true/false  // 环境变量控制
   ```

3. **上下文追踪**
   - 追踪代码变化
   - 记录最后编辑时间
   - 自动检测"卡住"状态

4. **增强的方法签名**
   ```javascript
   // 之前
   sendMessage(userMessage, codeContext)

   // 现在
   sendMessage(userMessage, codeContext, testResults)
   // 现在支持测试结果,触发状态转换
   ```

5. **新增方法**
   - `generateHint(code)` - 智能提示生成
   - `getCurrentPhase()` - 获取当前阶段
   - `getSessionStats()` - 会话统计
   - `updateTestResults(testResults)` - 手动更新测试结果

6. **改进的 initializeInterview**
   - 接受完整的 problem 对象(不只是描述)
   - 格式化问题展示(标题、难度、约束、示例)
   - 初始化所有追踪变量

---

## 🎯 设计决策

### 为什么使用状态机?

**问题**: 之前的实现使用简单的关键词匹配,无法理解对话的"上下文"和"进展"。

**解决方案**: 状态机让 AI 知道:
- 现在处于面试的哪个阶段
- 应该做什么(介绍、提示、评估等)
- 什么时候转换到下一阶段

**好处**:
- AI 行为更自然、更像真实面试官
- 避免不合时宜的响应(比如在用户刚开始编码时就讨论复杂度)
- 可以追踪面试进度

### 为什么需要 Prompt 模板库?

**问题**: Prompt 散落在代码各处,难以管理和优化。

**解决方案**: 集中式模板管理。

**好处**:
- 统一管理所有 prompts
- 方便 A/B 测试(比如测试不同的提示策略)
- 支持未来的多语言、个性化
- 更容易审查和改进 prompts

### 为什么需要智能 Mock AI?

**问题**:
- 每次测试都调用真实 API 成本太高
- 开发时可能没有 API key
- 真实 API 响应时间长,影响开发效率

**解决方案**: 规则引擎 + 上下文感知的 Mock 系统。

**好处**:
- 零成本开发和测试
- 响应快速且可预测
- 可以模拟各种场景(卡住、成功、失败等)
- 为真实 API 提供了 fallback

---

## 🔄 与其他工程师的协作

### 依赖关系

**我依赖**:
- Engineer 2: Firebase Cloud Functions 框架(用于部署 OpenAI 调用)
- Engineer 1: 前端组件调用我的服务

**阻塞**:
- 目前无阻塞 - 使用 Mock AI 可独立开发

### API 接口

为前端(Engineer 1)提供的接口:

```javascript
import openAIService from './services/openai.js';

// 初始化面试
const introMessage = openAIService.initializeInterview(problem);

// 发送消息
const response = await openAIService.sendMessage(
  "Can you clarify the constraints?",
  currentCode,
  testResults
);

// 请求提示
const hint = await openAIService.generateHint(currentCode);

// 生成反馈
const feedback = await openAIService.generateFeedback({
  code: finalCode,
  testResults: { passed: 3, total: 5 },
  duration: 1200000 // 20 minutes
});

// 获取当前阶段
const phase = openAIService.getCurrentPhase(); // "CODING", "STUCK", etc.

// 获取统计
const stats = openAIService.getSessionStats();
```

---

## 📊 测试策略

### Mock AI 测试覆盖

Mock AI 引擎覆盖以下场景:

1. **各种面试阶段**
   - ✅ INTRO - 问候、介绍
   - ✅ CLARIFICATION - 回答问题
   - ✅ CODING - 编码鼓励
   - ✅ STUCK - 提供提示
   - ✅ DEBUGGING - 调试指导
   - ✅ COMPLEXITY - 复杂度讨论
   - ✅ FEEDBACK - 综合反馈

2. **不同用户意图**
   - ✅ 问候
   - ✅ 提问
   - ✅ 请求帮助
   - ✅ 思考过程
   - ✅ 完成标志

3. **代码状态识别**
   - ✅ 无代码
   - ✅ 有循环
   - ✅ 有函数
   - ✅ 有注释
   - ✅ 复杂度估算

### 状态转换测试

需要测试的转换:
- [x] 用户开始编码 → CODING
- [x] 3分钟无代码变化 → STUCK
- [x] 所有测试通过 → COMPLEXITY
- [x] 测试失败 → DEBUGGING
- [x] 手动结束 → FEEDBACK

---

## 🚀 未来改进 (Week 2-3)

### Week 2 任务

1. **上下文感知逻辑增强**
   - 分析代码模式(检测常见错误)
   - 识别用户是否理解问题
   - 检测代码质量问题

2. **AI 面试流程引擎完善**
   - 实现更智能的状态转换触发器
   - 添加时间管理(45分钟面试倒计时)
   - 支持多轮提示(渐进式提示)

3. **反馈生成器改进**
   - 使用真实 OpenAI API 生成深度反馈
   - 解析 AI 响应为结构化数据
   - 添加评分标准(问题理解、代码质量、沟通等)

### Week 3 任务 (Voice Integration)

1. **语音转文字 (Whisper API)**
   - 录音功能集成
   - 上传音频到 Firebase Storage
   - 调用 Whisper API
   - 返回转录文本

2. **文字转语音 (TTS API)**
   - 接收 AI 文本响应
   - 调用 OpenAI TTS API
   - 缓存音频文件
   - 返回音频 URL

3. **语音工作流**
   ```
   用户说话 → 录音 → Whisper → 文本 → GPT-4 → TTS → 播放
   ```

---

## 📝 代码质量

### 代码规范

- ✅ 使用 ES6+ 语法
- ✅ 详细的 JSDoc 注释
- ✅ 清晰的函数命名
- ✅ 模块化设计(每个文件单一职责)

### 设计模式

- **状态机模式** - InterviewStateMachine
- **策略模式** - 不同的响应策略(SUPPORTIVE, PROFESSIONAL, CHALLENGING)
- **模板方法模式** - PromptBuilder
- **单例模式** - OpenAIService

---

## 💡 关键洞察

### 1. Mock First 开发

使用 Mock AI 允许我:
- 快速迭代 UI/UX
- 无需等待真实 API
- 节省开发成本
- 提供稳定的测试环境

### 2. 状态机的价值

状态机不仅仅是技术实现,它反映了:
- 真实面试的流程
- AI 应该如何"思考"当前情况
- 何时提供帮助,何时保持安静

### 3. Prompt Engineering 是核心

好的 Prompt 设计直接影响:
- AI 响应质量
- 用户体验
- 面试真实感

花时间设计和测试不同的 prompt 策略是值得的。

---

## 🔧 环境配置

### 环境变量

在 `.env` 文件中添加:

```env
# OpenAI 配置
VITE_OPENAI_API_KEY=sk-your-api-key-here
VITE_USE_MOCK_AI=true  # 开发时设为 true,生产时设为 false

# 可选配置
VITE_OPENAI_MODEL=gpt-4  # 或 gpt-3.5-turbo
```

### 切换 Mock/Real AI

```javascript
// 开发模式 - 使用 Mock AI
VITE_USE_MOCK_AI=true

// 生产模式 - 使用真实 OpenAI API
VITE_USE_MOCK_AI=false
```

---

## 📈 性能考虑

### Mock AI
- ⚡ 响应时间: ~800-1500ms (模拟延迟)
- 💰 成本: $0
- 🎯 准确性: 规则驱动,一致但有限

### Real OpenAI API
- ⚡ 响应时间: ~2-5秒
- 💰 成本: ~$0.02-0.05 per request (GPT-4)
- 🎯 准确性: 高度灵活,理解上下文

### 优化策略
- 使用 GPT-3.5-turbo 降低成本(~10x cheaper)
- 缓存常见问题的响应
- 使用 streaming 改善感知延迟
- Rate limiting 防止滥用

---

## ✅ 完成的交付物

- [x] **面试状态机** - `interviewStateMachine.js`
- [x] **Prompt 模板库** - `promptTemplates.js`
- [x] **Mock AI 引擎** - `mockAIEngine.js`
- [x] **重构的 OpenAI 服务** - `openai.js`
- [x] **开发文档** - 本文档

---

## 🎓 经验总结

### 成功之处

1. **架构清晰**: 每个组件职责明确,易于维护
2. **可测试性强**: Mock AI 让测试变得简单
3. **扩展性好**: 添加新的面试阶段或响应策略很容易
4. **向后兼容**: 保留了旧接口,不影响现有代码

### 可以改进的地方

1. **状态转换触发**: 可以更智能(使用代码静态分析)
2. **Prompt 版本管理**: 需要系统化的 A/B 测试框架
3. **错误处理**: 需要更健壮的错误恢复机制
4. **性能监控**: 添加详细的日志和指标追踪

---

## 📚 参考资料

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [State Machine Pattern](https://refactoring.guru/design-patterns/state)
- [PARALLEL_DEVELOPMENT_PLAN.md](./PARALLEL_DEVELOPMENT_PLAN.md)
- [PRODUCT_PLAN.md](./PRODUCT_PLAN.md)

---

**下一步**:
- 与 Engineer 1 协调前端集成
- 准备 Week 2 的深度功能实现
- 开始规划 Week 3 的语音功能

**状态**: ✅ Week 1 任务全部完成,准备进入 Week 2

---

*最后更新: 2025-11-18*
*Engineer 3: AI Integration Specialist*
