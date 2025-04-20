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

  const fetchUserByUsername = async (username: string) => {
    try {
      console.log('Fetching user data for username:', username);
      // Try to fetch user by username from Sleeper API
      const response = await axios.get(`https://api.sleeper.app/v1/user/${username}`);
      console.log('Sleeper API response:', response.data);
      const userData = response.data;
      
      // Save to database only on server side
      if (typeof window === 'undefined') {
        console.log('Saving user data to database');
        try {
          await saveUserData(userData);
          console.log('User data saved successfully');
        } catch (dbError) {
          console.error('Error saving user data to database:', dbError);
          // Continue even if database save fails
        }
      }
      
      console.log('Setting user state and localStorage');
      setUser(userData);
      localStorage.setItem('sleeperUser', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (axios.isAxiosError(err)) {
        console.error('Axios error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
      }
      throw new Error('User not found. Please check your username and try again.');
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
        const parsedPlayers = JSON.parse(cachedPlayers);
        if (Object.keys(parsedPlayers).length > 0) {
          setPlayers(parsedPlayers);
          return;
        }
        console.log('Cached player data was empty, fetching fresh data');
      }

      console.log('Fetching fresh player data');
      const response = await axios.get('/api/players');
      const playerData = response.data;
      
      // Validate player data
      if (!playerData || typeof playerData !== 'object' || Object.keys(playerData).length === 0) {
        console.error('Invalid player data received:', playerData);
        throw new Error('Invalid player data received from API');
      }

      console.log('Player data fetched successfully:', {
        totalPlayers: Object.keys(playerData).length,
        samplePlayer: Object.values(playerData)[0]
      });
      
      // Cache the data
      localStorage.setItem('sleeperPlayers', JSON.stringify(playerData));
      localStorage.setItem('sleeperPlayersTimestamp', now.toString());
      
      setPlayers(playerData);
    } catch (error) {
      console.error('Error fetching players:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      setError('Failed to fetch player data');
      // Try to use cached data as fallback
      const cachedPlayers = localStorage.getItem('sleeperPlayers');
      if (cachedPlayers) {
        try {
          const parsedPlayers = JSON.parse(cachedPlayers);
          if (Object.keys(parsedPlayers).length > 0) {
            console.log('Using cached player data as fallback');
            setPlayers(parsedPlayers);
            return;
          }
        } catch (e) {
          console.error('Error parsing cached player data:', e);
        }
      }
      setPlayers({});
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
      const userData = await fetchUserByUsername(username);
      if (!userData) {
        console.error('No user data returned from fetchUserByUsername');
        throw new Error('Failed to fetch user data');
      }
      
      console.log('User data fetched successfully:', userData);
      
      // Fetch league data
      const currentSeason = getCurrentSeason();
      console.log('Fetching leagues for season:', currentSeason);
      setSelectedYearState(currentSeason.toString());
      localStorage.setItem('sleeperSelectedYear', currentSeason.toString());
      
      // Fetch leagues directly from API
      console.log('Fetching leagues from API');
      try {
        const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${currentSeason}`);
        console.log('Leagues API response:', leaguesResponse.data);
        const leaguesData = leaguesResponse.data;
        
        if (leaguesData.length > 0) {
          console.log('Setting leagues and fetching additional data');
          // Set leagues first
          setLeagues(leaguesData);
          
          // Set current league
          const leagueId = leaguesData[0].league_id;
          console.log('Setting current league:', leaguesData[0]);
          setCurrentLeagueState(leaguesData[0]);
          localStorage.setItem('sleeperCurrentLeague', JSON.stringify(leaguesData[0]));
          
          // Set initialization flags before fetching additional data
          console.log('Setting initialization flags');
          setIsInitialized(true);
          setHasInitialized(true);
          
          // Fetch additional data with increased timeout
          const timeout = 15000; // 15 seconds timeout
          try {
            console.log('Fetching additional data (rosters, users, players)');
            const fetchPromises = [
              fetchRosters(leagueId).catch(err => {
                console.error('Error fetching rosters:', err);
                return [];
              }),
              fetchUsers(leagueId).catch(err => {
                console.error('Error fetching users:', err);
                return [];
              }),
              fetchPlayers().catch(err => {
                console.error('Error fetching players:', err);
                return {};
              })
            ];

            await Promise.race([
              Promise.all(fetchPromises),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), timeout)
              )
            ]);
            console.log('Additional data fetched successfully');
          } catch (err) {
            console.error('Error fetching additional data:', err);
            // Don't throw here, we still want to show the basic league data
            setError('Some data could not be loaded. You can refresh the page to try loading it again.');
          }
        } else {
          console.log('No leagues found for user');
          setError('No leagues found for this user');
          setLeagues([]);
          setCurrentLeagueState(null);
        }
      } catch (apiError) {
        console.error('Error fetching leagues from API:', apiError);
        if (axios.isAxiosError(apiError)) {
          console.error('Axios error details:', {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data
          });
        }
        throw new Error('Failed to fetch leagues. Please check your internet connection and try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
      // Clear all state on login failure
      setUser(null);
      setLeagues([]);
      setCurrentLeagueState(null);
      setRosters([]);
      setUsers([]);
      setPlayers({});
      localStorage.removeItem('sleeperUser');
      localStorage.removeItem('sleeperCurrentLeague');
      localStorage.removeItem('sleeperSelectedYear');
    } finally {
      console.log('Login process completed, setting isLoading to false');
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
        
        // Fetch all necessary data for the new league with timeouts
        const timeout = 5000; // 5 second timeout
        try {
          const [rostersResponse, usersResponse] = await Promise.all([
            Promise.race([
              axios.get<SleeperRoster[]>(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
            ]),
            Promise.race([
              axios.get<SleeperUser[]>(`https://api.sleeper.app/v1/league/${league.league_id}/users`),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
            ])
          ]) as [AxiosResponse<SleeperRoster[]>, AxiosResponse<SleeperUser[]>];
          
          // Update state with the fetched data
          setRosters(rostersResponse.data || []);
          setUsers(usersResponse.data || []);
          
          // Fetch players only if we don't have them cached
          const cachedPlayers = localStorage.getItem('sleeperPlayers');
          const cacheTimestamp = localStorage.getItem('sleeperPlayersTimestamp');
          const now = Date.now();
          const ONE_DAY = 24 * 60 * 60 * 1000;

          if (!cachedPlayers || !cacheTimestamp || (now - parseInt(cacheTimestamp)) >= ONE_DAY) {
            try {
              const playersResponse = await Promise.race([
                axios.get<Record<string, SleeperPlayer>>('/api/players'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
              ]) as AxiosResponse<Record<string, SleeperPlayer>>;
              
              if (playersResponse.data) {
                setPlayers(playersResponse.data);
                localStorage.setItem('sleeperPlayers', JSON.stringify(playersResponse.data));
                localStorage.setItem('sleeperPlayersTimestamp', now.toString());
              }
            } catch (error) {
              console.warn('Failed to fetch players, using cached data if available');
              if (cachedPlayers) {
                setPlayers(JSON.parse(cachedPlayers));
              }
            }
          } else {
            setPlayers(JSON.parse(cachedPlayers));
          }
        } catch (error) {
          console.error('Error fetching league data:', error);
          // Don't throw here, just show what we have
          setError('Some data could not be loaded. Please refresh to try again.');
        }
      } else {
        // Clear all league-related data
        setRosters([]);
        setUsers([]);
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

  // Add initialization effect
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
          setHasInitialized(true);
          return;
        }

        const storedUser = localStorage.getItem('sleeperUser');
        if (!storedUser) {
          console.log('No stored user found');
          setIsLoading(false);
          setIsInitialized(true);
          setHasInitialized(true);
          return;
        }

        try {
          const userData = JSON.parse(storedUser);
          if (!userData || !userData.user_id) {
            throw new Error('Invalid user data');
          }

          setUser(userData);
          
          // Set stored preferences
          const storedYear = localStorage.getItem('sleeperSelectedYear') || getCurrentSeason().toString();
          setSelectedYearState(storedYear);
          
          const storedWeek = localStorage.getItem('sleeperSelectedWeek') || '1';
          setSelectedWeekState(storedWeek);

          // Fetch leagues with timeout
          const timeout = 5000;
          try {
            const leaguesResponse = await Promise.race([
              axios.get<SleeperLeague[]>(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${storedYear}`),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
            ]) as { data: SleeperLeague[] };

            if (leaguesResponse.data?.length > 0) {
              setLeagues(leaguesResponse.data);
              
              // Set current league
              const storedCurrentLeague = localStorage.getItem('sleeperCurrentLeague');
              if (storedCurrentLeague) {
                const parsedLeague = JSON.parse(storedCurrentLeague);
                const leagueExists = leaguesResponse.data.some(l => l.league_id === parsedLeague.league_id);
                await setCurrentLeague(leagueExists ? parsedLeague : leaguesResponse.data[0]);
              } else {
                await setCurrentLeague(leaguesResponse.data[0]);
              }
            } else {
              setError('No leagues found');
              setLeagues([]);
              setCurrentLeagueState(null);
            }
          } catch (error) {
            console.error('Error fetching leagues:', error);
            setError('Failed to load leagues. Please refresh to try again.');
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('sleeperUser');
          setUser(null);
          setError('Invalid user data. Please log in again.');
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        setError('Failed to initialize application');
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        setHasInitialized(true);
      }
    };

    initializeContext();
  }, [isInitialized]);

  // Update the context value
  const value: SleeperContextType = {
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
    hasInitialized: isInitialized
  };

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
      hasInitialized
    });
  }, [user, leagues, currentLeague, rosters, users, players, isLoading, error, hasInitialized]);

  return (
    <SleeperContext.Provider value={value}>
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