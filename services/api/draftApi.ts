/**
 * Draft API Service
 * 
 * Handles all draft-related API calls to the Sleeper API.
 * Includes extensive debugging and error handling.
 */

import axios from 'axios';
import { SleeperDraftPick } from '../../types/sleeper';
import { ApiError, toApiError } from '../../types/api';
import { ERROR_MESSAGES } from '../../utils/constants';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility with consistent formatting
const debugLog = (action: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DraftAPI][${action}]`, ...args);
  }
};

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export class DraftApi {
  /**
   * Fetch draft picks for a league
   * @param leagueId - The league ID
   * @returns Promise<SleeperDraftPick[]> - Array of draft picks
   */
  static async getDraftPicks(leagueId: string): Promise<SleeperDraftPick[]> {
    debugLog('getDraftPicks:start', 'leagueId:', leagueId);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/draft_picks`);
      debugLog('getDraftPicks:success', 'pick count:', response.data.length);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getDraftPicks:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }
} 