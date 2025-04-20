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
    const storedUser = localStorage.getItem('sleeperUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchUserData(userData.user_id).catch(err => {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user data. Please try logging in again.');
        setUser(null);
        localStorage.removeItem('sleeperUser');
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set the first league as current league when leagues are loaded
    if (leagues.length > 0 && !currentLeague) {
      setCurrentLeague(leagues[0]);
    }
  }, [leagues, currentLeague]);

  const fetchUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching data for user ID:', userId);

      // Fetch user's leagues
      const currentYear = new Date().getFullYear();
      console.log('Fetching leagues for year:', currentYear);
      const leaguesResponse: AxiosResponse<SleeperLeague[]> = await axios.get(
        `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${currentYear}`
      );
      
      if (!Array.isArray(leaguesResponse.data)) {
        console.error('Invalid leagues data received:', leaguesResponse.data);
        throw new Error('Invalid leagues data received from API');
      }

      console.log('Found leagues:', leaguesResponse.data.length);
      setLeagues(leaguesResponse.data);

      // Fetch rosters for each league
      console.log('Fetching rosters for each league...');
      const rostersPromises = leaguesResponse.data.map((league: SleeperLeague) => {
        console.log('Fetching rosters for league:', league.league_id);
        return axios.get<SleeperRoster[]>(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`);
      });

      const rostersResponses = await Promise.all(rostersPromises);
      const allRosters = rostersResponses.flatMap((response: AxiosResponse<SleeperRoster[]>) => {
        if (!Array.isArray(response.data)) {
          console.error('Invalid roster data received:', response.data);
          return [];
        }
        return response.data;
      });

      console.log('Total rosters found:', allRosters.length);
      setRosters(allRosters);

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

      setIsLoading(false);
      console.log('All user data fetched successfully');
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
      setIsLoading(true);
      setError(null);

      console.log('Attempting to login with username:', username);

      // Fetch user data
      const userResponse: AxiosResponse<SleeperUser> = await axios.get(
        `https://api.sleeper.app/v1/user/${username}`
      );
      console.log('User API response:', userResponse.data);

      if (!userResponse.data || !userResponse.data.user_id) {
        console.error('Invalid user data received:', userResponse.data);
        throw new Error('Invalid user data received from API');
      }
      
      const userData = userResponse.data;
      console.log('Setting user data:', userData);
      setUser(userData);
      localStorage.setItem('sleeperUser', JSON.stringify(userData));

      // Fetch user's leagues and other data
      console.log('Fetching additional user data...');
      await fetchUserData(userData.user_id);

      console.log('Login successful');
      setIsLoading(false);
    } catch (err) {
      console.error('Login failed:', err);
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