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
        setError(null);
        
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          console.log('Not in browser environment, skipping initialization');
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        console.log('Starting initialization...');
        const storedUser = localStorage.getItem('sleeperUser');
        console.log('Stored user:', storedUser ? 'Found' : 'Not found');
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('Parsed user data:', userData);
            
            // Validate user data
            if (!userData || !userData.user_id) {
              console.error('Invalid user data:', userData);
              throw new Error('Invalid user data');
            }
            
            console.log('Setting user data...');
            setUser(userData);
            
            // Fetch league data
            console.log('Fetching leagues...');
            const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/2023`);
            console.log('Leagues response:', leaguesResponse.data);
            
            if (leaguesResponse.data && leaguesResponse.data.length > 0) {
              const leagueId = leaguesResponse.data[0].league_id;
              console.log('Selected league ID:', leagueId);
              
              // Set leagues and current league
              setLeagues(leaguesResponse.data);
              setCurrentLeague(leaguesResponse.data[0]);
              
              // Fetch all data in parallel
              console.log('Fetching league data...');
              const [rostersResponse, usersResponse, playersResponse] = await Promise.all([
                axios.get(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
                axios.get(`https://api.sleeper.app/v1/league/${leagueId}/users`),
                axios.get('https://api.sleeper.app/v1/players/nfl')
              ]);
              
              console.log('Setting rosters...');
              setRosters(rostersResponse.data);
              console.log('Setting users...');
              setUsers(usersResponse.data);
              console.log('Setting players...');
              setPlayers(playersResponse.data);
              
              console.log('All data loaded successfully');
            } else {
              console.log('No leagues found');
              setError('No leagues found for this user');
            }
          } catch (err) {
            console.error('Error initializing context:', err);
            setError('Failed to initialize context');
            localStorage.removeItem('sleeperUser');
            setUser(null);
          }
        } else {
          console.log('No stored user found');
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize application');
      } finally {
        console.log('Initialization complete');
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeContext();
  }, [isInitialized]);

  // Add a debug effect to log state changes
  useEffect(() => {
    console.log('State updated:', {
      user: user ? 'Present' : 'Not present',
      leagues: leagues.length,
      currentLeague: currentLeague ? 'Present' : 'Not present',
      rosters: rosters.length,
      users: users.length,
      players: Object.keys(players).length,
      isLoading,
      error,
      isInitialized
    });
  }, [user, leagues, currentLeague, rosters, users, players, isLoading, error, isInitialized]);

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