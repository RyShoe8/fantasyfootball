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
  settings: {
    waiver_type: number;
    waiver_day_of_week: number;
    waiver_clear_days: number;
    type: number;
    trade_review_days: number;
    trade_deadline: number;
    taxi_years: number;
    taxi_slots: number;
    taxi_allow_vets: number;
    start_week: number;
    reserve_slots: number;
    playoff_week_start: number;
    playoff_type: number;
    playoff_teams: number;
    pick_trading: number;
    offseason_adds: number;
    num_teams: number;
    max_keepers: number;
    leg: number;
    draft_rounds: number;
    daily_waivers_hour: number;
    daily_waivers: number;
    bench_slots: number;
    best_ball: number;
    auction_start_amount: number;
  };
  roster_positions: string[];
  metadata: {
    [key: string]: string;
  };
}

export interface SleeperRoster {
  roster_id: string;
  owner_id: string;
  league_id: string;
  starters: string[];
  reserves: string[];
  taxi: string[];
  settings: {
    wins: number;
    losses: number;
    fpts: number;
    fpts_decimal: number;
    fpts_against: number;
    fpts_against_decimal: number;
  };
  metadata?: {
    team_name?: string;
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
  injury_notes?: string;
  fantasy_positions: string[];
  active: boolean;
  search_full_name: string;
  search_first_name: string;
  search_last_name: string;
  search_rank: number;
  hashtag: string;
  depth_chart_position?: string;
  number?: string;
  age?: number;
  height?: string;
  weight?: string;
  college?: string;
  years_exp?: number;
  stats?: {
    [key: string]: number;
  };
} 