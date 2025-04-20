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

export function SleeperProvider({ children }: { children: React.ReactNode }) {
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
          avatar: data.avatar,
          metadata: data.metadata || {}
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
          starters: roster.starters || [],
          reserves: roster.reserves || [],
          taxi: roster.taxi || [],
          ir: roster.ir || [],
          players: roster.players?.length || 0
        }));
      case 'players':
        return `Total players: ${Object.keys(data).length}`;
      case 'draft_picks':
        return data.map((pick: SleeperDraftPick) => ({
          player: `${pick.metadata.first_name} ${pick.metadata.last_name}`,
          position: pick.metadata.position,
          team: pick.metadata.team,
          round: pick.round,
          pick_no: pick.pick_no,
          roster_id: pick.roster_id,
          picked_by: pick.picked_by
        }));
      default:
        return data;
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      console.log('Starting fetchUserData for user ID:', userId);
      setIsLoading(true);
      setError(null);

      // 1. Fetch user's leagues
      const currentYear = new Date().getFullYear();
      console.log(`Fetching leagues for user ${userId} and year ${currentYear}`);
      const leaguesResponse: AxiosResponse<SleeperLeague[]> = await axios.get(
        `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${currentYear}`
      );
      
      if (!Array.isArray(leaguesResponse.data)) {
        console.error('Invalid leagues data received:', leaguesResponse.data);
        throw new Error('Invalid leagues data received from API');
      }

      // Sort leagues alphabetically by name
      const sortedLeagues = [...leaguesResponse.data].sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      console.log('Sorted leagues:', sortedLeagues.map(l => ({
        name: l.name,
        league_id: l.league_id
      })));

      // 2. Get the last visited league from localStorage or default to first alphabetical
      const lastVisitedLeagueId = localStorage.getItem('lastVisitedLeague');
      console.log('Last visited league ID:', lastVisitedLeagueId);

      const targetLeague = lastVisitedLeagueId && sortedLeagues.some(l => l.league_id === lastVisitedLeagueId)
        ? sortedLeagues.find(l => l.league_id === lastVisitedLeagueId)
        : sortedLeagues[0];

      if (!targetLeague) {
        console.log('No leagues found for user');
        setError('No leagues found for this user. Please check your Sleeper account.');
        setIsLoading(false);
        return;
      }

      console.log('Selected target league:', {
        name: targetLeague.name,
        league_id: targetLeague.league_id
      });

      // 3. Set the leagues and current league
      setLeagues(sortedLeagues);
      setCurrentLeague(targetLeague);
      localStorage.setItem('lastVisitedLeague', targetLeague.league_id);

      // 4. Fetch league-specific data
      console.log(`Fetching rosters for league ${targetLeague.league_id}`);
      const rostersResponse = await axios.get<SleeperRoster[]>(
        `https://api.sleeper.app/v1/league/${targetLeague.league_id}/rosters`
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

      // 1. Fetch user data
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

      // 2. Fetch user's leagues and other data
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