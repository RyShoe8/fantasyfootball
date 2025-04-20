/**
 * SleeperContext
 * 
 * Provides global state management for Sleeper fantasy football data.
 * Handles user authentication, league data, rosters, and player information.
 * Updated to include users state management.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { SleeperUser, SleeperLeague, SleeperRoster, SleeperPlayer, SleeperDraftPick } from '../types/sleeper';

interface SleeperContextType {
  user: SleeperUser | null;
  users: SleeperUser[];
  leagues: SleeperLeague[];
  rosters: SleeperRoster[];
  players: Record<string, SleeperPlayer>;
  draftPicks: SleeperDraftPick[];
  currentLeague: SleeperLeague | null;
  selectedWeek: string;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  setCurrentLeague: (league: SleeperLeague) => void;
  setSelectedWeek: (week: string) => void;
  setRosters: (rosters: SleeperRoster[]) => void;
  setUsers: (users: SleeperUser[]) => void;
  setPlayers: (players: Record<string, SleeperPlayer>) => void;
  setDraftPicks: (draftPicks: SleeperDraftPick[]) => void;
}

const SleeperContext = createContext<SleeperContextType | undefined>(undefined);

export const SleeperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SleeperUser | null>(null);
  const [users, setUsers] = useState<SleeperUser[]>([]);
  const [leagues, setLeagues] = useState<SleeperLeague[]>([]);
  const [rosters, setRosters] = useState<SleeperRoster[]>([]);
  const [players, setPlayers] = useState<Record<string, SleeperPlayer>>({});
  const [draftPicks, setDraftPicks] = useState<SleeperDraftPick[]>([]);
  const [currentLeague, setCurrentLeague] = useState<SleeperLeague | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/user/${userId}`);
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('sleeperUser', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user data');
      return null;
    }
  };

  const fetchRosters = async (leagueId: string) => {
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
      setRosters(response.data);
    } catch (err) {
      console.error('Error fetching rosters:', err);
      setError('Failed to fetch rosters');
    }
  };

  const fetchUsers = async (leagueId: string) => {
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}/users`);
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('https://api.sleeper.app/v1/players/nfl');
      setPlayers(response.data);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to fetch players');
    }
  };

  const login = async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/user/${username}`);
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('sleeperUser', JSON.stringify(userData));
      
      // Fetch league data
      const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/2023`);
      if (leaguesResponse.data.length > 0) {
        const leagueId = leaguesResponse.data[0].league_id;
        await Promise.all([
          fetchRosters(leagueId),
          fetchUsers(leagueId),
          fetchPlayers()
        ]);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setRosters([]);
    setUsers([]);
    setPlayers({});
    setCurrentLeague(null);
    localStorage.removeItem('sleeperUser');
  };

  useEffect(() => {
    const initializeContext = async () => {
      if (isInitialized) return;

      try {
        setIsLoading(true);
        console.log('SleeperProvider mounted, checking for stored user...');
        const storedUser = localStorage.getItem('sleeperUser');
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // Fetch league data
            const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/2023`);
            if (leaguesResponse.data.length > 0) {
              const leagueId = leaguesResponse.data[0].league_id;
              await Promise.all([
                fetchRosters(leagueId),
                fetchUsers(leagueId),
                fetchPlayers()
              ]);
            }
          } catch (err) {
            console.error('Error initializing context:', err);
            setError('Failed to initialize context');
            localStorage.removeItem('sleeperUser');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize application');
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeContext();
  }, [isInitialized]);

  return (
    <SleeperContext.Provider
      value={{
        user,
        users,
        leagues,
        rosters,
        players,
        draftPicks,
        currentLeague,
        selectedWeek,
        isLoading,
        error,
        login,
        logout,
        setCurrentLeague,
        setSelectedWeek,
        setRosters,
        setUsers,
        setPlayers,
        setDraftPicks
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