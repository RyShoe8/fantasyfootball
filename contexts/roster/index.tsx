/**
 * RosterContext
 * 
 * Handles roster-related state and operations for the Sleeper API.
 * This context is responsible for:
 * - Managing roster data
 * - Fetching rosters for a league
 * - Caching roster information
 */

import React from 'react';
import { Roster } from '../../types/roster';
import { SleeperRoster } from '../../types/sleeper';
import { RosterApi } from '../../services/api/rosterApi';
import { ApiError } from '../../types/api';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility with consistent formatting
const debugLog = (action: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[RosterContext][${action}]`, ...args);
  }
};

interface RosterContextType {
  rosters: Roster[];
  loading: boolean;
  error: ApiError | null;
  refreshRosters: (leagueId: string) => Promise<void>;
}

const RosterContext = React.createContext<RosterContextType | undefined>(undefined);

export const useRoster = () => {
  const context = React.useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
};

interface RosterProviderProps {
  children: React.ReactNode;
}

export const RosterProvider = ({ children }: RosterProviderProps) => {
  const [rosters, setRosters] = React.useState<Roster[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<ApiError | null>(null);

  const refreshRosters = async (leagueId: string) => {
    debugLog('refreshRosters:start', 'leagueId:', leagueId);
    setLoading(true);
    setError(null);

    try {
      const sleeperRosters = await RosterApi.getRosters(leagueId);
      debugLog('refreshRosters:fetch', 'rosters:', sleeperRosters);

      // Convert SleeperRoster to Roster type
      const convertedRosters: Roster[] = sleeperRosters.map((sleeperRoster: SleeperRoster) => {
        debugLog('refreshRosters:transform', 'processing roster:', sleeperRoster.roster_id);
        
        const roster: Roster = {
          roster_id: sleeperRoster.roster_id,
          owner_id: sleeperRoster.owner_id,
          starters: sleeperRoster.starters,
          reserves: sleeperRoster.reserves,
          taxi: sleeperRoster.taxi || [],
          ir: [], // Sleeper API doesn't provide IR information
          players: sleeperRoster.players,
          metadata: {
            division: sleeperRoster.metadata?.division || '',
            streak: sleeperRoster.metadata?.streak || '',
            record: `${sleeperRoster.settings.wins}-${sleeperRoster.settings.losses}${sleeperRoster.settings.ties ? `-${sleeperRoster.settings.ties}` : ''}`,
            team_name: sleeperRoster.metadata?.team_name
          },
          settings: {
            wins: sleeperRoster.settings.wins,
            losses: sleeperRoster.settings.losses,
            ties: sleeperRoster.settings.ties,
            fpts: sleeperRoster.settings.fpts,
            fpts_decimal: sleeperRoster.settings.fpts_decimal,
            fpts_against: sleeperRoster.settings.fpts_against,
            fpts_against_decimal: sleeperRoster.settings.fpts_against_decimal,
            ppts: sleeperRoster.settings.ppts,
            ppts_decimal: sleeperRoster.settings.ppts_decimal,
            ppts_against: sleeperRoster.settings.ppts_against,
            ppts_against_decimal: sleeperRoster.settings.ppts_against_decimal
          }
        };

        debugLog('refreshRosters:transform', 'converted roster:', roster);
        return roster;
      });

      setRosters(convertedRosters);
      debugLog('refreshRosters:complete', 'total rosters:', convertedRosters.length);
    } catch (err) {
      const apiError = err as ApiError;
      debugLog('refreshRosters:error', 'error:', apiError);
      setError(apiError);
    } finally {
      setLoading(false);
      debugLog('refreshRosters:end');
    }
  };

  return (
    <RosterContext.Provider value={{ rosters, loading, error, refreshRosters }}>
      {children}
    </RosterContext.Provider>
  );
}; 