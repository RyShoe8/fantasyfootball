import { ObjectId } from 'mongodb';

export interface LeagueData {
  _id?: ObjectId;
  league_id: string;
  year: string;
  name: string;
  status: string;
  settings: {
    type: number;
    playoff_teams: number;
    playoff_week_start: number;
    start_week: number;
    trade_deadline: number;
    roster_positions: string[];
  };
  lastUpdated: Date;
}

export interface RosterData {
  _id?: ObjectId;
  roster_id: string;
  league_id: string;
  year: string;
  owner_id: string;
  starters: string[];
  reserves: string[];
  taxi: string[];
  ir: string[];
  lastUpdated: Date;
}

export interface PlayerData {
  _id?: ObjectId;
  player_id: string;
  name: string;
  position: string;
  team: string;
  status: string;
  lastUpdated: Date;
}

export interface UserData {
  _id?: ObjectId;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
  lastUpdated: Date;
}

export interface DraftPickData {
  _id?: ObjectId;
  pick_id: string;
  league_id: string;
  year: string;
  owner_id: string;
  round: number;
  pick: number;
  lastUpdated: Date;
} 