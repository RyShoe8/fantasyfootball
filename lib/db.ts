/**
 * Database Utilities
 * 
 * This file provides functions for interacting with the local database.
 * It handles caching and persistence of data from the Sleeper API.
 * 
 * Note: This is a mock implementation. In a real application, this would
 * connect to a proper database like MongoDB, PostgreSQL, etc.
 */

import { SleeperUser, SleeperLeague, SleeperRoster, SleeperDraftPick } from '../types/sleeper';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[DB]', ...args);
  }
};

// Helper function to get data from localStorage
const getFromStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    debugLog(`Error getting data from storage for key ${key}:`, err);
    return null;
  }
};

// Helper function to save data to localStorage
const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    debugLog(`Data saved to storage for key ${key}`);
  } catch (err) {
    debugLog(`Error saving data to storage for key ${key}:`, err);
  }
};

// User data functions
export const getUserData = async (username: string): Promise<SleeperUser | null> => {
  debugLog('Getting user data for username:', username);
  const users = getFromStorage<SleeperUser[]>('sleeperUsers') || [];
  const user = users.find(u => u.username === username);
  debugLog('User found:', user ? 'Yes' : 'No');
  return user || null;
};

export const saveUserData = async (user: SleeperUser): Promise<void> => {
  debugLog('Saving user data:', user);
  const users = getFromStorage<SleeperUser[]>('sleeperUsers') || [];
  const existingIndex = users.findIndex(u => u.user_id === user.user_id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  saveToStorage('sleeperUsers', users);
};

// League data functions
export const getLeagueData = async (leagueId: string): Promise<SleeperLeague | null> => {
  debugLog('Getting league data for leagueId:', leagueId);
  const leagues = getFromStorage<SleeperLeague[]>('sleeperLeagues') || [];
  const league = leagues.find(l => l.league_id === leagueId);
  debugLog('League found:', league ? 'Yes' : 'No');
  return league || null;
};

export const saveLeagueData = async (league: SleeperLeague): Promise<void> => {
  debugLog('Saving league data:', league);
  const leagues = getFromStorage<SleeperLeague[]>('sleeperLeagues') || [];
  const existingIndex = leagues.findIndex(l => l.league_id === league.league_id);
  
  if (existingIndex >= 0) {
    leagues[existingIndex] = league;
  } else {
    leagues.push(league);
  }
  
  saveToStorage('sleeperLeagues', leagues);
};

// Roster data functions
export const getRosterData = async (leagueId: string, season: string): Promise<SleeperRoster[]> => {
  debugLog('Getting roster data for leagueId:', leagueId, 'season:', season);
  const key = `sleeperRosters_${leagueId}_${season}`;
  const rosters = getFromStorage<SleeperRoster[]>(key) || [];
  debugLog('Rosters found:', rosters.length);
  return rosters;
};

export const saveRosterData = async (roster: SleeperRoster): Promise<void> => {
  debugLog('Saving roster data:', roster);
  const leagueId = roster.league_id;
  const season = new Date().getFullYear().toString(); // This should be passed in a real app
  const key = `sleeperRosters_${leagueId}_${season}`;
  
  const rosters = getFromStorage<SleeperRoster[]>(key) || [];
  const existingIndex = rosters.findIndex(r => r.roster_id === roster.roster_id);
  
  if (existingIndex >= 0) {
    rosters[existingIndex] = roster;
  } else {
    rosters.push(roster);
  }
  
  saveToStorage(key, rosters);
};

// Draft pick data functions
export const getDraftPicks = async (leagueId: string, season: string): Promise<SleeperDraftPick[]> => {
  debugLog('Getting draft picks for leagueId:', leagueId, 'season:', season);
  const key = `sleeperDraftPicks_${leagueId}_${season}`;
  const draftPicks = getFromStorage<SleeperDraftPick[]>(key) || [];
  debugLog('Draft picks found:', draftPicks.length);
  return draftPicks;
};

export const saveDraftPick = async (draftPick: SleeperDraftPick): Promise<void> => {
  debugLog('Saving draft pick:', draftPick);
  const season = draftPick.season;
  const rosterId = draftPick.roster_id;
  const key = `sleeperDraftPicks_${rosterId}_${season}`;
  
  const draftPicks = getFromStorage<SleeperDraftPick[]>(key) || [];
  const existingIndex = draftPicks.findIndex(d => 
    d.round === draftPick.round && 
    d.roster_id === draftPick.roster_id &&
    d.season === draftPick.season
  );
  
  if (existingIndex >= 0) {
    draftPicks[existingIndex] = draftPick;
  } else {
    draftPicks.push(draftPick);
  }
  
  saveToStorage(key, draftPicks);
};

// Player data functions
export const getPlayerData = async (playerId: string): Promise<any | null> => {
  debugLog('Getting player data for playerId:', playerId);
  const players = getFromStorage<Record<string, any>>('sleeperPlayers') || {};
  const player = players[playerId];
  debugLog('Player found:', player ? 'Yes' : 'No');
  return player || null;
};

export const savePlayerData = async (playerId: string, playerData: any): Promise<void> => {
  debugLog('Saving player data for playerId:', playerId);
  const players = getFromStorage<Record<string, any>>('sleeperPlayers') || {};
  players[playerId] = playerData;
  saveToStorage('sleeperPlayers', players);
}; 