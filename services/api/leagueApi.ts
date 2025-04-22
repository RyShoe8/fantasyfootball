/**
 * League API Service
 * 
 * Handles all league-related API calls to the Sleeper API.
 * Includes extensive debugging and error handling.
 */

import axios from 'axios';
import { SleeperLeague, SleeperUser } from '../../types/sleeper';
import { ApiError, toApiError } from '../../types/api';
import { ERROR_MESSAGES } from '../../utils/constants';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility with consistent formatting
const debugLog = (action: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[LeagueAPI][${action}]`, ...args);
  }
};

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export class LeagueApi {
  /**
   * Fetch league data by ID
   * @param leagueId - The league ID to fetch
   * @returns Promise<SleeperLeague> - The league data
   */
  static async getLeague(leagueId: string): Promise<SleeperLeague> {
    debugLog('getLeague:start', 'leagueId:', leagueId);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}`);
      debugLog('getLeague:success', 'league data:', response.data);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getLeague:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.LEAGUE_NOT_FOUND);
    }
  }

  /**
   * Fetch all users in a league
   * @param leagueId - The league ID
   * @returns Promise<SleeperUser[]> - Array of users in the league
   */
  static async getLeagueUsers(leagueId: string): Promise<SleeperUser[]> {
    debugLog('getLeagueUsers:start', 'leagueId:', leagueId);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/users`);
      debugLog('getLeagueUsers:success', 'user count:', response.data.length);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getLeagueUsers:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Fetch matchups for a specific week
   * @param leagueId - The league ID
   * @param week - The week number
   * @returns Promise<any[]> - Array of matchups
   */
  static async getMatchups(leagueId: string, week: number): Promise<any[]> {
    debugLog('getMatchups:start', 'leagueId:', leagueId, 'week:', week);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/matchups/${week}`);
      debugLog('getMatchups:success', 'matchup count:', response.data.length);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getMatchups:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Fetch playoff bracket for a league
   * @param leagueId - The league ID
   * @returns Promise<any> - The playoff bracket data
   */
  static async getPlayoffBracket(leagueId: string): Promise<any> {
    debugLog('getPlayoffBracket:start', 'leagueId:', leagueId);
    
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/winners_bracket`);
      debugLog('getPlayoffBracket:success', 'bracket data:', response.data);
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      debugLog('getPlayoffBracket:error', 'error:', apiError);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Fetch leagues for a user
   * @param userId - The user ID
   * @param season - The season year (defaults to current year)
   * @returns Promise<SleeperLeague[]> - Array of leagues for the user
   */
  static async getUserLeagues(userId: string, season: string = new Date().getFullYear().toString()): Promise<SleeperLeague[]> {
    debugLog('getUserLeagues', { userId, season });
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/user/${userId}/leagues/nfl/${season}`);
      return response.data;
    } catch (err) {
      debugLog('getUserLeagues error', err);
      throw toApiError(err);
    }
  }
} 