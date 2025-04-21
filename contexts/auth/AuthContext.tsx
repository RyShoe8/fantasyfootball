/**
 * AuthContext
 * 
 * Handles user authentication state and operations for the Sleeper API.
 * This context is responsible for:
 * - User login/logout
 * - Storing user data
 * - Managing authentication state
 * - Persisting user session
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SleeperUser } from '../../types/sleeper';
import { getUserData, saveUserData } from '../../lib/db';
import { UserApi } from '../../services/api';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[AuthContext]', ...args);
  }
};

interface AuthContextType {
  user: SleeperUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  debugLog('Initializing AuthProvider');
  
  const [user, setUser] = useState<SleeperUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing user session on mount
  React.useEffect(() => {
    debugLog('Checking for existing user session');
    const storedUser = localStorage.getItem('sleeperUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        debugLog('Found stored user:', parsedUser);
        setUser(parsedUser);
      } catch (err) {
        debugLog('Error parsing stored user:', err);
        localStorage.removeItem('sleeperUser');
      }
    }
  }, []);

  const login = useCallback(async (username: string) => {
    debugLog('Login attempt for username:', username);
    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch user from database first
      debugLog('Attempting to fetch user from database');
      const dbUser = await getUserData(username);
      
      if (dbUser) {
        debugLog('User found in database:', dbUser);
        setUser(dbUser);
        localStorage.setItem('sleeperUser', JSON.stringify(dbUser));
        setIsLoading(false);
        return;
      }

      // If not in database, fetch from API
      debugLog('User not found in database, fetching from API');
      const userData = await UserApi.getUserByUsername(username);
      
      debugLog('API response received:', userData);

      // Save to database
      debugLog('Saving user data to database');
      await saveUserData(userData);
      
      // Update state and localStorage
      debugLog('Updating state and localStorage');
      setUser(userData);
      localStorage.setItem('sleeperUser', JSON.stringify(userData));
      
      debugLog('Login successful');
    } catch (err) {
      debugLog('Login error:', err);
      setError('User not found. Please check your username and try again.');
      throw new Error('User not found. Please check your username and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    debugLog('Logging out user');
    setUser(null);
    localStorage.removeItem('sleeperUser');
    debugLog('Logout complete');
  }, []);

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  debugLog('AuthContext state:', {
    isAuthenticated: !!user,
    isLoading,
    error
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 