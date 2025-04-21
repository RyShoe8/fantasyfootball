/**
 * League Type Declarations
 */

import { SleeperLeague, SleeperUser } from './sleeper';
import { ApiError } from './api';

export interface LeagueState {
  currentLeague: SleeperLeague | null;
  leagues: SleeperLeague[];
  users: SleeperUser[];
  selectedYear: string;
  selectedWeek: number;
  loading: boolean;
  error: ApiError | null;
}

export interface LeagueContextType extends LeagueState {
  setUsers: (users: SleeperUser[]) => void;
  setCurrentLeague: (league: SleeperLeague | null) => void;
  setSelectedYear: (year: string) => void;
  setSelectedWeek: (week: number) => void;
  refreshLeague: (leagueId: string) => Promise<void>;
} 