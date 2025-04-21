/**
 * User API Service
 * 
 * Handles all user-related API calls to the Sleeper API.
 * Includes extensive debugging and error handling.
 */

import axios from 'axios';
import { SleeperUser } from '../../types/sleeper';
import { ApiError, toApiError } from '../../types/api';
import { ERROR_MESSAGES } from '../../utils/constants';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility with consistent formatting
const debugLog = (action: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[UserAPI][${action}]`, ...args);
  }
};

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export class UserApi {
  /**
   * Fetch user data by username
   * @param username - The Sleeper username to fetch
   * @returns Promise<SleeperUser> - The user data
   */
  static async getUserByUsername(username: string): Promise<SleeperUser> {
    debugLog('getUserByUsername:start', 'username:', username);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/user/${username}`);
      debugLog('getUserByUsername:success', 'user data:', response.data);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getUserByUsername:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }

  /**
   * Fetch user's leagues for a specific season
   * @param userId - The user's ID
   * @param season - The season year (defaults to current year)
   * @returns Promise<SleeperLeague[]> - Array of leagues
   */
  static async getUserLeagues(userId: string, season: string = new Date().getFullYear().toString()) {
    debugLog('getUserLeagues:start', 'userId:', userId, 'season:', season);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/user/${userId}/leagues/nfl/${season}`);
      debugLog('getUserLeagues:success', 'leagues:', response.data);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getUserLeagues:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }
} 