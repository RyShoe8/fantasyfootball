/**
 * LeagueContext
 * 
 * Handles league-related state and operations for the Sleeper API.
 * This context is responsible for:
 * - Managing league data
 * - Handling rosters
 * - Managing users within leagues
 * - Handling draft picks
 * - Managing selected week/year
 */

import React from 'react';
import { SleeperLeague, SleeperRoster, SleeperUser, SleeperDraftPick } from '../../types/sleeper';
import { ApiError, toApiError } from '../../types/api';
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
import { LeagueApi, RosterApi } from '../../services/api';
import { DraftApi } from '../../services/api';
import { useAuth } from '../auth';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[LeagueContext]', ...args);
  }
};

interface LeagueContextType {
  leagues: SleeperLeague[];
  rosters: SleeperRoster[];
  users: SleeperUser[];
  draftPicks: SleeperDraftPick[];
  currentLeague: SleeperLeague | null;
  selectedWeek: number;
  selectedYear: string;
  isLoading: boolean;
  error: ApiError | null;
  setCurrentLeague: (league: SleeperLeague | null) => Promise<void>;
  setSelectedWeek: (week: number) => void;
  setSelectedYear: (year: string) => Promise<void>;
  setRosters: (rosters: SleeperRoster[]) => void;
  setUsers: (users: SleeperUser[]) => void;
  setDraftPicks: (draftPicks: SleeperDraftPick[]) => void;
  setLeagues: (leagues: SleeperLeague[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: ApiError | null) => void;
}

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
  const [error, setError] = React.useState<ApiError | null>(null);

  // Get user from auth context
  const { user } = useAuth();

  // Fetch leagues when user changes
  React.useEffect(() => {
    const fetchLeagues = async () => {
      if (!user) {
        setLeagues([]);
        return;
      }

      try {
        debugLog('Fetching leagues for user:', user.user_id);
        setIsLoading(true);
        setError(null);

        // Try to get cached leagues from localStorage
        const cachedLeaguesStr = localStorage.getItem('sleeperLeagues');
        let cachedLeagues: SleeperLeague[] = [];
        
        if (cachedLeaguesStr) {
          try {
            cachedLeagues = JSON.parse(cachedLeaguesStr);
            if (Array.isArray(cachedLeagues)) {
              debugLog('Found cached leagues:', cachedLeagues);
              setLeagues(cachedLeagues);
              
              // If we have cached leagues but no current league selected, select the lowest alphabetical one from current year
              if (!currentLeague && cachedLeagues.length > 0) {
                const currentYear = new Date().getFullYear().toString();
                const currentYearLeagues = cachedLeagues.filter(league => league.season === currentYear);
                if (currentYearLeagues.length > 0) {
                  const lowestAlphabeticalLeague = currentYearLeagues.sort((a, b) => 
                    a.name.localeCompare(b.name)
                  )[0];
                  setCurrentLeague(lowestAlphabeticalLeague);
                  setSelectedYear(currentYear);
                }
              }
              return;
            }
          } catch (err) {
            debugLog('Error parsing cached leagues:', err);
          }
        }

        // If no cached data or invalid cache, fetch from API
        const currentYear = new Date().getFullYear().toString();
        const fetchedLeagues = await LeagueApi.getUserLeagues(user.user_id, currentYear);
        debugLog('Fetched leagues:', fetchedLeagues);

        // Save leagues to localStorage
        localStorage.setItem('sleeperLeagues', JSON.stringify(fetchedLeagues));
        
        // Save each league individually to the database
        for (const league of fetchedLeagues) {
          await saveLeagueData(league);
        }
        
        setLeagues(fetchedLeagues);

        // If we have leagues but no current league selected, select the lowest alphabetical one from current year
        if (fetchedLeagues.length > 0 && !currentLeague) {
          const currentYearLeagues = fetchedLeagues.filter(league => league.season === currentYear);
          if (currentYearLeagues.length > 0) {
            const lowestAlphabeticalLeague = currentYearLeagues.sort((a, b) => 
              a.name.localeCompare(b.name)
            )[0];
            setCurrentLeague(lowestAlphabeticalLeague);
            setSelectedYear(currentYear);
          }
        }
      } catch (err) {
        debugLog('Error fetching leagues:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch leagues'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagues();
  }, [user]);

  const fetchRosters = React.useCallback(async (leagueId: string) => {
    try {
      debugLog('Fetching rosters for league:', leagueId);
      setIsLoading(true);
      setError(null);
      
      const rosterData = await getRosterData(leagueId, selectedYear);
      if (rosterData) {
        debugLog('Found cached roster data:', rosterData);
        setRosters(rosterData);
        return;
      }

      const fetchedRosters = await RosterApi.getRosters(leagueId);
      debugLog('Fetched rosters:', fetchedRosters);
      
      // Save each roster individually
      for (const roster of fetchedRosters) {
        await saveRosterData(roster);
      }
      setRosters(fetchedRosters);
    } catch (err) {
      debugLog('Error fetching rosters:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch rosters'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  const fetchUsers = React.useCallback(async (leagueId: string) => {
    try {
      debugLog('Fetching users for league:', leagueId);
      setIsLoading(true);
      setError(null);
      
      const fetchedUsers = await LeagueApi.getLeagueUsers(leagueId);
      debugLog('Fetched users:', fetchedUsers);
      
      // Save each user individually
      for (const user of fetchedUsers) {
        await saveUserData(user);
      }
      setUsers(fetchedUsers);
    } catch (err) {
      debugLog('Error fetching users:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch users'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDraftPicks = React.useCallback(async (leagueId: string) => {
    try {
      debugLog('Fetching draft picks for league:', leagueId);
      setIsLoading(true);
      setError(null);
      
      const draftData = await getDraftPicks(leagueId, selectedYear);
      if (draftData) {
        debugLog('Found cached draft data:', draftData);
        setDraftPicks(draftData);
        return;
      }

      const fetchedDraftPicks = await DraftApi.getDraftPicks(leagueId);
      debugLog('Fetched draft picks:', fetchedDraftPicks);
      
      // Save each draft pick individually
      for (const draftPick of fetchedDraftPicks) {
        await saveDraftPick(draftPick);
      }
      setDraftPicks(fetchedDraftPicks);
    } catch (err) {
      debugLog('Error fetching draft picks:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch draft picks'));
    } finally {
      setIsLoading(false);
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
          fetchUsers(league.league_id),
          fetchDraftPicks(league.league_id)
        ]);
        debugLog('League data loaded successfully');
      } catch (err) {
        debugLog('Error loading league data:', err);
        setError(toApiError(err));
      } finally {
        setIsLoading(false);
      }
    }
  }, [fetchRosters, fetchUsers, fetchDraftPicks]);

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
          fetchUsers(currentLeague.league_id),
          fetchDraftPicks(currentLeague.league_id)
        ]);
        debugLog('League data reloaded for new year');
      } catch (err) {
        debugLog('Error reloading league data:', err);
        setError(toApiError(err));
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentLeague, fetchRosters, fetchUsers, fetchDraftPicks]);

  // Generate year options based on available league seasons
  const yearOptions = React.useMemo(() => {
    if (!leagues || leagues.length === 0) return [];
    
    // Get all unique seasons from available leagues
    const seasons = new Set<string>();
    leagues.forEach((league: SleeperLeague) => {
      if (league.season) {
        seasons.add(league.season);
      }
    });
    
    // Add current year and previous 2 years if not already present
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 3; i++) {
      seasons.add((currentYear - i).toString());
    }
    
    // Convert to array and sort in descending order (newest first)
    return Array.from(seasons).sort((a, b) => b.localeCompare(a));
  }, [leagues]);

  const value = {
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
    setRosters,
    setUsers,
    setDraftPicks,
    setLeagues,
    setIsLoading,
    setError
  };

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