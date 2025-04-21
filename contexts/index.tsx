/**
 * Context Index
 * 
 * Exports all context providers and provides a combined provider for the application.
 * This file serves as the central point for context management.
 */

import React from 'react';
import { AuthProvider } from './auth';
import { LeagueProvider } from './league/LeagueContext';
import { PlayerProvider } from './player/PlayerContext';
import { RosterProvider } from './roster';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[ContextProvider]', ...args);
  }
};

export function ContextProvider({ children }: { children: React.ReactNode }) {
  debugLog('Initializing ContextProvider');

  return (
    <AuthProvider>
      <LeagueProvider>
        <PlayerProvider>
          <RosterProvider>
            {children}
          </RosterProvider>
        </PlayerProvider>
      </LeagueProvider>
    </AuthProvider>
  );
}

// Re-export all context hooks
export { useAuth } from './auth';
export { useLeague } from './league/LeagueContext';
export { usePlayer } from './player/PlayerContext';
export { useRoster } from './roster'; 