import React from 'react';
import type { LeagueContextType, LeagueState } from '../../types/league';
import { SleeperLeague, SleeperUser, SleeperRoster, SleeperDraftPick } from '../../types/sleeper';
import { 
  getLeagueData, 
  saveLeagueData, 
  getRosterData, 
  saveRosterData, 
  getUserData, 
  saveUserData, 
  getDraftPicks, 
  saveDraftPick 
} from '../../lib/db';
import { LeagueApi, RosterApi, UserApi } from '../../services/api';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[LeagueContext]', ...args);
  }
};

const LeagueContext = React.createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  debugLog('Initializing LeagueProvider');

  // Initialize state with default values
  const [leagues, setLeagues] = React.useState<SleeperLeague[]>([]);
  const [rosters, setRosters] = React.useState<SleeperRoster[]>([]);
  const [users, setUsers] = React.useState<SleeperUser[]>([]);
  const [draftPicks, setDraftPicks] = React.useState<SleeperDraftPick[]>([]);
  const [currentLeague, setCurrentLeagueState] = React.useState<SleeperLeague | null>(null);
  const [selectedWeek, setSelectedWeekState] = React.useState<number>(1);
  const [selectedYear, setSelectedYearState] = React.useState<string>(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRosters = React.useCallback(async (leagueId: string) => {
    debugLog('Fetching rosters for league:', leagueId);
    try {
      // Check database first
      const dbRosters = await getRosterData(leagueId, selectedYear);
      if (dbRosters && dbRosters.length > 0) {
        debugLog('Found rosters in database:', dbRosters);
        setRosters(dbRosters);
        return;
      }

      // If not in database, fetch from API
      debugLog('Rosters not found in database, fetching from API');
      const rosters = await RosterApi.getRosters(leagueId);
      
      debugLog('API response received:', rosters);
      
      // Save each roster to database
      await Promise.all(rosters.map((roster: SleeperRoster) => saveRosterData(roster)));
      
      setRosters(rosters);
      debugLog('Rosters saved and state updated');
    } catch (err) {
      debugLog('Error in fetchRosters:', err);
      setError('Failed to fetch rosters');
      setRosters([]);
    }
  }, [selectedYear]);

  const fetchUsers = React.useCallback(async (leagueId: string) => {
    debugLog('Fetching users for league:', leagueId);
    try {
      // Check database first
      const dbUsers = await Promise.all(
        (await getRosterData(leagueId, selectedYear))
          .map(roster => getUserData(roster.owner_id))
      );
      
      if (dbUsers.every(user => user !== null)) {
        debugLog('Found users in database:', dbUsers);
        setUsers(dbUsers.filter((user): user is SleeperUser => user !== null));
        return;
      }

      // If not in database, fetch from API
      debugLog('Users not found in database, fetching from API');
      const users = await LeagueApi.getLeagueUsers(leagueId);
      
      debugLog('API response received:', users);
      
      // Save each user to database
      await Promise.all(users.map((user: SleeperUser) => saveUserData(user)));
      
      setUsers(users);
      debugLog('Users saved and state updated');
    } catch (err) {
      debugLog('Error in fetchUsers:', err);
      setError('Failed to fetch users');
      setUsers([]);
    }
  }, [selectedYear]);

  const setCurrentLeague = React.useCallback(async (league: SleeperLeague | null) => {
    debugLog('Setting current league:', league);
    setCurrentLeagueState(league);
    
    if (league) {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchRosters(league.league_id),
          fetchUsers(league.league_id)
        ]);
        debugLog('League data loaded successfully');
      } catch (err) {
        debugLog('Error loading league data:', err);
        setError('Failed to load league data');
      } finally {
        setIsLoading(false);
      }
    }
  }, [fetchRosters, fetchUsers]);

  const setSelectedWeek = React.useCallback((week: number) => {
    debugLog('Setting selected week:', week);
    setSelectedWeekState(week);
  }, []);

  const setSelectedYear = React.useCallback(async (year: string) => {
    debugLog('Setting selected year:', year);
    setSelectedYearState(year);
    
    if (currentLeague) {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchRosters(currentLeague.league_id),
          fetchUsers(currentLeague.league_id)
        ]);
        debugLog('League data reloaded for new year');
      } catch (err) {
        debugLog('Error reloading league data:', err);
        setError('Failed to reload league data');
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentLeague, fetchRosters, fetchUsers]);

  const refreshLeague = React.useCallback(async (leagueId: string) => {
    debugLog('Refreshing league:', leagueId);
    setIsLoading(true);
    try {
      const league = await LeagueApi.getLeague(leagueId);
      await saveLeagueData(league);
      setCurrentLeagueState(league);
      await Promise.all([
        fetchRosters(leagueId),
        fetchUsers(leagueId)
      ]);
      debugLog('League refreshed successfully');
    } catch (err) {
      debugLog('Error refreshing league:', err);
      setError('Failed to refresh league');
    } finally {
      setIsLoading(false);
    }
  }, [fetchRosters, fetchUsers]);

  const fetchLeagues = React.useCallback(async (userId: string) => {
    debugLog('Fetching leagues for user:', userId);
    setIsLoading(true);
    try {
      const leagues = await UserApi.getUserLeagues(userId, selectedYear);
      setLeagues(leagues);
      debugLog('Leagues fetched successfully');
    } catch (err) {
      debugLog('Error fetching leagues:', err);
      setError('Failed to fetch leagues');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  const value = React.useMemo(() => ({
    leagues,
    rosters,
    users,
    draftPicks,
    currentLeague,
    selectedWeek,
    selectedYear,
    isLoading,
    loading: isLoading,
    error,
    setCurrentLeague,
    setSelectedWeek,
    setSelectedYear,
    setRosters,
    setUsers,
    setDraftPicks,
    setLeagues,
    setIsLoading,
    setError,
    refreshLeague,
    fetchLeagues
  }), [
    leagues,
    rosters,
    users,
    draftPicks,
    currentLeague,
    selectedWeek,
    selectedYear,
    isLoading,
    error,
    setCurrentLeague,
    setSelectedWeek,
    setSelectedYear,
    refreshLeague,
    fetchLeagues
  ]);

  debugLog('LeagueContext state:', {
    currentLeague: currentLeague?.league_id,
    selectedWeek,
    selectedYear,
    isLoading,
    error
  });

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = React.useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
} 