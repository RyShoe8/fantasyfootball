/**
 * Roster API Service
 * 
 * Handles all roster-related API calls to the Sleeper API.
 * Includes extensive debugging and error handling.
 */

import axios from 'axios';
import { SleeperRoster } from '../../types/sleeper';
import { ApiError, toApiError } from '../../types/api';
import { ERROR_MESSAGES } from '../../utils/constants';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[RosterAPI]', ...args);
  }
};

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export class RosterApi {
  /**
   * Fetch all rosters for a league
   * @param leagueId - The league ID
   * @param season - The season year (optional)
   * @returns Promise<SleeperRoster[]> - Array of rosters
   */
  static async getRosters(leagueId: string, season?: string): Promise<SleeperRoster[]> {
    debugLog('Fetching rosters for league:', leagueId, 'season:', season);
    
    try {
      const url = season 
        ? `${SLEEPER_API_BASE}/league/${leagueId}/rosters?season=${season}`
        : `${SLEEPER_API_BASE}/league/${leagueId}/rosters`;
      
      const response = await axios.get(url);
      debugLog('Rosters fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('Error fetching rosters:', apiError);
      throw apiError;
    }
  }

  /**
   * Fetch a specific roster by ID
   * @param leagueId - The league ID
   * @param rosterId - The roster ID
   * @returns Promise<SleeperRoster> - The roster data
   */
  static async getRoster(leagueId: string, rosterId: string): Promise<SleeperRoster> {
    debugLog('Fetching roster:', rosterId, 'for league:', leagueId);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/roster/${rosterId}`);
      debugLog('Roster fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('Error fetching roster:', apiError);
      throw apiError;
    }
  }
} 