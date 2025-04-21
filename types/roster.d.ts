/**
 * Roster Type Declarations
 */

import { Roster } from './sleeper';
import { ApiError } from './api';

export interface RosterState {
  rosters: Roster[];
  loading: boolean;
  error: ApiError | null;
}

export interface RosterContextType extends RosterState {
  setRosters: (rosters: Roster[]) => void;
  refreshRosters: (leagueId: string) => Promise<void>;
} 