import React, { createContext, useContext, useState } from 'react';
import type { LeagueContextType, LeagueState } from '../../types/league';
import { SleeperLeague, SleeperUser } from '../../types/sleeper';
import axios from 'axios';

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LeagueState>({
    currentLeague: null,
    users: [],
    selectedYear: new Date().getFullYear().toString(),
    selectedWeek: 1,
    loading: false,
    error: null
  });

  const setUsers = (users: SleeperUser[]) => {
    setState(prev => ({ ...prev, users }));
  };

  const setCurrentLeague = (league: SleeperLeague | null) => {
    setState(prev => ({ ...prev, currentLeague: league }));
  };

  const setSelectedYear = (year: string) => {
    setState(prev => ({ ...prev, selectedYear: year }));
  };

  const setSelectedWeek = (week: number) => {
    setState(prev => ({ ...prev, selectedWeek: week }));
  };

  const refreshLeague = async (leagueId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}`);
      const league: SleeperLeague = response.data;
      setState(prev => ({ ...prev, currentLeague: league, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch league')
      }));
    }
  };

  return (
    <LeagueContext.Provider value={{
      ...state,
      setUsers,
      setCurrentLeague,
      setSelectedYear,
      setSelectedWeek,
      refreshLeague
    }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
} 