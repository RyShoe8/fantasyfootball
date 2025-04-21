import React from 'react';
import type { AuthContextType, AuthState } from '../../types/auth';
import { SleeperUser } from '../../types/sleeper';
import axios from 'axios';

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  // Handle initial loading state
  React.useEffect(() => {
    // Set loading to false after initial mount
    setState((prev: AuthState) => ({ ...prev, isLoading: false }));
  }, []);

  const login = async (username: string) => {
    try {
      setState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));
      const response = await axios.get(`https://api.sleeper.app/v1/user/${username}`);
      const user: SleeperUser = response.data;
      setState((prev: AuthState) => ({ ...prev, user, isLoading: false }));
    } catch (error) {
      setState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to login')
      }));
    }
  };

  const logout = () => {
    setState((prev: AuthState) => ({ ...prev, user: null }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.user }}>
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