// ErrorBoundary Component
// Engineer 5 - Error Handling & Resilience

import { Component, useState, useCallback } from 'react';
import { trackError } from '../../services/analytics';

/**
 * Error Boundary to catch React component errors
 * Provides fallback UI and logs errors to analytics
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to analytics
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Track error in Firebase Analytics
    if (typeof trackError === 'function') {
      trackError({
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        errorBoundary: this.props.name || 'Unknown'
      });
    }

    // Store error details in state
    this.state = {
      hasError: true,
      error,
      errorInfo
    };
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // If onReset callback provided, call it
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {this.props.errorMessage ||
                'We encountered an unexpected error. Please try again or contact support if the problem persists.'}
            </p>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg">
                <details className="text-sm">
                  <summary className="font-semibold text-red-900 cursor-pointer mb-2">
                    Error Details (Dev Only)
                  </summary>
                  <div className="text-red-700 font-mono text-xs overflow-auto max-h-40">
                    <p className="font-bold mb-1">{this.state.error.toString()}</p>
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
              {this.props.showHomeButton !== false && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Go to Home
                </button>
              )}
            </div>

            {/* Support Link */}
            {this.props.showSupport !== false && (
              <div className="mt-6 text-center text-sm text-gray-500">
                Need help? <a href="mailto:support@example.com" className="text-blue-600 hover:underline">Contact Support</a>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


/**
 * Simple error fallback component
 * Can be used as custom fallback prop
 */
export function SimpleErrorFallback({ error, resetError }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">Something went wrong</h3>
          <p className="text-sm text-red-700 mb-3">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {resetError && (
            <button
              onClick={resetError}
              className="text-sm text-red-700 hover:text-red-900 font-medium underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * Hook to use error boundary in functional components
 * Provides error state and reset function
 */
export function useErrorHandler() {
  const [error, setError] = useState(null);

  const handleError = useCallback((err) => {
    setError(err);
    // Log to analytics
    if (typeof trackError === 'function') {
      trackError({
        error: err.toString(),
        source: 'useErrorHandler'
      });
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}
