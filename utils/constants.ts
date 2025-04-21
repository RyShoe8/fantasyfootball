/**
 * Application constants
 */

// Debug flag - set to true to enable detailed logging
export const DEBUG = {
  FILTERS: false,
  API_CALLS: false,
  CONTEXT: false,
  COMPONENTS: false
} as const;

// API Base URLs
export const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

// Position Groups
export const POSITION_GROUPS = {
  QB: 'QB',
  RB: 'RB',
  WR: 'WR',
  TE: 'TE',
  K: 'K',
  DEF: 'DEF'
} as const;

// Roster Slots
export const ROSTER_SLOTS = {
  STARTER: 'starter',
  BENCH: 'bench',
  IR: 'ir',
  TAXI: 'taxi'
};

// League Settings
export const LEAGUE_SETTINGS = {
  DEFAULT_SEASON: new Date().getFullYear().toString(),
  MAX_WEEK: 18,
  MIN_WEEK: 1,
  PLAYOFF_START_WEEK: 15
};

// Cache Settings
export const CACHE_SETTINGS = {
  PLAYER_DATA_TTL: 24 * 60 * 60 * 1000, // 24 hours
  LEAGUE_DATA_TTL: 60 * 60 * 1000, // 1 hour
  ROSTER_DATA_TTL: 5 * 60 * 1000 // 5 minutes
};

// UI Constants
export const UI_CONSTANTS = {
  LOADING_DELAY: 500, // ms
  DEBOUNCE_DELAY: 300, // ms
  MAX_PLAYERS_DISPLAY: 50,
  ITEMS_PER_PAGE: 20
};

// Sort Options
export const SORT_OPTIONS = {
  NAME: 'name',
  POINTS: 'points',
  PROJECTED: 'projected',
  POSITION: 'position',
  TEAM: 'team'
} as const;

// Filter Options
export const FILTER_OPTIONS = {
  ALL: 'all',
  STARTERS: 'starters',
  BENCH: 'bench',
  AVAILABLE: 'available'
} as const;

// Default values for filters
export const DEFAULT_FILTERS = {
  MIN_POINTS: 0,
  MAX_POINTS: 999
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found. Please check your username and try again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  LEAGUE_NOT_FOUND: 'League not found. Please check the league ID and try again.',
  ROSTER_NOT_FOUND: 'Roster not found. Please check the roster ID and try again.',
  INVALID_WEEK: 'Invalid week number. Please select a week between 1 and 18.',
  INVALID_SEASON: 'Invalid season. Please select a valid season year.'
}; 