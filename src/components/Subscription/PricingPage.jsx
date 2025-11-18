// PricingPage Component
// Engineer 5 - Subscription Pricing Page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useSubscription from '../../hooks/useSubscription';
import useAnalytics from '../../hooks/useAnalytics';
import { getAllPlans, formatPrice, calculateMonthlyEquivalent } from '../../services/stripe';
import PricingCard from './PricingCard';

const PricingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { subscription, startCheckout, loading } = useSubscription();
  const { trackPageView } = useAnalytics();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = getAllPlans();

  // Track page view
  useState(() => {
    trackPageView('pricing', 'Pricing Page');
  }, []);

  const handleSelectPlan = async (planId) => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    setSelectedPlan(planId);

    try {
      await startCheckout(planId);
    } catch (error) {
      console.error('Checkout error:', error);
      setSelectedPlan(null);
      alert('Failed to start checkout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start practicing with AI-powered mock interviews. Get unlimited access to 100+ coding problems.
          </p>

          {/* Trial Info */}
          {subscription?.status === 'trial' && (
            <div className="mt-6 inline-block bg-green-100 text-green-800 px-6 py-3 rounded-lg">
              <p className="font-medium">
                🎉 You have {subscription.trialSessionsTotal - subscription.trialSessionsUsed} free trial sessions remaining
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onSelect={handleSelectPlan}
              isLoading={loading && selectedPlan === plan.id}
              isCurrentPlan={subscription?.plan === plan.id}
            />
          ))}
        </div>

        {/* Features Comparison */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What's Included
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <FeatureItem
              icon="✓"
              title="Unlimited Interview Sessions"
              description="Practice as much as you want with no restrictions"
            />
            <FeatureItem
              icon="🤖"
              title="AI-Powered Interviewer"
              description="GPT-4 powered interviewer that asks follow-up questions"
            />
            <FeatureItem
              icon="📚"
              title="100+ Coding Problems"
              description="Curated problems from Easy to Hard difficulty"
            />
            <FeatureItem
              icon="💻"
              title="Multi-Language Support"
              description="Python, JavaScript, Java, and more"
            />
            <FeatureItem
              icon="📊"
              title="Session Analytics"
              description="Track your progress and identify weak areas"
            />
            <FeatureItem
              icon="🎯"
              title="Test Case Validation"
              description="Automatic code testing with detailed feedback"
            />
            <FeatureItem
              icon="💬"
              title="Real-time Chat"
              description="Ask questions and get hints from AI"
            />
            <FeatureItem
              icon="🏢"
              title="Company-Tagged Problems"
              description="Practice problems from FAANG companies"
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <FAQItem
              question="Can I cancel anytime?"
              answer="Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
            />
            <FAQItem
              question="What happens after my trial?"
              answer="After using your 3 free trial sessions, you'll need to subscribe to continue. All your progress and history will be saved."
            />
            <FAQItem
              question="Which programming languages are supported?"
              answer="We currently support Python, JavaScript, and Java. More languages are coming soon!"
            />
            <FAQItem
              question="Can I upgrade from monthly to annual?"
              answer="Yes! You can upgrade anytime from your subscription settings, and we'll prorate the cost."
            />
          </div>
        </div>

        {/* Back to Dashboard */}
        {currentUser && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Feature Item Component
const FeatureItem = ({ icon, title, description }) => (
  <div className="flex items-start space-x-3">
    <span className="text-2xl flex-shrink-0">{icon}</span>
    <div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </div>
);

// FAQ Item Component
const FAQItem = ({ question, answer }) => (
  <details className="bg-white rounded-lg shadow p-4 cursor-pointer">
    <summary className="font-semibold text-gray-900 cursor-pointer">
      {question}
    </summary>
    <p className="mt-2 text-gray-600">{answer}</p>
  </details>
);

export default PricingPage;
