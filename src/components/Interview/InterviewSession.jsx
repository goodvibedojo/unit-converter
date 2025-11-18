import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
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
import { Button, Badge, Modal, Tooltip, Spinner } from '../common';

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
  const [showEndModal, setShowEndModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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
      setIsInitializing(true);

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
    } finally {
      setIsInitializing(false);
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

  // Get status color
  const getStatusBadge = () => {
    if (testResults) {
      const passRate = (testResults.passed / testResults.total) * 100;
      if (passRate === 100) return <Badge variant="success">All Tests Passed</Badge>;
      if (passRate >= 50) return <Badge variant="warning">Partially Passing</Badge>;
      return <Badge variant="danger">Tests Failing</Badge>;
    }
    return <Badge variant="default">Not Tested</Badge>;
  };

  // Show loading state
  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Spinner size="xl" text="Initializing interview session..." centered />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Mock Interview</h1>
            {problem && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-700">
                  {problem.title}
                </span>
                <Badge
                  variant={
                    problem.difficulty === 'easy' ? 'success' :
                    problem.difficulty === 'medium' ? 'warning' : 'danger'
                  }
                  size="sm"
                >
                  {problem.difficulty}
                </Badge>
                {getStatusBadge()}
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <Tooltip content="Elapsed time" position="bottom">
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono text-lg font-semibold text-gray-900">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            </Tooltip>

            {/* Language Selector */}
            <LanguageSelector language={language} onChange={handleLanguageChange} />

            {/* Run Button */}
            <Button
              variant="success"
              size="md"
              onClick={handleRunCode}
              disabled={isRunning}
              loading={isRunning}
              icon={<span>▶️</span>}
            >
              Run Code
            </Button>

            {/* Submit Button */}
            <Tooltip content="Run all test cases" position="bottom">
              <Button
                variant="primary"
                size="md"
                onClick={handleRunTests}
                disabled={isRunning}
              >
                Submit
              </Button>
            </Tooltip>

            {/* End Session */}
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowEndModal(true)}
            >
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Description */}
        <div className="w-1/4 overflow-hidden border-r border-gray-200 bg-white">
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
            <div className="flex-1 bg-gray-900">
              <Terminal
                output={terminalOutput}
                isRunning={isRunning}
                onClear={() => setTerminalOutput([])}
              />
            </div>
            <div className="w-1/2 border-l border-gray-200 bg-white">
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
        <div className="w-1/4 bg-white border-l border-gray-200">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isAITyping={isAITyping}
          />
        </div>
      </div>

      {/* End Session Modal */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="End Interview Session"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowEndModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to end this interview session? Your progress will be saved, but you won't be able to continue this session later.
        </p>
        {testResults && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Current Progress:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Tests Passed: {testResults.passed}/{testResults.total}
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Time Spent: {formatTime(elapsedTime)}
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
