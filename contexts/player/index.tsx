import React, { createContext, useContext, useState } from 'react';
import type { PlayerContextType, PlayerState, PlayerStats } from '../../types/player';
import { SleeperPlayer } from '../../types/sleeper';
import axios from 'axios';

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    players: {},
    playerStats: {},
    loading: false,
    error: null
  });

  const setPlayers = (players: Record<string, SleeperPlayer>) => {
    setState(prev => ({ ...prev, players }));
  };

  const fetchPlayerStats = async (year: string, week: number) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(`https://api.sleeper.app/v1/stats/nfl/regular/${year}/${week}`);
      const stats: Record<string, PlayerStats> = response.data;
      setState(prev => ({ ...prev, playerStats: stats, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch player stats')
      }));
    }
  };

  return (
    <PlayerContext.Provider value={{
      ...state,
      setPlayers,
      fetchPlayerStats
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
} 