/**
 * Auth Type Declarations
 */

import { SleeperUser } from './sleeper';
import { ApiError } from './api';

export interface AuthState {
  user: SleeperUser | null;
  isLoading: boolean;
  error: ApiError | null;
}

export interface AuthContextType extends AuthState {
  login: (username: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isHydrated: boolean;
} 