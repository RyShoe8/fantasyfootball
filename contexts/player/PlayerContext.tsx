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

import * as React from 'react';
import { SleeperPlayer } from '../../types/sleeper';
import { PlayerStats } from '../../types/player';
import { getPlayerData, savePlayerData } from '../../lib/db';
import { PlayerApi } from '../../services/api';
import axios from 'axios';

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
  playerStats: Record<string, PlayerStats>;
  positions: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  setPlayers: (players: Record<string, SleeperPlayer>) => void;
  setPlayerStats: (stats: Record<string, PlayerStats>) => void;
  setPositions: (positions: Record<string, string>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchPlayers: () => Promise<void>;
  fetchPlayerStats: (season: string, week: number) => Promise<void>;
}

const PlayerContext = React.createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  debugLog('Initializing PlayerProvider');

  const [players, setPlayers] = React.useState<Record<string, SleeperPlayer>>({});
  const [playerStats, setPlayerStats] = React.useState<Record<string, PlayerStats>>({});
  const [positions, setPositions] = React.useState<Record<string, string>>({
    QB: 'Quarterback',
    RB: 'Running Back',
    WR: 'Wide Receiver',
    TE: 'Tight End',
    SUPER_FLEX: 'Super Flex',
    FLEX: 'Flex',
    IDP_FLEX: 'IDP Flex'
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPlayers = React.useCallback(async () => {
    debugLog('Fetching players');
    try {
      setIsLoading(true);
      setError(null);
      
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPlayerStats = React.useCallback(async (season: string, week: number) => {
    debugLog('Fetching player stats for season:', season, 'week:', week);
    try {
      setIsLoading(true);
      setError(null);
      
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
        if (week > currentWeek) {
          debugLog('Skipping player stats fetch for future week:', week);
          setPlayerStats({});
          return;
        }
      }

      const response = await axios.get(`https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}`);
      const stats: Record<string, PlayerStats> = response.data;
      setPlayerStats(stats);
    } catch (err) {
      debugLog('Error in fetchPlayerStats:', err);
      setError('Failed to fetch player stats');
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
    positions,
    isLoading,
    error,
    setPlayers,
    setPlayerStats,
    setPositions,
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
  const context = React.useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
} 