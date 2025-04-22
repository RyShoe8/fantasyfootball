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

export interface LeagueContextType {
  leagues: SleeperLeague[];
  rosters: SleeperRoster[];
  users: SleeperUser[];
  draftPicks: SleeperDraftPick[];
  currentLeague: SleeperLeague | null;
  selectedWeek: number;
  selectedYear: string;
  availableYears: string[];
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
  fetchLeaguesForYear: (year: string) => Promise<SleeperLeague[]>;
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
  const [availableYears, setAvailableYears] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Get user from auth context
  const { user } = useAuth();

  // Define fetch functions
  const fetchRosters = React.useCallback(async (leagueId: string) => {
    try {
      debugLog('Fetching rosters for league:', leagueId, 'year:', selectedYear);
      setIsLoading(true);
      setError(null);

      // Try to get cached rosters from localStorage
      const cachedRostersStr = localStorage.getItem(`sleeperRosters_${leagueId}_${selectedYear}`);
      let cachedRosters: SleeperRoster[] = [];
      
      if (cachedRostersStr) {
        try {
          cachedRosters = JSON.parse(cachedRostersStr);
          if (Array.isArray(cachedRosters)) {
            debugLog('Found cached rosters:', cachedRosters);
            setRosters(cachedRosters);
            return;
          }
        } catch (err) {
          debugLog('Error parsing cached rosters:', err);
        }
      }

      // If no cached data or invalid cache, fetch from API
      const fetchedRosters = await RosterApi.getRosters(leagueId, selectedYear);
      debugLog('Fetched rosters:', fetchedRosters);
      
      // Save rosters to localStorage with year
      localStorage.setItem(`sleeperRosters_${leagueId}_${selectedYear}`, JSON.stringify(fetchedRosters));
      
      setRosters(fetchedRosters);
    } catch (err) {
      debugLog('Error fetching rosters:', err);
      setError(toApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  const fetchUsers = React.useCallback(async (leagueId: string) => {
    try {
      debugLog('Fetching users for league:', leagueId);
      setIsLoading(true);
      setError(null);

      // Try to get cached users from localStorage
      const cachedUsersStr = localStorage.getItem(`sleeperUsers_${leagueId}`);
      let cachedUsers: SleeperUser[] = [];
      
      if (cachedUsersStr) {
        try {
          cachedUsers = JSON.parse(cachedUsersStr);
          if (Array.isArray(cachedUsers)) {
            debugLog('Found cached users:', cachedUsers);
            setUsers(cachedUsers);
            return;
          }
        } catch (err) {
          debugLog('Error parsing cached users:', err);
        }
      }

      // If no cached data or invalid cache, fetch from API
      const fetchedUsers = await LeagueApi.getLeagueUsers(leagueId);
      debugLog('Fetched users:', fetchedUsers);
      
      // Save users to localStorage
      localStorage.setItem(`sleeperUsers_${leagueId}`, JSON.stringify(fetchedUsers));
      
      setUsers(fetchedUsers);
    } catch (err) {
      debugLog('Error fetching users:', err);
      setError(toApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDraftPicks = React.useCallback(async (leagueId: string) => {
    if (!leagueId) {
      debugLog('No league ID provided for draft picks fetch');
      return;
    }

    try {
      debugLog('Fetching draft picks for league:', leagueId);
      setIsLoading(true);
      setError(null);

      // Try to get cached draft picks from localStorage
      const cachedDraftPicksStr = localStorage.getItem(`sleeperDraftPicks_${leagueId}`);
      let cachedDraftPicks: SleeperDraftPick[] = [];
      
      if (cachedDraftPicksStr) {
        try {
          cachedDraftPicks = JSON.parse(cachedDraftPicksStr);
          if (Array.isArray(cachedDraftPicks)) {
            debugLog('Found cached draft picks:', cachedDraftPicks);
            setDraftPicks(cachedDraftPicks);
            return;
          }
        } catch (err) {
          debugLog('Error parsing cached draft picks:', err);
        }
      }

      // If no cached data or invalid cache, fetch from API
      const fetchedDraftPicks = await DraftApi.getDraftPicks(leagueId);
      debugLog('Fetched draft picks:', fetchedDraftPicks);
      
      // Save draft picks to localStorage (even if empty array)
      localStorage.setItem(`sleeperDraftPicks_${leagueId}`, JSON.stringify(fetchedDraftPicks));
      setDraftPicks(fetchedDraftPicks);
    } catch (err) {
      debugLog('Error fetching draft picks:', err);
      // Don't set error state for draft picks - they're optional
      setDraftPicks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch leagues when user changes
  React.useEffect(() => {
    const fetchLeagues = async () => {
      if (!user || isInitialized) {
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
              setIsInitialized(true);
              return;
            }
          } catch (err) {
            debugLog('Error parsing cached leagues:', err);
          }
        }

        // If no cached data or invalid cache, fetch from API
        const fetchedLeagues = await LeagueApi.getUserLeagues(user.user_id);
        debugLog('Fetched leagues:', fetchedLeagues);
        
        // Save leagues to localStorage
        localStorage.setItem('sleeperLeagues', JSON.stringify(fetchedLeagues));
        
        setLeagues(fetchedLeagues);
        setIsInitialized(true);
      } catch (err) {
        debugLog('Error fetching leagues:', err);
        setError(toApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagues();
  }, [user, isInitialized]);

  // Fetch rosters when current league changes
  React.useEffect(() => {
    if (!currentLeague?.league_id) {
      return;
    }
    fetchRosters(currentLeague.league_id);
  }, [currentLeague?.league_id, fetchRosters]);

  // Fetch users when current league changes
  React.useEffect(() => {
    if (!currentLeague?.league_id) {
      return;
    }
    fetchUsers(currentLeague.league_id);
  }, [currentLeague?.league_id, fetchUsers]);

  // Fetch draft picks when current league changes
  React.useEffect(() => {
    if (!currentLeague?.league_id) {
      debugLog('No current league selected, skipping draft picks fetch');
      return;
    }
    fetchDraftPicks(currentLeague.league_id);
  }, [currentLeague?.league_id, fetchDraftPicks]);

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

  const fetchLeaguesForYear = React.useCallback(async (year: string): Promise<SleeperLeague[]> => {
    if (!user) {
      return [];
    }

    try {
      debugLog('Fetching leagues for year:', year);
      setIsLoading(true);
      setError(null);

      const fetchedLeagues = await LeagueApi.getUserLeagues(user.user_id, year);
      debugLog('Fetched leagues for year:', year, fetchedLeagues);

      // Save leagues to localStorage
      const existingLeaguesStr = localStorage.getItem('sleeperLeagues');
      let existingLeagues: SleeperLeague[] = [];
      if (existingLeaguesStr) {
        try {
          existingLeagues = JSON.parse(existingLeaguesStr);
          if (!Array.isArray(existingLeagues)) {
            existingLeagues = [];
          }
        } catch (err) {
          debugLog('Error parsing existing leagues:', err);
          existingLeagues = [];
        }
      }

      // Merge with existing leagues, avoiding duplicates
      const mergedLeagues = [...existingLeagues];
      for (const league of fetchedLeagues) {
        const existingIndex = mergedLeagues.findIndex(l => l.league_id === league.league_id);
        if (existingIndex === -1) {
          mergedLeagues.push(league);
        }
      }

      localStorage.setItem('sleeperLeagues', JSON.stringify(mergedLeagues));
      
      // Save each league individually to the database
      for (const league of fetchedLeagues) {
        await saveLeagueData(league);
      }

      return fetchedLeagues;
    } catch (err) {
      debugLog('Error fetching leagues for year:', year, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch leagues'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const setSelectedYear = React.useCallback(async (year: string) => {
    debugLog('Setting selected year:', year);
    setSelectedYearState(year);
    
    if (currentLeague) {
      setIsLoading(true);
      try {
        // First fetch leagues for the new year
        const newYearLeagues = await fetchLeaguesForYear(year);
        debugLog('Fetched leagues for new year:', newYearLeagues);
        
        // Find the matching league in the new year
        const matchingLeague = newYearLeagues.find(
          (league: SleeperLeague) => league.name === currentLeague.name || 
                    league.previous_league_id === currentLeague.league_id ||
                    league.league_id === currentLeague.league_id
        );
        
        if (matchingLeague) {
          debugLog('Found matching league for new year:', matchingLeague);
          await setCurrentLeague(matchingLeague);
        } else {
          debugLog('No matching league found for new year');
          setError(new Error('No matching league found for selected year'));
        }
      } catch (err) {
        debugLog('Error handling year change:', err);
        setError(toApiError(err));
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentLeague, fetchLeaguesForYear, setCurrentLeague]);

  // Function to fetch all available years for a league
  const fetchAvailableYearsForLeague = React.useCallback(async (leagueName: string, currentYear: string) => {
    debugLog('Fetching available years for league:', leagueName);
    const years: string[] = [];
    let currentLeagueId = currentLeague?.league_id;
    let year = parseInt(currentYear);
    
    // Add current year
    years.push(year.toString());
    
    // Look for previous years
    let previousYear = year - 1;
    while (true) {
      try {
        const previousYearLeagues = await fetchLeaguesForYear(previousYear.toString());
        const previousLeague = previousYearLeagues.find(
          (league: SleeperLeague) => 
            league.name === leagueName || 
            league.league_id === currentLeagueId ||
            league.previous_league_id === currentLeagueId
        );
        
        if (previousLeague) {
          years.push(previousYear.toString());
          currentLeagueId = previousLeague.league_id;
          previousYear--;
        } else {
          break;
        }
      } catch (err) {
        debugLog('Error fetching previous year leagues:', err);
        break;
      }
    }
    
    return years.sort((a, b) => b.localeCompare(a)); // Sort in descending order
  }, [currentLeague, fetchLeaguesForYear]);

  // Update available years when current league changes
  React.useEffect(() => {
    if (currentLeague && selectedYear) {
      fetchAvailableYearsForLeague(currentLeague.name, selectedYear)
        .then((years: string[]) => {
          debugLog('Setting available years:', years);
          setAvailableYears(years);
        })
        .catch((err: Error) => {
          debugLog('Error fetching available years:', err);
          setError(toApiError(err));
        });
    }
  }, [currentLeague, selectedYear, fetchAvailableYearsForLeague]);

  const value = {
    leagues,
    rosters,
    users,
    draftPicks,
    currentLeague,
    selectedWeek,
    selectedYear,
    availableYears,
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
    setError,
    fetchLeaguesForYear,
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