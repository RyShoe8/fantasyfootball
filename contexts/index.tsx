/**
 * Context Index
 * 
 * Exports all context providers and provides a combined provider for the application.
 * This file serves as the central point for context management.
 */

import React from 'react';
import { AuthProvider, useAuth as useAuthOriginal } from './auth';
import { LeagueProvider, useLeague as useLeagueOriginal } from './league/LeagueContext';
import { PlayerProvider, usePlayer as usePlayerOriginal } from './player/PlayerContext';
import { RosterProvider, useRoster as useRosterOriginal } from './roster';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility with timestamps
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ContextProvider]`, ...args);
  }
};

export function ContextProvider({ children }: { children: React.ReactNode }) {
  debugLog('Starting ContextProvider initialization');
  
  // Track mount state
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    debugLog('ContextProvider mounted');
    setIsMounted(true);
    return () => {
      debugLog('ContextProvider unmounting');
      setIsMounted(false);
    };
  }, []);

  // Use React.memo to prevent unnecessary re-renders
  const MemoizedChildren = React.useMemo(() => {
    debugLog('Memoizing children');
    return children;
  }, [children]);

  debugLog('Rendering ContextProvider with children');
  
  return (
    <AuthProvider>
      <LeagueProvider>
        <PlayerProvider>
          <RosterProvider>
            {MemoizedChildren}
          </RosterProvider>
        </PlayerProvider>
      </LeagueProvider>
    </AuthProvider>
  );
}

// Re-export all context hooks with debug wrappers
export const useAuth = () => {
  debugLog('useAuth hook called');
  return useAuthOriginal();
};

export const useLeague = () => {
  debugLog('useLeague hook called');
  return useLeagueOriginal();
};

export const usePlayer = () => {
  debugLog('usePlayer hook called');
  return usePlayerOriginal();
};

export const useRoster = () => {
  debugLog('useRoster hook called');
  return useRosterOriginal();
}; 