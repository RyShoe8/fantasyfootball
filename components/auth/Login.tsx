/**
 * Login Component
 * 
 * Handles user authentication through the Sleeper API.
 * Provides a form for username input and manages login state.
 */

import React from 'react';
import { useAuth } from '../../contexts';
import { useRouter } from 'next/router';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[Login]', ...args);
  }
};

export default function Login() {
  const [username, setUsername] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const { login, error: contextError, user, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // If user is already logged in, redirect to home
    if (isAuthenticated) {
      debugLog('User already authenticated, redirecting to home:', user);
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  React.useEffect(() => {
    // Update local error state when context error changes
    if (contextError) {
      debugLog('Context error received:', contextError);
      setLocalError(contextError.message);
    }
  }, [contextError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      debugLog('Empty username submitted');
      setLocalError('Please enter a username');
      return;
    }
    
    debugLog('Attempting to login with username:', trimmedUsername);
    setIsLoading(true);
    setLocalError(null);
    
    try {
      debugLog('Calling login function...');
      await login(trimmedUsername);
      
      // Check if there's an error in the context
      if (!contextError) {
        debugLog('Login successful, redirecting to home');
        router.push('/');
      } else {
        debugLog('Login failed with context error:', contextError);
        setLocalError(contextError.message);
      }
    } catch (err) {
      debugLog('Login failed with error:', err);
      setLocalError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      debugLog('Login attempt completed');
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    debugLog('Username input changed:', newUsername);
    setUsername(newUsername);
    // Clear error when user starts typing
    if (localError) {
      setLocalError(null);
    }
  };

  debugLog('Rendering login form:', {
    isLoading,
    hasError: !!localError,
    isAuthenticated
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">🏈 Fantasy OS</span>
          </div>
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Sign in to your Sleeper account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your Sleeper username to get started
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Sleeper Username"
                value={username}
                onChange={handleUsernameChange}
                aria-invalid={!!localError}
                aria-describedby={localError ? "error-message" : undefined}
                autoComplete="username"
              />
            </div>
          </div>

          {localError && (
            <div 
              id="error-message"
              role="alert"
              className="text-red-500 text-sm text-center"
            >
              {localError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
              aria-disabled={isLoading || !username.trim()}
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 