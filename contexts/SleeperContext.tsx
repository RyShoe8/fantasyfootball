/**
 * SleeperContext
 * 
 * Provides global state management for Sleeper fantasy football data.
 * Handles user authentication, league data, rosters, and player information.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface SleeperContextType {
  user: any;
  leagues: any[];
  rosters: any[];
  players: any[];
  currentLeague: any;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  setCurrentLeague: (league: any) => void;
}

const SleeperContext = createContext<SleeperContextType | undefined>(undefined);

export function SleeperProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentLeague, setCurrentLeague] = useState<any>(null);
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

      // Fetch user's leagues
      const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${new Date().getFullYear()}`);
      setLeagues(leaguesResponse.data);

      // Fetch rosters for each league
      const rostersPromises = leaguesResponse.data.map((league: any) =>
        axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`)
      );
      const rostersResponses = await Promise.all(rostersPromises);
      const allRosters = rostersResponses.flatMap((response) => response.data);
      setRosters(allRosters);

      // Fetch players data
      const playersResponse = await axios.get('https://api.sleeper.app/v1/players/nfl');
      setPlayers(playersResponse.data);

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to fetch user data. Please try again.');
      setIsLoading(false);
      throw err;
    }
  };

  const login = async (username: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user data
      const userResponse = await axios.get(`https://api.sleeper.app/v1/user/${username}`);
      if (!userResponse.data) {
        throw new Error('User not found');
      }
      
      const userData = userResponse.data;
      setUser(userData);
      localStorage.setItem('sleeperUser', JSON.stringify(userData));

      // Fetch user's leagues and other data
      await fetchUserData(userData.user_id);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to login. Please check your username and try again.');
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
    setPlayers([]);
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