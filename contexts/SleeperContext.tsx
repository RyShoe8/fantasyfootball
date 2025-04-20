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
  hasInitialized: boolean;
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
  const [hasInitialized, setHasInitialized] = useState(false);

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
      // Validate season and week
      const currentYear = new Date().getFullYear();
      const seasonNum = parseInt(season);
      
      // Don't fetch stats for future seasons
      if (seasonNum > currentYear) {
        console.log('Skipping player stats fetch for future season:', season);
        setPlayerStats({});
        return;
      }

      // For current season, validate week
      if (seasonNum === currentYear) {
        const currentWeek = getCurrentWeek();
        const weekNum = parseInt(week);
        if (weekNum > currentWeek) {
          console.log('Skipping player stats fetch for future week:', week);
          setPlayerStats({});
          return;
        }
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await axios.get(`/api/player-stats?season=${season}&week=${week}`, {
          signal: controller.signal,
          timeout: 5000,
          validateStatus: (status) => status < 500 // Only treat 500+ as errors
        });
        
        clearTimeout(timeoutId);

        if (response.status === 200 && response.data) {
          setPlayerStats(response.data);
        } else {
          console.log('No player stats data available for season:', season, 'week:', week);
          setPlayerStats({});
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.code === 'ECONNABORTED') {
          console.log('Request timeout for player stats');
        } else if (error.response) {
          console.log('Player stats API error:', error.response.status, error.response.data);
        } else {
          console.error('Error fetching player stats:', error);
        }
        setPlayerStats({});
      }
    } catch (error) {
      console.error('Error in fetchPlayerStats:', error);
      setPlayerStats({});
    }
  }, []);

  // Add helper function to get current week
  const getCurrentWeek = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 8, 1); // September 1st
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(Math.ceil(diffDays / 7), 18); // Max 18 weeks
  };

  const login = async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Starting login process for username:', username);
      const userData = await fetchUserData(username);
      if (!userData) {
        throw new Error('Failed to fetch user data');
      }
      
      console.log('User data fetched successfully:', userData);
      
      // Fetch league data
      const currentSeason = getCurrentSeason();
      setSelectedYearState(currentSeason.toString());
      
      // Check database first
      const dbLeague = await getLeagueData(userData.user_id, currentSeason.toString());
      let leaguesData: SleeperLeague[] = [];
      
      if (dbLeague) {
        console.log('Using cached league data');
        leaguesData = [dbLeague];
      } else {
        console.log('Fetching fresh league data from API');
        try {
          const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${currentSeason}`);
          leaguesData = leaguesResponse.data;
          
          // Save leagues to database
          await Promise.all(leaguesData.map(league => saveLeagueData(league)));
        } catch (err) {
          console.error('Error fetching leagues:', err);
          throw new Error('Failed to fetch leagues. Please check your internet connection and try again.');
        }
      }
      
      if (leaguesData.length > 0) {
        console.log('Setting leagues and fetching additional data');
        // Set leagues first
        setLeagues(leaguesData);
        
        // Set current league
        const leagueId = leaguesData[0].league_id;
        setCurrentLeagueState(leaguesData[0]);
        
        // Fetch additional data with timeout
        const timeout = 10000; // 10 seconds timeout
        try {
          await Promise.race([
            Promise.all([
              fetchRosters(leagueId),
              fetchUsers(leagueId),
              fetchPlayers()
            ]),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timed out')), timeout)
            )
          ]);
        } catch (err) {
          console.error('Error fetching additional data:', err);
          // Don't throw here, we still want to show the basic league data
          setError('Some data could not be loaded. Please refresh the page to try again.');
        }
      } else {
        setError('No leagues found for this user');
        setLeagues([]);
        setCurrentLeagueState(null);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
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

  // Add a function to fetch all data in sequence
  const fetchAllData = useCallback(async (userId: string, leagueId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch leagues first
      const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${selectedYear}`);
      const leagues = leaguesResponse.data;
      setLeagues(leagues);

      // Find the current league
      const league = leagues.find((l: SleeperLeague) => l.league_id === leagueId);
      if (!league) {
        console.error('League not found');
        setError('League not found');
        return;
      }
      setCurrentLeague(league);

      // Fetch rosters and users in parallel
      const [rostersResponse, usersResponse] = await Promise.all([
        axios.get(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
        axios.get(`https://api.sleeper.app/v1/league/${leagueId}/users`)
      ]);

      setRosters(rostersResponse.data);
      setUsers(usersResponse.data);

      // Fetch players and player stats in parallel
      const [playersResponse, statsResponse] = await Promise.all([
        axios.get('https://api.sleeper.app/v1/players/nfl'),
        axios.get(`/api/player-stats?season=${selectedYear}&week=${selectedWeek}`)
      ]);

      setPlayers(playersResponse.data);
      setPlayerStats(statsResponse.data);

      setHasInitialized(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load league data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedWeek]);

  // Update initialization effect
  useEffect(() => {
    const initializeData = async () => {
      if (!user?.user_id || !currentLeague?.league_id || hasInitialized) return;

      try {
        await fetchAllData(user.user_id, currentLeague.league_id);
      } catch (error) {
        console.error('Error during initialization:', error);
        setError('Failed to initialize data');
      }
    };

    initializeData();
  }, [user?.user_id, currentLeague?.league_id, hasInitialized, fetchAllData]);

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
        fetchPlayerStats,
        hasInitialized
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