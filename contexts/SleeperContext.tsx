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

      console.log(`Found ${leaguesResponse.data.length} leagues:`, leaguesResponse.data);
      setLeagues(leaguesResponse.data);

      // Set initial current league if none selected
      if (leaguesResponse.data.length > 0 && !currentLeague) {
        console.log('Setting initial current league:', leaguesResponse.data[0]);
        setCurrentLeague(leaguesResponse.data[0]);
      }

      // Only fetch rosters and players if we have a current league
      if (currentLeague) {
        // Fetch rosters for current league only
        console.log(`Fetching rosters for league ${currentLeague.league_id} (${currentLeague.name})`);
        const rostersResponse = await axios.get<SleeperRoster[]>(
          `https://api.sleeper.app/v1/league/${currentLeague.league_id}/rosters`
        );
        
        if (!Array.isArray(rostersResponse.data)) {
          console.error('Invalid roster data received:', rostersResponse.data);
          throw new Error('Invalid roster data received from API');
        }

        console.log(`Received ${rostersResponse.data.length} rosters for league ${currentLeague.league_id}`);
        
        // Process rosters and extract team names from metadata
        const processedRosters = rostersResponse.data.map((roster: SleeperRoster) => {
          // Extract team name from metadata
          let teamName = `Team ${roster.roster_id}`;
          
          if (roster.metadata) {
            // Try to get team name from metadata
            const metadata = roster.metadata as { team_name?: string };
            if (metadata.team_name) {
              teamName = metadata.team_name;
            } else {
              // Try to get team name from player nicknames
              const playerNicknames = Object.values(roster.metadata).filter(
                (value): value is string => typeof value === 'string' && value.includes('Team')
              );
              if (playerNicknames.length > 0) {
                teamName = playerNicknames[0];
              }
            }
          }

          return {
            ...roster,
            metadata: {
              ...roster.metadata,
              team_name: teamName
            }
          };
        });

        console.log('Processed rosters:', processedRosters);
        setRosters(processedRosters);

        // Fetch players data
        console.log('Fetching players data...');
        const playersResponse: AxiosResponse<Record<string, SleeperPlayer>> = await axios.get(
          'https://api.sleeper.app/v1/players/nfl'
        );
        
        if (!playersResponse.data || typeof playersResponse.data !== 'object') {
          console.error('Invalid players data received:', playersResponse.data);
          throw new Error('Invalid players data received from API');
        }

        console.log('Players data fetched successfully');
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
      console.log('User API response:', userResponse.data);

      if (!userResponse.data || !userResponse.data.user_id) {
        console.error('Invalid user data received:', userResponse.data);
        throw new Error('Invalid user data received from API');
      }
      
      const userData = userResponse.data;
      console.log('Setting user data and storing in localStorage:', userData);
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

// API Debug Section
// This section contains debug logging for API responses and data processing
// It helps track the flow of data through the application and identify potential issues
// The logs are organized by feature area (user, leagues, rosters, players)
// Each log includes relevant context and data for debugging purposes