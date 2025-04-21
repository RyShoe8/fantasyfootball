import { SleeperPlayer } from './sleeper';

export interface PlayerStats {
  pts_ppr?: number;
  pts_half_ppr?: number;
  pts_std?: number;
  projected_pts?: number;
  [key: string]: any;
}

export interface PlayerState {
  players: Record<string, SleeperPlayer>;
  playerStats: Record<string, PlayerStats>;
  loading: boolean;
  error: Error | null;
}

export interface PlayerContextType extends PlayerState {
  setPlayers: (players: Record<string, SleeperPlayer>) => void;
  fetchPlayerStats: (year: string, week: number) => Promise<void>;
} 