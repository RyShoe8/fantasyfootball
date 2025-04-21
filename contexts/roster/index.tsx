/**
 * RosterContext
 * 
 * Handles roster-related state and operations for the Sleeper API.
 * This context is responsible for:
 * - Managing roster data
 * - Fetching rosters for a league
 * - Caching roster information
 */

import React, { createContext, useContext, useState } from 'react';
import type { RosterContextType, RosterState } from '../../types/roster';
import { Roster } from '../../types/sleeper';
import axios from 'axios';

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RosterState>({
    rosters: [],
    loading: false,
    error: null
  });

  const setRosters = (rosters: Roster[]) => {
    setState(prev => ({ ...prev, rosters }));
  };

  const refreshRosters = async (leagueId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
      const rosters: Roster[] = response.data;
      setState(prev => ({ ...prev, rosters, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch rosters')
      }));
    }
  };

  return (
    <RosterContext.Provider value={{
      ...state,
      setRosters,
      refreshRosters
    }}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const context = useContext(RosterContext);
  if (context === undefined) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
} 