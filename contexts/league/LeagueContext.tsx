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
import { RosterApi, LeagueApi, DraftApi } from '../../services/api';
import { useAuth } from '../auth';

// Define the debug log function inline since we can't import it
const debugLog = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.localStorage.getItem('DEBUG') === 'true') {
    console.log(...args);
  }
};

// Define the context type
interface LeagueContextType {
  currentLeague: SleeperLeague | null;
  leagues: SleeperLeague[];
  rosters: SleeperRoster[];
  users: SleeperUser[];
  draftPicks: SleeperDraftPick[];
  availableYears: string[];
  selectedYear: string | null;
  isLoading: boolean;
  error: ApiError | null;
  setCurrentLeague: (league: SleeperLeague | null) => void;
  setSelectedYear: (year: string | null) => void;
  setRosters: (rosters: SleeperRoster[]) => void;
  setUsers: (users: SleeperUser[]) => void;
  setDraftPicks: (draftPicks: SleeperDraftPick[]) => void;
  setLeagues: (leagues: SleeperLeague[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: ApiError | null) => void;
  fetchLeaguesForYear: (year: string) => Promise<SleeperLeague[]>;
  refreshLeagueData: () => Promise<void>;
}

const LeagueContext = React.createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  debugLog('Initializing LeagueProvider');

  // Memoize state setters to prevent unnecessary re-renders
  const setLeagues = React.useCallback((leagues: SleeperLeague[]) => {
    setLeaguesState(leagues);
  }, []);

  const setRosters = React.useCallback((rosters: SleeperRoster[]) => {
    setRostersState(rosters);
  }, []);

  const setUsers = React.useCallback((users: SleeperUser[]) => {
    setUsersState(users);
  }, []);

  const setDraftPicks = React.useCallback((draftPicks: SleeperDraftPick[]) => {
    setDraftPicksState(draftPicks);
  }, []);

  // Initialize state with default values
  const [leagues, setLeaguesState] = React.useState<SleeperLeague[]>([]);
  const [rosters, setRostersState] = React.useState<SleeperRoster[]>([]);
  const [users, setUsersState] = React.useState<SleeperUser[]>([]);
  const [draftPicks, setDraftPicksState] = React.useState<SleeperDraftPick[]>([]);
  const [currentLeague, setCurrentLeagueState] = React.useState<SleeperLeague | null>(null);
  const [selectedYear, setSelectedYearState] = React.useState<string | null>(null);
  const [availableYears, setAvailableYears] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Get user from auth context
  const { user } = useAuth();

  // Function to update available years based on leagues
  const updateAvailableYears = React.useCallback((league: SleeperLeague) => {
    const years = new Set<number>();
    years.add(Number(league.season));
    if (league.previous_seasons) {
      league.previous_seasons.forEach((season: number) => years.add(season));
    }
    setAvailableYears(Array.from(years).sort((a, b) => b - a));
  }, []);

  // Update available years when leagues change
  React.useEffect(() => {
    leagues.forEach(updateAvailableYears);
  }, [leagues, updateAvailableYears]);

  // Fetch leagues when user changes
  React.useEffect(() => {
    const fetchInitialData = async () => {
      if (!user || isInitialized) {
        return;
      }

      try {
        debugLog('Fetching initial data for user:', user.user_id);
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
              
              // Set initial year based on cached leagues
              if (cachedLeagues.length > 0) {
                const years = Array.from(new Set(cachedLeagues.map((league: SleeperLeague) => league.season)));
                const mostRecentYear = years.sort((a, b) => b.localeCompare(a))[0];
                debugLog('Setting initial year from cache:', mostRecentYear);
                setSelectedYearState(mostRecentYear.toString());
              }
              
              setIsInitialized(true);
              return;
            }
          } catch (err: unknown) {
            debugLog('Error parsing cached leagues:', err);
          }
        }

        // If no cached data or invalid cache, fetch from API
        const currentYear = new Date().getFullYear().toString();
        const fetchedLeagues = await LeagueApi.getUserLeagues(user.user_id, currentYear);
        debugLog('Fetched leagues:', fetchedLeagues);
        
        // Save leagues to localStorage
        localStorage.setItem('sleeperLeagues', JSON.stringify(fetchedLeagues));
        
        setLeagues(fetchedLeagues);
        
        // Set initial year based on fetched leagues
        if (fetchedLeagues.length > 0) {
          const years = Array.from(new Set(fetchedLeagues.map((league: SleeperLeague) => league.season)));
          const mostRecentYear = years.sort((a, b) => b.localeCompare(a))[0];
          debugLog('Setting initial year from API:', mostRecentYear);
          setSelectedYearState(mostRecentYear.toString());
        }
        
        setIsInitialized(true);
      } catch (err: unknown) {
        debugLog('Error fetching initial data:', err);
        setError(toApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user, isInitialized]);

  // Fetch leagues when year changes
  React.useEffect(() => {
    const fetchLeaguesForSelectedYear = async () => {
      if (!user || !selectedYear) {
        return;
      }

      try {
        debugLog('Fetching leagues for selected year:', selectedYear);
        setIsLoading(true);
        setError(null);

        const fetchedLeagues = await LeagueApi.getUserLeagues(user.user_id, selectedYear);
        debugLog('Fetched leagues for year:', selectedYear, fetchedLeagues);

        // Merge with existing leagues
        const existingLeagues = leagues.filter((league: SleeperLeague) => league.season !== selectedYear);
        const mergedLeagues = [...existingLeagues, ...fetchedLeagues];
        
        // Save to localStorage
        localStorage.setItem('sleeperLeagues', JSON.stringify(mergedLeagues));
        
        setLeagues(mergedLeagues);
      } catch (err: unknown) {
        debugLog('Error fetching leagues for year:', err);
        setError(toApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaguesForSelectedYear();
  }, [user, selectedYear]);

  // Fetch rosters when current league changes
  React.useEffect(() => {
    if (!currentLeague?.league_id) {
      return;
    }
    const fetchRostersForLeague = async () => {
      try {
        debugLog('Fetching rosters for league:', currentLeague.league_id, 'year:', selectedYear);
        setIsLoading(true);
        setError(null);

        // Try to get cached rosters from localStorage
        const cachedRostersStr = localStorage.getItem(`sleeperRosters_${currentLeague.league_id}_${selectedYear}`);
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
        const fetchedRosters = await RosterApi.getRosters(currentLeague.league_id, selectedYear);
        debugLog('Fetched rosters:', fetchedRosters);
        
        // Save rosters to localStorage with year
        localStorage.setItem(`sleeperRosters_${currentLeague.league_id}_${selectedYear}`, JSON.stringify(fetchedRosters));
        
        setRosters(fetchedRosters);
      } catch (err) {
        debugLog('Error fetching rosters:', err);
        setError(toApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRostersForLeague();
  }, [currentLeague?.league_id, selectedYear]);

  // Fetch users when current league changes
  React.useEffect(() => {
    if (!currentLeague?.league_id) {
      return;
    }
    const fetchUsersForLeague = async () => {
      try {
        debugLog('Fetching users for league:', currentLeague.league_id);
        setIsLoading(true);
        setError(null);

        // Try to get cached users from localStorage
        const cachedUsersStr = localStorage.getItem(`sleeperUsers_${currentLeague.league_id}`);
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
        const fetchedUsers = await LeagueApi.getLeagueUsers(currentLeague.league_id);
        debugLog('Fetched users:', fetchedUsers);
        
        // Save users to localStorage
        localStorage.setItem(`sleeperUsers_${currentLeague.league_id}`, JSON.stringify(fetchedUsers));
        
        setUsers(fetchedUsers);
      } catch (err) {
        debugLog('Error fetching users:', err);
        setError(toApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsersForLeague();
  }, [currentLeague?.league_id]);

  // Fetch draft picks when current league changes
  React.useEffect(() => {
    if (!currentLeague?.league_id) {
      return;
    }
    const fetchDraftPicksForLeague = async () => {
      try {
        debugLog('Fetching draft picks for league:', currentLeague.league_id);
        setIsLoading(true);
        setError(null);

        // Try to get cached draft picks from localStorage
        const cachedDraftPicksStr = localStorage.getItem(`sleeperDraftPicks_${currentLeague.league_id}`);
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
        const fetchedDraftPicks = await DraftApi.getDraftPicks(currentLeague.league_id);
        debugLog('Fetched draft picks:', fetchedDraftPicks);
        
        // Save draft picks to localStorage
        localStorage.setItem(`sleeperDraftPicks_${currentLeague.league_id}`, JSON.stringify(fetchedDraftPicks));
        setDraftPicks(fetchedDraftPicks);
      } catch (err) {
        debugLog('Error fetching draft picks:', err);
        // Don't set error state for draft picks - they're optional
        setDraftPicks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDraftPicksForLeague();
  }, [currentLeague?.league_id]);

  // Update available years when current league changes
  React.useEffect(() => {
    if (!currentLeague?.league_id) {
      return;
    }
    updateAvailableYears(currentLeague);
  }, [currentLeague?.league_id, updateAvailableYears]);

  // Clear data when user changes
  React.useEffect(() => {
    if (!user) {
      setCurrentLeague(null);
      setRosters([]);
      setUsers([]);
      setDraftPicks([]);
      setAvailableYears([]);
      setSelectedYearState(null);
    }
  }, [user]);

  // Handle year change
  const handleYearChange = React.useCallback(async (year: string) => {
    debugLog('Year changed to:', year);
    setIsLoading(true);
    setError(null);

    try {
      const leagueId = currentLeague?.league_id;
      if (!leagueId) {
        throw new Error('No league selected');
      }

      // Fetch fresh data using the new API methods
      const [rostersData, usersData, draftPicksData] = await Promise.all([
        RosterApi.getRosters(leagueId),
        LeagueApi.getLeagueUsers(leagueId),
        DraftApi.getDraftPicks(leagueId)
      ]);

      // Update state with fresh data
      setRosters(rostersData);
      setUsers(usersData);
      setDraftPicks(draftPicksData);

      // Cache the fresh data
      localStorage.setItem(`rosters_${leagueId}`, JSON.stringify(rostersData));
      localStorage.setItem(`users_${leagueId}`, JSON.stringify(usersData));
      localStorage.setItem(`draftPicks_${leagueId}`, JSON.stringify(draftPicksData));
      
      debugLog('Year data loaded successfully');
    } catch (err) {
      debugLog('Error handling year change:', err);
      setError(toApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentLeague?.league_id]);

  // Handle league change
  const handleLeagueChange = React.useCallback(async (leagueId: string) => {
    debugLog('League changed to:', leagueId);
    setIsLoading(true);
    setError(null);

    try {
      const selectedLeague = leagues.find((l: SleeperLeague) => l.league_id === leagueId);
      if (!selectedLeague) {
        throw new Error('League not found');
      }

      setCurrentLeagueState(selectedLeague);
      
      // Fetch fresh data using the new API methods
      const [rostersData, usersData, draftPicksData] = await Promise.all([
        RosterApi.getRosters(leagueId),
        LeagueApi.getLeagueUsers(leagueId),
        DraftApi.getDraftPicks(leagueId)
      ]);

      // Update state with fresh data
      setRosters(rostersData);
      setUsers(usersData);
      setDraftPicks(draftPicksData);

      // Cache the fresh data
      localStorage.setItem(`rosters_${leagueId}`, JSON.stringify(rostersData));
      localStorage.setItem(`users_${leagueId}`, JSON.stringify(usersData));
      localStorage.setItem(`draftPicks_${leagueId}`, JSON.stringify(draftPicksData));
      
      debugLog('League data loaded successfully');
    } catch (err) {
      debugLog('Error handling league change:', err);
      setError(toApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [leagues]);

  const setCurrentLeague = React.useCallback((league: SleeperLeague | null) => {
    debugLog('Setting current league:', league);
    setCurrentLeagueState(league);
    if (league) {
      updateAvailableYears(league);
    }
  }, [updateAvailableYears]);

  const refreshLeagueData = React.useCallback(async () => {
    if (!currentLeague?.league_id) {
      debugLog('No current league selected, skipping refresh');
      return;
    }

    debugLog('Refreshing league data for:', currentLeague.league_id);
    setIsLoading(true);
    setError(null);

    try {
      // Clear cached data
      localStorage.removeItem(`sleeperRosters_${currentLeague.league_id}`);
      localStorage.removeItem(`sleeperUsers_${currentLeague.league_id}`);
      localStorage.removeItem(`sleeperDraftPicks_${currentLeague.league_id}`);

      // Fetch fresh data
      const [rosters, users, draftPicks] = await Promise.all([
        RosterApi.getRosters(currentLeague.league_id),
        LeagueApi.getLeagueUsers(currentLeague.league_id),
        DraftApi.getDraftPicks(currentLeague.league_id)
      ]);

      // Update state and cache
      setRosters(rosters);
      setUsers(users);
      setDraftPicks(draftPicks);

      localStorage.setItem(`sleeperRosters_${currentLeague.league_id}`, JSON.stringify(rosters));
      localStorage.setItem(`sleeperUsers_${currentLeague.league_id}`, JSON.stringify(users));
      localStorage.setItem(`sleeperDraftPicks_${currentLeague.league_id}`, JSON.stringify(draftPicks));

      debugLog('Successfully refreshed league data');
    } catch (err) {
      debugLog('Error refreshing league data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh league data');
    } finally {
      setIsLoading(false);
    }
  }, [currentLeague?.league_id]);

  const setSelectedYear = React.useCallback((year: string | null) => {
    debugLog('Setting selected year:', year);
    setSelectedYearState(year);
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

      // Merge with existing leagues, avoiding duplicates by league name and year
      const mergedLeagues = [...existingLeagues];
      for (const league of fetchedLeagues) {
        const existingIndex = mergedLeagues.findIndex(l => 
          l.name === league.name && l.season === league.season
        );
        if (existingIndex === -1) {
          mergedLeagues.push(league);
        }
      }

      localStorage.setItem('sleeperLeagues', JSON.stringify(mergedLeagues));
      
      // Save each league individually to the database
      for (const league of fetchedLeagues) {
        await handleLeagueUpdate(league);
      }

      return fetchedLeagues;
    } catch (err) {
      debugLog('Error fetching leagues for year:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch leagues'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Function to fetch all available years for a league
  const fetchAvailableYearsForLeague = React.useCallback(async (leagueName: string, currentYear: string) => {
    debugLog('Fetching available years for league:', leagueName);
    const years: string[] = [];
    let year = parseInt(currentYear);
    
    // Add current year
    years.push(year.toString());
    
    // Look for previous years
    let previousYear = year - 1;
    let foundLeague = true;
    while (foundLeague && previousYear >= 2023) { // Limit to 2023
      try {
        const previousYearLeagues = await fetchLeaguesForYear(previousYear.toString());
        const previousLeague = previousYearLeagues.find(
          (league: SleeperLeague) => league.name === leagueName
        );
        
        if (previousLeague) {
          years.push(previousYear.toString());
          previousYear--;
        } else {
          foundLeague = false;
        }
      } catch (err) {
        debugLog('Error fetching previous year leagues:', err);
        foundLeague = false;
      }
    }
    
    // Look for future years
    let nextYear = year + 1;
    foundLeague = true;
    while (foundLeague && nextYear <= year + 1) { // Only look one year ahead
      try {
        const nextYearLeagues = await fetchLeaguesForYear(nextYear.toString());
        const nextLeague = nextYearLeagues.find(
          (league: SleeperLeague) => league.name === leagueName
        );
        
        if (nextLeague) {
          years.push(nextYear.toString());
          nextYear++;
        } else {
          foundLeague = false;
        }
      } catch (err) {
        debugLog('Error fetching next year leagues:', err);
        foundLeague = false;
      }
    }
    
    const sortedYears = years.sort((a, b) => b.localeCompare(a)); // Sort in descending order
    debugLog('Available years for league:', leagueName, sortedYears);
    return sortedYears;
  }, [fetchLeaguesForYear]);

  // Update available years when current league changes
  React.useEffect(() => {
    const updateAvailableYears = async () => {
      if (currentLeague && selectedYear) {
        try {
          debugLog('Fetching available years for league:', currentLeague.name);
          const years = await fetchAvailableYearsForLeague(currentLeague.name, selectedYear);
          debugLog('Setting available years:', years);
          setAvailableYears(years);
        } catch (err) {
          debugLog('Error fetching available years:', err);
          setError(toApiError(err));
        }
      }
    };

    updateAvailableYears();
  }, [currentLeague, selectedYear, fetchAvailableYearsForLeague]);

  // Also update available years when leagues change
  React.useEffect(() => {
    const updateAvailableYears = async () => {
      if (currentLeague && selectedYear && leagues.length > 0) {
        try {
          debugLog('Fetching available years for league:', currentLeague.name);
          const years = await fetchAvailableYearsForLeague(currentLeague.name, selectedYear);
          debugLog('Setting available years:', years);
          setAvailableYears(years);
        } catch (err) {
          debugLog('Error fetching available years:', err);
          setError(toApiError(err));
        }
      }
    };

    updateAvailableYears();
  }, [leagues, currentLeague, selectedYear, fetchAvailableYearsForLeague]);

  // Helper function to get available years
  const getAvailableYears = (): string[] => {
    return availableYears;
  };

  // Helper function to handle errors
  const handleError = (error: unknown): void => {
    setError(toApiError(error));
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    leagues,
    rosters,
    users,
    draftPicks,
    currentLeague,
    selectedYear,
    availableYears,
    isLoading,
    error,
    setCurrentLeague,
    setSelectedYear,
    setRosters,
    setUsers,
    setDraftPicks,
    setLeagues,
    setIsLoading,
    setError,
    fetchLeaguesForYear,
    refreshLeagueData
  }), [
    leagues,
    rosters,
    users,
    draftPicks,
    currentLeague,
    selectedYear,
    availableYears,
    isLoading,
    error,
    setCurrentLeague,
    setSelectedYear,
    setRosters,
    setUsers,
    setDraftPicks,
    setLeagues,
    fetchLeaguesForYear,
    refreshLeagueData
  ]);

  debugLog('LeagueContext state:', {
    currentLeague: currentLeague?.league_id,
    selectedYear,
    isLoading,
    error
  });

  // Effect to handle initial data loading
  React.useEffect(() => {
    if (currentLeague?.league_id) {
      handleLeagueChange(currentLeague.league_id);
    }
  }, [currentLeague?.league_id, handleLeagueChange]);

  // Effect to handle year changes
  React.useEffect(() => {
    if (selectedYear && currentLeague?.league_id) {
      handleYearChange(selectedYear);
    }
  }, [selectedYear, currentLeague?.league_id, handleYearChange]);

  // Handle successful league data fetch
  const handleLeagueDataFetch = (leagueId: string, data: { rosters?: SleeperRoster[], users?: SleeperUser[], draftPicks?: SleeperDraftPick[] }) => {
    if (data.rosters) {
      setRosters(data.rosters);
    }
    if (data.users) {
      setUsers(data.users);
    }
    if (data.draftPicks) {
      setDraftPicks(data.draftPicks);
    }
    // Update cache
    updateCache(leagueId, data);
  };

  // Handle league data update
  const handleLeagueUpdate = (league: SleeperLeague) => {
    setCurrentLeagueState(league);
    // Update cache
    localStorage.setItem(`league_${league.league_id}`, JSON.stringify(league));
  };

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

// Update cache after successful data fetch
const updateCache = (leagueId: string, data: { rosters?: SleeperRoster[], users?: SleeperUser[], draftPicks?: SleeperDraftPick[] }) => {
  if (data.rosters) {
    localStorage.setItem(`rosters_${leagueId}`, JSON.stringify(data.rosters));
  }
  if (data.users) {
    localStorage.setItem(`users_${leagueId}`, JSON.stringify(data.users));
  }
  if (data.draftPicks) {
    localStorage.setItem(`draftPicks_${leagueId}`, JSON.stringify(data.draftPicks));
  }
}; 