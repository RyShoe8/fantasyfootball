/**
 * Roster Type Declarations
 */

import { SleeperRoster } from './sleeper';
import { ApiError } from './api';

export interface RosterState {
  rosters: SleeperRoster[];
  loading: boolean;
  error: ApiError | null;
}

export interface RosterContextType extends RosterState {
  setRosters: (rosters: SleeperRoster[]) => void;
  refreshRosters: (leagueId: string) => Promise<void>;
} 