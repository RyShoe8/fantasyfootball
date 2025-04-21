import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthContextType, AuthState } from '../../types/auth';
import { SleeperUser } from '../../types/sleeper';
import axios from 'axios';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  const login = async (username: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await axios.get(`https://api.sleeper.app/v1/user/${username}`);
      const user: SleeperUser = response.data;
      setState(prev => ({ ...prev, user, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to login')
      }));
    }
  };

  const logout = () => {
    setState(prev => ({ ...prev, user: null }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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