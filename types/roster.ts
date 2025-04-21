/**
 * Roster interface representing a fantasy football team's roster
 * This is our internal representation, derived from SleeperRoster
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