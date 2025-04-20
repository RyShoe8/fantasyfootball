import { ObjectId } from 'mongodb';
import { SleeperLeague, SleeperRoster, SleeperPlayer, SleeperUser, SleeperDraftPick } from '../types/sleeper';

export interface LeagueData extends SleeperLeague {
  _id?: ObjectId;
  lastUpdated: Date;
}

export interface RosterData extends SleeperRoster {
  _id?: ObjectId;
  lastUpdated: Date;
}

export interface PlayerData extends SleeperPlayer {
  _id?: ObjectId;
  lastUpdated: Date;
}

export interface UserData extends SleeperUser {
  _id?: ObjectId;
  lastUpdated: Date;
}

export interface DraftPickData extends SleeperDraftPick {
  _id?: ObjectId;
  lastUpdated: Date;
} 