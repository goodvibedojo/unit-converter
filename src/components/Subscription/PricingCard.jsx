// PricingCard Component
// Engineer 5 - Individual Pricing Card

import { formatPrice, calculateMonthlyEquivalent } from '../../services/stripe';

const PricingCard = ({ plan, onSelect, isLoading, isCurrentPlan }) => {
  const monthlyEquivalent = plan.id === 'annual'
    ? calculateMonthlyEquivalent(plan.price)
    : null;

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
        plan.popular ? 'ring-2 ring-indigo-600' : ''
      }`}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
          Most Popular
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 bg-green-600 text-white px-4 py-1 rounded-br-lg text-sm font-semibold">
          Current Plan
        </div>
      )}

      <div className="p-8">
        {/* Plan Name */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {plan.name}
        </h3>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-gray-900">
              {formatPrice(plan.price)}
            </span>
            <span className="text-gray-600 ml-2">/ {plan.interval}</span>
          </div>

          {/* Annual Savings */}
          {monthlyEquivalent && (
            <p className="text-sm text-gray-600 mt-2">
              {formatPrice(monthlyEquivalent)}/month when billed annually
              <span className="text-green-600 font-semibold ml-1">
                (Save ${plan.savings})
              </span>
            </p>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(plan.id)}
          disabled={isLoading || isCurrentPlan}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors mb-6 ${
            plan.popular
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-300'
          } disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            `Get Started with ${plan.name}`
          )}
        </button>

        {/* Features List */}
        <div className="space-y-3">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-700 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
