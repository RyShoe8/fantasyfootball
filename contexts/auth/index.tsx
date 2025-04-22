import React from 'react';
import type { AuthContextType } from '../../types/auth';
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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  debugLog('Initializing AuthProvider');
  
  const [user, setUserState] = React.useState<SleeperUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Load user from localStorage on mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem('sleeperUser');
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('sleeperUser');
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage when it changes
  React.useEffect(() => {
    if (user) {
      localStorage.setItem('sleeperUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('sleeperUser');
    }
  }, [user]);

  const setUser = (newUser: SleeperUser | null) => {
    setUserState(newUser);
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem('sleeperUser');
  };

  const login = React.useCallback(async (username: string) => {
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('sleeperUser', JSON.stringify(dbUser));
        }
        return;
      }

      // If not in database, fetch from API
      debugLog('User not found in database, fetching from API');
      const userData = await UserApi.getUserByUsername(username);
      
      // Save to database
      await saveUserData(userData);
      
      // Update state and localStorage
      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sleeperUser', JSON.stringify(userData));
      }
      
      debugLog('Login successful');
    } catch (err) {
      debugLog('Login error:', err);
      setError(new Error('User not found. Please check your username and try again.'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = React.useMemo(() => ({
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  }), [user, isLoading, error, login, logout]);

  debugLog('AuthContext state:', {
    isAuthenticated: !!user,
    isLoading,
    hasError: !!error
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 