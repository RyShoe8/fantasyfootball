/**
 * Player Type Declarations
 */

import { SleeperPlayer, PlayerStats } from './sleeper';
import { ApiError } from './api';

export interface PlayerState {
  players: Record<string, SleeperPlayer>;
  playerStats: Record<string, PlayerStats>;
  loading: boolean;
  error: ApiError | null;
}

export interface PlayerContextType extends PlayerState {
  setPlayers: (players: Record<string, SleeperPlayer>) => void;
  fetchPlayerStats: (year: string, week: number) => Promise<void>;
} 