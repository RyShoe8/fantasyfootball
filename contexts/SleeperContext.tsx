/**
 * SleeperContext
 * 
 * Provides global state management for Sleeper fantasy football data.
 * Handles user authentication, league data, rosters, and player information.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { SleeperUser, SleeperLeague, SleeperRoster, SleeperPlayer } from '../types/sleeper';

interface SleeperContextType {
  user: SleeperUser | null;
  leagues: SleeperLeague[];
  rosters: SleeperRoster[];
  players: Record<string, SleeperPlayer>;
  currentLeague: SleeperLeague | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  setCurrentLeague: (league: SleeperLeague) => void;
}

const SleeperContext = createContext<SleeperContextType | undefined>(undefined);

export function SleeperProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SleeperUser | null>(null);
  const [leagues, setLeagues] = useState<SleeperLeague[]>([]);
  const [rosters, setRosters] = useState<SleeperRoster[]>([]);
  const [players, setPlayers] = useState<Record<string, SleeperPlayer>>({});
  const [currentLeague, setCurrentLeague] = useState<SleeperLeague | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SleeperProvider mounted, checking for stored user...');
    const storedUser = localStorage.getItem('sleeperUser');
    if (storedUser) {
      console.log('Found stored user data:', storedUser);
      try {
        const userData = JSON.parse(storedUser);
        console.log('Parsed user data:', userData);
        setUser(userData);
        fetchUserData(userData.user_id).catch(err => {
          console.error('Failed to fetch user data:', err);
          console.log('Clearing stored user data due to error');
          setError('Failed to load user data. Please try logging in again.');
          setUser(null);
          localStorage.removeItem('sleeperUser');
        });
      } catch (err) {
        console.error('Failed to parse stored user data:', err);
        localStorage.removeItem('sleeperUser');
        setIsLoading(false);
      }
    } else {
      console.log('No stored user data found');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (leagues.length > 0 && !currentLeague) {
      console.log('Setting initial current league:', leagues[0]);
      setCurrentLeague(leagues[0]);
    }
  }, [leagues, currentLeague]);

  // API Debug Section
  // This section contains debug logging for API responses and data processing
  // It helps track the flow of data through the application and identify potential issues

  // Helper function to format API responses for logging
  const formatApiResponse = (data: any, type: string) => {
    switch (type) {
      case 'user':
        return {
          username: data.username,
          display_name: data.display_name,
          user_id: data.user_id,
          avatar: data.avatar
        };
      case 'league':
        return {
          name: data.name,
          league_id: data.league_id,
          season: data.season,
          status: data.status,
          total_rosters: data.total_rosters,
          roster_positions: data.roster_positions,
          settings: {
            num_teams: data.settings.num_teams,
            playoff_teams: data.settings.playoff_teams,
            waiver_type: data.settings.waiver_type,
            waiver_budget: data.settings.waiver_budget
          }
        };
      case 'rosters':
        return data.map((roster: any) => ({
          roster_id: roster.roster_id,
          owner_id: roster.owner_id,
          team_name: roster.metadata?.team_name || `Team ${roster.roster_id}`,
          starters: roster.starters,
          players: roster.players?.length || 0
        }));
      case 'players':
        return `Total players: ${Object.keys(data).length}`;
      default:
        return data;
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      console.log('Starting fetchUserData for user ID:', userId);
      setIsLoading(true);
      setError(null);

      // Fetch user's leagues
      const currentYear = new Date().getFullYear();
      console.log(`Fetching leagues for user ${userId} and year ${currentYear}`);
      const leaguesResponse: AxiosResponse<SleeperLeague[]> = await axios.get(
        `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${currentYear}`
      );
      
      if (!Array.isArray(leaguesResponse.data)) {
        console.error('Invalid leagues data received:', leaguesResponse.data);
        throw new Error('Invalid leagues data received from API');
      }

      console.log('Leagues data:', formatApiResponse(leaguesResponse.data, 'league'));
      setLeagues(leaguesResponse.data);

      // Set initial current league if none selected
      if (leaguesResponse.data.length > 0 && !currentLeague) {
        console.log('Setting initial current league:', formatApiResponse(leaguesResponse.data[0], 'league'));
        setCurrentLeague(leaguesResponse.data[0]);
      }

      // Only fetch rosters and players if we have a current league
      if (currentLeague) {
        // Fetch rosters for current league only
        console.log(`Fetching rosters for league ${currentLeague.league_id}`);
        const rostersResponse = await axios.get<SleeperRoster[]>(
          `https://api.sleeper.app/v1/league/${currentLeague.league_id}/rosters`
        );
        
        if (!Array.isArray(rostersResponse.data)) {
          console.error('Invalid roster data received:', rostersResponse.data);
          throw new Error('Invalid roster data received from API');
        }

        console.log('Rosters data:', formatApiResponse(rostersResponse.data, 'rosters'));
        setRosters(rostersResponse.data);

        // Fetch players data
        console.log('Fetching players data...');
        const playersResponse: AxiosResponse<Record<string, SleeperPlayer>> = await axios.get(
          'https://api.sleeper.app/v1/players/nfl'
        );
        
        if (!playersResponse.data || typeof playersResponse.data !== 'object') {
          console.error('Invalid players data received:', playersResponse.data);
          throw new Error('Invalid players data received from API');
        }

        console.log('Players data:', formatApiResponse(playersResponse.data, 'players'));
        setPlayers(playersResponse.data);
      }

      setIsLoading(false);
      console.log('All user data fetched and stored successfully');
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      const error = err as AxiosError;
      const errorMessage = error.response?.status === 404 
        ? 'User data not found. Please try logging in again.'
        : 'Failed to fetch user data. Please try again later.';
      
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  const login = async (username: string) => {
    try {
      console.log('Starting login process for username:', username);
      setIsLoading(true);
      setError(null);

      // Fetch user data
      console.log('Fetching user data from API...');
      const userResponse: AxiosResponse<SleeperUser> = await axios.get(
        `https://api.sleeper.app/v1/user/${username}`
      );
      console.log('User data:', formatApiResponse(userResponse.data, 'user'));

      if (!userResponse.data || !userResponse.data.user_id) {
        console.error('Invalid user data received:', userResponse.data);
        throw new Error('Invalid user data received from API');
      }
      
      const userData = userResponse.data;
      console.log('Setting user data and storing in localStorage:', formatApiResponse(userData, 'user'));
      setUser(userData);
      localStorage.setItem('sleeperUser', JSON.stringify(userData));

      // Fetch user's leagues and other data
      console.log('Fetching additional user data...');
      await fetchUserData(userData.user_id);

      console.log('Login process completed successfully');
      setIsLoading(false);
    } catch (err) {
      console.error('Login process failed:', err);
      const error = err as AxiosError;
      const errorMessage = error.response?.status === 404 
        ? 'User not found. Please check your username and try again.'
        : 'Failed to login. Please try again later.';
      
      setError(errorMessage);
      setUser(null);
      localStorage.removeItem('sleeperUser');
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    console.log('Logging out user and clearing all data');
    setUser(null);
    setLeagues([]);
    setRosters([]);
    setPlayers({});
    setCurrentLeague(null);
    setError(null);
    localStorage.removeItem('sleeperUser');
  };

  return (
    <SleeperContext.Provider
      value={{
        user,
        leagues,
        rosters,
        players,
        currentLeague,
        isLoading,
        error,
        login,
        logout,
        setCurrentLeague,
      }}
    >
      {children}
    </SleeperContext.Provider>
  );
}

export function useSleeper() {
  const context = useContext(SleeperContext);
  if (context === undefined) {
    throw new Error('useSleeper must be used within a SleeperProvider');
  }
  return context;
}