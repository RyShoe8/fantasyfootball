/**
 * PlayerContext
 * 
 * Handles player-related state and operations for the Sleeper API.
 * This context is responsible for:
 * - Managing player data
 * - Handling player stats
 * - Caching player information
 * - Managing player rankings
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SleeperPlayer } from '../../types/sleeper';
import { getPlayerData, savePlayerData } from '../../lib/db';
import { PlayerApi } from '../../services/api';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[PlayerContext]', ...args);
  }
};

interface PlayerContextType {
  players: Record<string, SleeperPlayer>;
  playerStats: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  setPlayers: (players: Record<string, SleeperPlayer>) => void;
  setPlayerStats: (stats: Record<string, any>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchPlayers: () => Promise<void>;
  fetchPlayerStats: (season: string, week: string) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  debugLog('Initializing PlayerProvider');

  const [players, setPlayers] = useState<Record<string, SleeperPlayer>>({});
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    debugLog('Fetching players');
    try {
      // Check if we have players in localStorage first
      const cachedPlayers = localStorage.getItem('sleeperPlayers');
      const cacheTimestamp = localStorage.getItem('sleeperPlayersTimestamp');
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      // Use cached data if it's less than a day old
      if (cachedPlayers && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_DAY) {
        debugLog('Using cached player data');
        const parsedPlayers = JSON.parse(cachedPlayers);
        if (Object.keys(parsedPlayers).length > 0) {
          setPlayers(parsedPlayers);
          return;
        }
        debugLog('Cached player data was empty, fetching fresh data');
      }

      debugLog('Fetching fresh player data');
      const playerData = await PlayerApi.getPlayers();
      
      // Validate player data
      if (!playerData || typeof playerData !== 'object' || Object.keys(playerData).length === 0) {
        debugLog('Invalid player data received:', playerData);
        throw new Error('Invalid player data received from API');
      }

      debugLog('Player data fetched successfully:', {
        totalPlayers: Object.keys(playerData).length,
        samplePlayer: Object.values(playerData)[0]
      });
      
      // Cache the data
      localStorage.setItem('sleeperPlayers', JSON.stringify(playerData));
      localStorage.setItem('sleeperPlayersTimestamp', now.toString());
      
      setPlayers(playerData);
    } catch (err) {
      debugLog('Error in fetchPlayers:', err);
      setError('Failed to fetch players');
    }
  }, []);

  const fetchPlayerStats = useCallback(async (season: string, week: string) => {
    debugLog('Fetching player stats for season:', season, 'week:', week);
    try {
      setIsLoading(true);
      
      // Validate season and week
      const currentYear = new Date().getFullYear();
      const seasonNum = parseInt(season);
      
      // Don't fetch stats for future seasons
      if (seasonNum > currentYear) {
        debugLog('Skipping player stats fetch for future season:', season);
        setPlayerStats({});
        return;
      }

      // For current season, validate week
      if (seasonNum === currentYear) {
        const currentWeek = getCurrentWeek();
        const weekNum = parseInt(week);
        if (weekNum > currentWeek) {
          debugLog('Skipping player stats fetch for future week:', week);
          setPlayerStats({});
          return;
        }
      }

      const stats = await PlayerApi.getPlayerStats(season, week);
      setPlayerStats(stats);
    } catch (err) {
      debugLog('Error in fetchPlayerStats:', err);
      setPlayerStats({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add helper function to get current week
  const getCurrentWeek = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 8, 1); // September 1st
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(Math.ceil(diffDays / 7), 18); // Max 18 weeks
  };

  const value = {
    players,
    playerStats,
    isLoading,
    error,
    setPlayers,
    setPlayerStats,
    setIsLoading,
    setError,
    fetchPlayers,
    fetchPlayerStats
  };

  debugLog('PlayerContext state:', {
    totalPlayers: Object.keys(players).length,
    totalStats: Object.keys(playerStats).length,
    isLoading,
    error
  });

  return (
    <PlayerContext.Provider value={value}>
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