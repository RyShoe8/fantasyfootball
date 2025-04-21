/**
 * Sleeper API Type Declarations
 * 
 * Type definitions for all Sleeper API responses and data structures.
 */

// User Types
export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
}

// League Types
export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  settings: {
    waiver_type: number;
    waiver_day_of_week: number;
    waiver_clear_days: number;
    type: number;
    trade_review_period: number;
    trade_deadline: number;
    taxi_years: number;
    taxi_slots: number;
    taxi_allow_vets: number;
    taxi_deadline: number;
    start_week: number;
    reserve_slots: number;
    playoff_week_start: number;
    playoff_type: number;
    playoff_teams: number;
    pick_trade_deadline: number;
    offseason_settings: {
      waiver_type: number;
      waiver_day_of_week: number;
      waiver_clear_days: number;
      type: number;
      trade_review_period: number;
      trade_deadline: number;
      taxi_years: number;
      taxi_slots: number;
      taxi_allow_vets: number;
      taxi_deadline: number;
      start_week: number;
      reserve_slots: number;
      playoff_week_start: number;
      playoff_type: number;
      playoff_teams: number;
      pick_trade_deadline: number;
    };
    num_teams: number;
    leg: number;
    draft_rounds: number;
    daily_waivers_hour: number;
    daily_waivers: number;
    bench_slots: number;
    best_ball: number;
    auction_budget: number;
    allow_adding_players: number;
  };
  roster_positions: string[];
  previous_league_id: string;
  bracket_id: string;
  total_rosters: number;
  metadata: {
    [key: string]: string;
  };
}

// Roster Types
export interface SleeperRoster {
  roster_id: string;
  owner_id: string;
  league_id: string;
  starters: string[];
  reserves: string[];
  taxi: string[];
  ir: string[];
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal: number;
    fpts_against: number;
    fpts_against_decimal: number;
    division: number;
    ppts: number;
    ppts_decimal: number;
    ppts_against: number;
    ppts_against_decimal: number;
  };
  players: string[];
  metadata: {
    [key: string]: string;
  };
}

// Player Types
export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  team: string;
  age: number;
  height: string;
  weight: string;
  college: string;
  status: string;
  injury_status?: string;
  injury_notes?: string;
  active: boolean;
  search_rank: number;
  fantasy_positions: string[];
  stats?: {
    [key: string]: number;
  };
}

// Player Stats Types
export interface SleeperPlayerStats {
  player_id: string;
  season: string;
  week: string;
  stats: {
    pts_ppr: number;
    pts_standard: number;
    pts_half_ppr: number;
    pts_custom: number;
    [key: string]: number;
  };
}

// Draft Types
export interface SleeperDraftPick {
  draft_id: string;
  league_id: string;
  season: string;
  round: number;
  pick_no: number;
  roster_id: string;
  player_id: string;
  picked_by: string;
  status: string;
  metadata: {
    [key: string]: string;
  };
}

// Matchup Types
export interface SleeperMatchup {
  matchup_id: string;
  league_id: string;
  season: string;
  week: number;
  roster_id: string;
  opponent_roster_id: string;
  points: number;
  opponent_points: number;
  starters: string[];
  reserves: string[];
  taxi: string[];
  players: string[];
  starters_points: number;
  reserves_points: number;
  taxi_points: number;
  players_points: number;
  metadata: {
    [key: string]: string;
  };
}

// Transaction Types
export interface SleeperTransaction {
  transaction_id: string;
  type: string;
  status: string;
  roster_ids: string[];
  adds: {
    [key: string]: string;
  };
  drops: {
    [key: string]: string;
  };
  draft_picks: string[];
  created: number;
  metadata: {
    [key: string]: string;
  };
} 