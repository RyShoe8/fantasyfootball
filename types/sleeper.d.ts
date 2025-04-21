/**
 * Sleeper API Type Declarations
 */

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  settings: any;
  roster_positions: string[];
  scoring_settings: any;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  players: string[];
  starters: string[];
  reserve: string[];
  settings: {
    wins: number;
    waiver_position: number;
    waiver_budget_used: number;
    total_moves: number;
    ties: number;
    losses: number;
    fpts_decimal: number;
    fpts_against_decimal: number;
    fpts_against: number;
    fpts: number;
  };
}

/**
 * Internal representation of a roster, derived from SleeperRoster
 */
export interface Roster {
  roster_id: string;
  owner_id: string;
  starters: string[];
  reserves: string[];
  taxi: string[];
  ir: string[];
  players: string[];
  metadata: {
    division: string;
    streak: string;
    record: string;
    team_name?: string;
    [key: string]: string | undefined;
  };
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal: number;
    fpts_against: number;
    fpts_against_decimal: number;
    ppts: number;
    ppts_decimal: number;
    ppts_against: number;
    ppts_against_decimal: number;
    [key: string]: number | undefined;
  };
}

export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  status: string;
  injury_status?: string;
  depth_chart_order?: number;
  age?: number;
  experience?: number;
  fantasy_positions: string[];
  projected_pts?: number;
  stats?: PlayerStats;
}

export interface PlayerStats {
  pts_ppr?: number;
  pts_half_ppr?: number;
  pts_std?: number;
  [key: string]: number | undefined;
} 