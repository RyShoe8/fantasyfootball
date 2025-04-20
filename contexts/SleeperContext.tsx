/**
 * SleeperContext
 * 
 * Provides global state management for Sleeper fantasy football data.
 * Handles user authentication, league data, rosters, and player information.
 * Updated to include users state management.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { SleeperUser, SleeperLeague, SleeperRoster, SleeperPlayer, SleeperDraftPick } from '../types/sleeper';
import { 
  getLeagueData, 
  saveLeagueData, 
  getRosterData, 
  saveRosterData, 
  getPlayerData, 
  savePlayerData, 
  getUserData, 
  saveUserData, 
  getDraftPicks, 
  saveDraftPick 
} from '../lib/db';

interface SleeperContextType {
  user: SleeperUser | null;
  users: SleeperUser[];
  leagues: SleeperLeague[];
  rosters: SleeperRoster[];
  players: Record<string, SleeperPlayer>;
  playerStats: Record<string, any>;
  draftPicks: SleeperDraftPick[];
  currentLeague: SleeperLeague | null;
  selectedWeek: string;
  selectedYear: string;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  setCurrentLeague: (league: SleeperLeague | null) => void;
  setSelectedWeek: (week: string) => void;
  setSelectedYear: (year: string) => void;
  setRosters: (rosters: SleeperRoster[]) => void;
  setUsers: (users: SleeperUser[]) => void;
  setPlayers: (players: Record<string, SleeperPlayer>) => void;
  setDraftPicks: (draftPicks: SleeperDraftPick[]) => void;
  setLeagues: (leagues: SleeperLeague[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchPlayerStats: (season: string, week: string) => Promise<void>;
}

const SleeperContext = createContext<SleeperContextType | undefined>(undefined);

export const SleeperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get current season
  const getCurrentSeason = () => {
    return 2025;
  };

  const [user, setUser] = useState<SleeperUser | null>(null);
  const [users, setUsers] = useState<SleeperUser[]>([]);
  const [leagues, setLeagues] = useState<SleeperLeague[]>([]);
  const [rosters, setRosters] = useState<SleeperRoster[]>([]);
  const [players, setPlayers] = useState<Record<string, SleeperPlayer>>({});
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({});
  const [draftPicks, setDraftPicks] = useState<SleeperDraftPick[]>([]);
  const [currentLeague, setCurrentLeagueState] = useState<SleeperLeague | null>(null);
  const [selectedWeek, setSelectedWeekState] = useState<string>('1');
  const [selectedYear, setSelectedYearState] = useState<string>(getCurrentSeason().toString());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      // Check database first
      const dbUser = await getUserData(userId);
      if (dbUser) {
        setUser(dbUser);
        localStorage.setItem('sleeperUser', JSON.stringify(dbUser));
        return dbUser;
      }

      // If not in database, fetch from API
      const response = await axios.get(`https://api.sleeper.app/v1/user/${userId}`);
      const userData = response.data;
      
      // Save to database
      await saveUserData(userData);
      
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
      // Check database first
      const dbRosters = await getRosterData(leagueId, selectedYear);
      if (dbRosters && dbRosters.length > 0) {
        setRosters(dbRosters);
        return;
      }

      // If not in database, fetch from API
      const response = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
      const rosters = response.data;
      
      // Save each roster to database
      await Promise.all(rosters.map((roster: SleeperRoster) => saveRosterData(roster)));
      
      setRosters(rosters);
    } catch (err) {
      console.error('Error fetching rosters:', err);
      setError('Failed to fetch rosters');
    }
  };

  const fetchUsers = async (leagueId: string) => {
    try {
      // Check database first
      const dbUsers = await Promise.all(
        (await getRosterData(leagueId, selectedYear))
          .map(roster => getUserData(roster.owner_id))
      );
      
      if (dbUsers.every(user => user !== null)) {
        setUsers(dbUsers.filter((user): user is SleeperUser => user !== null));
        return;
      }

      // If not in database, fetch from API
      const response = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}/users`);
      const users = response.data;
      
      // Save each user to database
      await Promise.all(users.map((user: SleeperUser) => saveUserData(user)));
      
      setUsers(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  const fetchPlayers = async () => {
    try {
      // Check if we have players in localStorage first
      const cachedPlayers = localStorage.getItem('sleeperPlayers');
      const cacheTimestamp = localStorage.getItem('sleeperPlayersTimestamp');
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      // Use cached data if it's less than a day old
      if (cachedPlayers && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_DAY) {
        console.log('Using cached player data');
        setPlayers(JSON.parse(cachedPlayers));
        return;
      }

      console.log('Fetching fresh player data');
      const response = await axios.get('/api/players');
      const playerData = response.data;
      
      // Cache the data
      localStorage.setItem('sleeperPlayers', JSON.stringify(playerData));
      localStorage.setItem('sleeperPlayersTimestamp', now.toString());
      
      setPlayers(playerData);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError('Failed to fetch player data');
    }
  };

  const fetchPlayerStats = useCallback(async (season: string, week: string) => {
    try {
      // Check if we have stats in localStorage first
      const cacheKey = `sleeperPlayerStats_${season}_${week}`;
      const cachedStats = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      // Use cached data if it's less than an hour old
      if (cachedStats && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_HOUR) {
        console.log('Using cached player stats');
        setPlayerStats(JSON.parse(cachedStats));
        return;
      }

      console.log('Fetching fresh player stats');
      const response = await axios.get(`/api/player-stats?season=${season}&week=${week}`);
      const statsData = response.data;
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(statsData));
      localStorage.setItem(`${cacheKey}_timestamp`, now.toString());
      
      setPlayerStats(statsData);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setError('Failed to fetch player stats');
    }
  }, [setError]);

  const login = async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await fetchUserData(username);
      if (!userData) {
        throw new Error('Failed to fetch user data');
      }
      
      // Fetch league data
      const currentSeason = getCurrentSeason();
      setSelectedYearState(currentSeason.toString());
      
      // Check database first
      const dbLeague = await getLeagueData(userData.user_id, currentSeason.toString());
      let leaguesData: SleeperLeague[] = [];
      
      if (dbLeague) {
        leaguesData = [dbLeague];
      } else {
        // If not in database, fetch from API
        const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${currentSeason}`);
        leaguesData = leaguesResponse.data;
        
        // Save leagues to database
        await Promise.all(leaguesData.map(league => saveLeagueData(league)));
      }
      
      if (leaguesData.length > 0) {
        // Set leagues first
        setLeagues(leaguesData);
        
        // Set current league
        const leagueId = leaguesData[0].league_id;
        setCurrentLeagueState(leaguesData[0]);
        
        // Fetch additional data
        await Promise.all([
          fetchRosters(leagueId),
          fetchUsers(leagueId),
          fetchPlayers()
        ]);
      } else {
        setError('No leagues found for this user');
        setLeagues([]);
        setCurrentLeagueState(null);
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
    setCurrentLeagueState(null);
    localStorage.removeItem('sleeperUser');
  };

  const setCurrentLeague = async (league: SleeperLeague | null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set the current league first
      setCurrentLeagueState(league);
      if (league) {
        localStorage.setItem('sleeperCurrentLeague', JSON.stringify(league));
        
        // Fetch all necessary data for the new league
        const [rostersResponse, usersResponse, playersResponse] = await Promise.all([
          axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`),
          axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/users`),
          axios.get('https://api.sleeper.app/v1/players/nfl')
        ]);
        
        // Update all the necessary state
        setRosters(rostersResponse.data);
        setUsers(usersResponse.data);
        setPlayers(playersResponse.data);
      } else {
        // Clear all league-related data
        setRosters([]);
        setUsers([]);
        setPlayers({});
        localStorage.removeItem('sleeperCurrentLeague');
      }
    } catch (error) {
      console.error('Error setting current league:', error);
      setError('Failed to load league data');
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedWeek = (week: string) => {
    setSelectedWeekState(week);
    localStorage.setItem('sleeperSelectedWeek', week);
  };

  const setSelectedYear = async (year: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedYearState(year);
      localStorage.setItem('sleeperSelectedYear', year);
      
      if (user) {
        // Fetch leagues for the selected year
        const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${year}`);
        if (leaguesResponse.data.length > 0) {
          setLeagues(leaguesResponse.data);
          
          // Try to find a league with the same name as the current league
          if (currentLeague) {
            const sameNameLeague = leaguesResponse.data.find(
              (l: SleeperLeague) => l.name === currentLeague.name
            );
            if (sameNameLeague && sameNameLeague.league_id !== currentLeague.league_id) {
              await setCurrentLeague(sameNameLeague);
              return;
            }
          }
          
          // If no matching league found or same league, use the first one
          const newLeague = leaguesResponse.data[0];
          if (!currentLeague || newLeague.league_id !== currentLeague.league_id) {
            await setCurrentLeague(newLeague);
          }
        } else {
          setError('No leagues found for this year');
          setLeagues([]);
          setRosters([]);
          setUsers([]);
          setPlayers({});
          setCurrentLeagueState(null);
        }
      }
    } catch (error) {
      console.error('Error setting selected year:', error);
      setError('Failed to load leagues for this year');
    } finally {
      setIsLoading(false);
    }
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
        const storedCurrentLeague = localStorage.getItem('sleeperCurrentLeague');
        const storedSelectedYear = localStorage.getItem('sleeperSelectedYear');
        const storedSelectedWeek = localStorage.getItem('sleeperSelectedWeek');
        
        console.log('Stored data:', { 
          user: storedUser ? 'Found' : 'Not found',
          currentLeague: storedCurrentLeague ? 'Found' : 'Not found',
          selectedYear: storedSelectedYear ? 'Found' : 'Not found',
          selectedWeek: storedSelectedWeek ? 'Found' : 'Not found'
        });
        
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
            
            // Set selected year if available
            if (storedSelectedYear) {
              setSelectedYearState(storedSelectedYear);
            }
            
            // Set selected week if available
            if (storedSelectedWeek) {
              setSelectedWeekState(storedSelectedWeek);
            }
            
            // Fetch league data
            console.log('Fetching leagues...');
            const yearToFetch = storedSelectedYear || getCurrentSeason().toString();
            setSelectedYearState(yearToFetch);
            const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${yearToFetch}`);
            console.log('Leagues response:', leaguesResponse.data);
            
            if (leaguesResponse.data && leaguesResponse.data.length > 0) {
              // Set leagues first
              setLeagues(leaguesResponse.data);
              
              // Set current league from localStorage if available
              if (storedCurrentLeague) {
                const parsedLeague = JSON.parse(storedCurrentLeague);
                // Verify the league exists in the fetched leagues
                const leagueExists = leaguesResponse.data.some((l: SleeperLeague) => l.league_id === parsedLeague.league_id);
                if (leagueExists) {
                  await setCurrentLeague(parsedLeague);
                } else {
                  await setCurrentLeague(leaguesResponse.data[0]);
                }
              } else {
                await setCurrentLeague(leaguesResponse.data[0]);
              }
            } else {
              setError('No leagues found for this user');
              setLeagues([]);
              setCurrentLeagueState(null);
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

  useEffect(() => {
    if (selectedYear && selectedWeek) {
      fetchPlayerStats(selectedYear, selectedWeek);
    }
  }, [selectedYear, selectedWeek, fetchPlayerStats]);

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
        playerStats,
        draftPicks,
        currentLeague,
        selectedWeek,
        selectedYear,
        isLoading,
        error,
        login,
        logout,
        setCurrentLeague,
        setSelectedWeek,
        setSelectedYear,
        setRosters,
        setUsers,
        setPlayers,
        setDraftPicks,
        setLeagues,
        setIsLoading,
        setError,
        fetchPlayerStats
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