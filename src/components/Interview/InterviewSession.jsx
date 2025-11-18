import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getRandomProblem } from '../../utils/problemBank';
import openAIService from '../../services/openai';
import codeExecutionService from '../../services/codeExecution';
import CodeEditor from '../Editor/CodeEditor';
import LanguageSelector from '../Editor/LanguageSelector';
import Terminal from '../Terminal/Terminal';
import ChatInterface from './ChatInterface';
import ProblemDisplay from './ProblemDisplay';
import TestCasePanel from '../TestCases/TestCasePanel';

export default function InterviewSession() {
  const { currentUser, userProfile, canStartInterview } = useAuth();
  const navigate = useNavigate();

  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Check if user can start interview
  useEffect(() => {
    if (!canStartInterview()) {
      navigate('/dashboard');
    }
  }, [canStartInterview, navigate]);

  // Initialize interview session
  useEffect(() => {
    initializeSession();
  }, []);

  // Timer
  useEffect(() => {
    if (sessionStartTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionStartTime]);

  async function initializeSession() {
    try {
      // Get a random problem
      const selectedProblem = getRandomProblem('easy'); // Start with easy for demo
      setProblem(selectedProblem);

      // Set starter code
      const starterCode = selectedProblem.starterCode[language] || '';
      setCode(starterCode);

      // Create session in Firestore
      const newSessionId = `session_${Date.now()}_${currentUser.uid}`;
      const sessionData = {
        id: newSessionId,
        userId: currentUser.uid,
        problemId: selectedProblem.id,
        startTime: new Date(),
        code: starterCode,
        language: language,
        chatHistory: [],
        testResults: null,
        completed: false
      };

      await setDoc(doc(db, 'sessions', newSessionId), sessionData);
      setSessionId(newSessionId);
      setSessionStartTime(Date.now());

      // Initialize AI interviewer
      const aiIntroMessage = openAIService.initializeInterview(
        `${selectedProblem.title}\n\n${selectedProblem.description}`
      );

      const initialMessages = [
        {
          role: 'assistant',
          content: aiIntroMessage,
          timestamp: new Date()
        }
      ];

      setMessages(initialMessages);

      // Save to Firestore
      await updateDoc(doc(db, 'sessions', newSessionId), {
        chatHistory: initialMessages
      });
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }

  // Handle code changes
  const handleCodeChange = async (newCode) => {
    setCode(newCode);

    // Auto-save to Firestore with debouncing
    if (sessionId) {
      // In production, use debouncing to reduce writes
      await updateDoc(doc(db, 'sessions', sessionId), {
        code: newCode,
        lastUpdated: new Date()
      });
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    // Update starter code for new language
    if (problem && problem.starterCode[newLanguage]) {
      setCode(problem.starterCode[newLanguage]);
    }
  };

  // Handle sending chat message
  const handleSendMessage = async (userMessage) => {
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsAITyping(true);

    try {
      // Send to AI with code context
      const aiResponse = await openAIService.sendMessage(userMessage, code);

      const aiMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save to Firestore
      if (sessionId) {
        await updateDoc(doc(db, 'sessions', sessionId), {
          chatHistory: [...messages, newUserMessage, aiMessage]
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAITyping(false);
    }
  };

  // Handle running code
  const handleRunCode = async () => {
    setIsRunning(true);
    setTerminalOutput([{ type: 'info', text: '$ Running code...' }]);

    try {
      const result = await codeExecutionService.executePython(code);

      if (result.error) {
        setTerminalOutput(prev => [
          ...prev,
          { type: 'error', text: `Error: ${result.error}` }
        ]);
      } else {
        setTerminalOutput(prev => [
          ...prev,
          { type: 'output', text: result.output },
          {
            type: 'info',
            text: `Execution completed in ${Math.round(result.executionTime)}ms`
          }
        ]);
      }
    } catch (error) {
      setTerminalOutput(prev => [
        ...prev,
        { type: 'error', text: `Error: ${error.message}` }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle running tests
  const handleRunTests = async () => {
    if (!problem || !problem.testCases) return;

    setIsRunning(true);
    setTerminalOutput([{ type: 'info', text: '$ Running test cases...' }]);

    try {
      const results = await codeExecutionService.runTestCases(
        code,
        problem.testCases,
        language
      );

      setTestResults(results);

      setTerminalOutput(prev => [
        ...prev,
        {
          type: results.passed === results.total ? 'output' : 'error',
          text: `Tests: ${results.passed}/${results.total} passed (${Math.round(results.score)}%)`
        }
      ]);

      // Save results to Firestore
      if (sessionId) {
        await updateDoc(doc(db, 'sessions', sessionId), {
          testResults: results
        });
      }
    } catch (error) {
      setTerminalOutput(prev => [
        ...prev,
        { type: 'error', text: `Error running tests: ${error.message}` }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle ending session
  const handleEndSession = async () => {
    if (
      !window.confirm(
        'Are you sure you want to end this interview session? Your progress will be saved.'
      )
    ) {
      return;
    }

    try {
      if (sessionId) {
        await updateDoc(doc(db, 'sessions', sessionId), {
          endTime: new Date(),
          completed: true,
          finalCode: code
        });
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Format elapsed time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Mock Interview</h1>
            {problem && (
              <span className="text-sm text-gray-600">
                {problem.title}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-lg font-semibold text-gray-900">
                {formatTime(elapsedTime)}
              </span>
            </div>

            {/* Language Selector */}
            <LanguageSelector language={language} onChange={handleLanguageChange} />

            {/* Run Button */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>▶️</span>
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>

            {/* End Session */}
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Description */}
        <div className="w-1/4 overflow-hidden border-r border-gray-200">
          <ProblemDisplay problem={problem} />
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <CodeEditor
              code={code}
              language={language}
              onChange={handleCodeChange}
              theme="vs-dark"
            />
          </div>

          {/* Bottom: Terminal and Test Cases */}
          <div className="h-64 flex border-t border-gray-200">
            <div className="flex-1">
              <Terminal
                output={terminalOutput}
                isRunning={isRunning}
                onClear={() => setTerminalOutput([])}
              />
            </div>
            <div className="w-1/2 border-l border-gray-200">
              <TestCasePanel
                testCases={problem?.testCases}
                testResults={testResults}
                onRunTests={handleRunTests}
                isRunning={isRunning}
              />
            </div>
          </div>
        </div>

        {/* Right: AI Chat */}
        <div className="w-1/4">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isAITyping={isAITyping}
          />
        </div>
      </div>
    </div>
  );
}
