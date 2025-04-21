import React from 'react';
import type { LeagueContextType, LeagueState } from '../../types/league';
import { SleeperLeague, SleeperUser } from '../../types/sleeper';
import axios from 'axios';

const LeagueContext = React.createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<LeagueState>({
    currentLeague: null,
    leagues: [],
    users: [],
    selectedYear: new Date().getFullYear().toString(),
    selectedWeek: 1,
    loading: false,
    error: null
  });

  const setUsers = (users: SleeperUser[]) => {
    setState((prev: LeagueState) => ({ ...prev, users }));
  };

  const setCurrentLeague = (league: SleeperLeague | null) => {
    setState((prev: LeagueState) => ({ ...prev, currentLeague: league }));
  };

  const setSelectedYear = (year: string) => {
    setState((prev: LeagueState) => ({ ...prev, selectedYear: year }));
  };

  const setSelectedWeek = (week: number) => {
    setState((prev: LeagueState) => ({ ...prev, selectedWeek: week }));
  };

  const refreshLeague = async (leagueId: string) => {
    try {
      setState((prev: LeagueState) => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}`);
      const league: SleeperLeague = response.data;
      setState((prev: LeagueState) => ({ ...prev, currentLeague: league, loading: false }));
    } catch (error) {
      setState((prev: LeagueState) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch league')
      }));
    }
  };

  const fetchLeagues = async (userId: string) => {
    try {
      setState((prev: LeagueState) => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${state.selectedYear}`);
      const leagues: SleeperLeague[] = response.data;
      setState((prev: LeagueState) => ({ ...prev, leagues, loading: false }));
    } catch (error) {
      setState((prev: LeagueState) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch leagues')
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
      refreshLeague,
      fetchLeagues
    }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = React.useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
} 