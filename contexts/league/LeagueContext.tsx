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

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SleeperLeague, SleeperRoster, SleeperUser, SleeperDraftPick } from '../../types/sleeper';
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
  selectedWeek: string;
  selectedYear: string;
  isLoading: boolean;
  error: string | null;
  setCurrentLeague: (league: SleeperLeague | null) => Promise<void>;
  setSelectedWeek: (week: string) => void;
  setSelectedYear: (year: string) => Promise<void>;
  setRosters: (rosters: SleeperRoster[]) => void;
  setUsers: (users: SleeperUser[]) => void;
  setDraftPicks: (draftPicks: SleeperDraftPick[]) => void;
  setLeagues: (leagues: SleeperLeague[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  debugLog('Initializing LeagueProvider');

  const [leagues, setLeagues] = useState<SleeperLeague[]>([]);
  const [rosters, setRosters] = useState<SleeperRoster[]>([]);
  const [users, setUsers] = useState<SleeperUser[]>([]);
  const [draftPicks, setDraftPicks] = useState<SleeperDraftPick[]>([]);
  const [currentLeague, setCurrentLeagueState] = useState<SleeperLeague | null>(null);
  const [selectedWeek, setSelectedWeekState] = useState<string>('1');
  const [selectedYear, setSelectedYearState] = useState<string>(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRosters = useCallback(async (leagueId: string) => {
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

  const fetchUsers = useCallback(async (leagueId: string) => {
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

  const setCurrentLeague = useCallback(async (league: SleeperLeague | null) => {
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

  const setSelectedWeek = useCallback((week: string) => {
    debugLog('Setting selected week:', week);
    setSelectedWeekState(week);
  }, []);

  const setSelectedYear = useCallback(async (year: string) => {
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
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
} 