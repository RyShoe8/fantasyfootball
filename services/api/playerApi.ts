/**
 * Player API Service
 * 
 * Handles all player-related API calls to the Sleeper API.
 * Includes extensive debugging and error handling.
 */

import axios from 'axios';
import { SleeperPlayer, SleeperPlayerStats } from '../../types/sleeper';
import { ApiError, toApiError } from '../../types/api';
import { ERROR_MESSAGES } from '../../utils/constants';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility with consistent formatting
const debugLog = (action: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[PlayerAPI][${action}]`, ...args);
  }
};

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export class PlayerApi {
  /**
   * Fetch all players
   * @returns Promise<Record<string, SleeperPlayer>> - Map of player IDs to player data
   */
  static async getPlayers(): Promise<Record<string, SleeperPlayer>> {
    debugLog('getPlayers:start');
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/players/nfl`);
      debugLog('getPlayers:success', 'player count:', Object.keys(response.data).length);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getPlayers:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Fetch a specific player by ID
   * @param playerId - The player ID
   * @returns Promise<SleeperPlayer> - The player data
   */
  static async getPlayer(playerId: string): Promise<SleeperPlayer> {
    debugLog('getPlayer:start', 'playerId:', playerId);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/players/nfl/${playerId}`);
      debugLog('getPlayer:success', 'player data:', response.data);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getPlayer:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Fetch player stats for a specific week
   * @param season - The NFL season (e.g., "2023")
   * @param week - The week number
   * @returns Promise<Record<string, SleeperPlayerStats>> - Map of player IDs to stats
   */
  static async getPlayerStats(season: string, week: string): Promise<Record<string, SleeperPlayerStats>> {
    debugLog('getPlayerStats:start', 'season:', season, 'week:', week);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/stats/nfl/regular/${season}/${week}`);
      debugLog('getPlayerStats:success', 'stats count:', Object.keys(response.data).length);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getPlayerStats:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }
} 