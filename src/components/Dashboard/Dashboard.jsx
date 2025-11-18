import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';
import { Card, Button, Badge, Spinner, Alert } from '../common';

export default function Dashboard() {
  const { currentUser, userProfile, canStartInterview, getRemainingTrialSessions } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserSessions();
  }, [currentUser]);

  async function fetchUserSessions() {
    if (!currentUser) return;

    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(
        sessionsRef,
        where('userId', '==', currentUser.uid),
        orderBy('startTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleStartInterview = () => {
    if (canStartInterview()) {
      navigate('/interview');
    } else {
      alert('Please subscribe to continue practicing interviews!');
      navigate('/pricing');
    }
  };

  const stats = {
    totalSessions: userProfile?.stats?.totalSessions || 0,
    problemsSolved: userProfile?.stats?.problemsSolved || 0,
    averageScore: userProfile?.stats?.averageScore || 0
  };

  return (
    <Layout showSidebar={true} maxWidth="7xl">
      {/* Trial Banner */}
      {userProfile?.subscriptionStatus === 'trial' && (
        <Alert variant="info" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Free Trial</h3>
              <p className="text-sm text-blue-700">
                {getRemainingTrialSessions()} free sessions remaining
              </p>
            </div>
            <Link to="/pricing">
              <Button variant="primary" size="sm">
                Upgrade Now
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Problems Solved</p>
              <p className="text-3xl font-bold text-gray-900">{stats.problemsSolved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(stats.averageScore)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Start Interview CTA */}
      <Card
        variant="default"
        padding="lg"
        className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">Ready to Practice?</h2>
            <p className="text-blue-100">
              Start a new AI-powered mock interview session
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleStartInterview}
            className="bg-white text-blue-600 hover:bg-gray-100 shadow-md whitespace-nowrap"
          >
            Start Interview
          </Button>
        </div>
      </Card>

      {/* Recent Sessions */}
      <Card
        title="Recent Sessions"
        variant="elevated"
        padding="none"
      >
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8">
              <Spinner centered size="lg" text="Loading sessions..." />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">No sessions yet. Start your first interview!</p>
              <Button variant="primary" onClick={handleStartInterview}>
                Start Now
              </Button>
            </div>
          ) : (
            <>
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        Problem: {session.problemId}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {session.startTime?.toDate().toLocaleDateString()} •{' '}
                        {session.language}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.testResults && (
                        <Badge variant="success" size="md">
                          {session.testResults.passed}/{session.testResults.total} passed
                        </Badge>
                      )}
                      <Link
                        to={`/session/${session.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {sessions.length > 5 && (
                <div className="px-6 py-4 bg-gray-50">
                  <Link
                    to="/history"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center"
                  >
                    View all {sessions.length} sessions →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </Layout>
  );
}
