import clientPromise from './mongodb';
import { LeagueData, RosterData, PlayerData, UserData, DraftPickData } from './models';
import { SleeperLeague, SleeperRoster, SleeperPlayer, SleeperUser, SleeperDraftPick } from '../types/sleeper';

const addLastUpdated = <T>(data: T): T & { lastUpdated: Date } => ({
  ...data,
  lastUpdated: new Date()
});

export async function getLeagueData(leagueId: string, year: string): Promise<SleeperLeague | null> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const data = await db.collection('leagues').findOne({ league_id: leagueId, season: year });
  if (!data) return null;
  const { _id, lastUpdated, ...league } = data as LeagueData;
  return league;
}

export async function saveLeagueData(data: SleeperLeague): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const leagueData = addLastUpdated(data);
  await db.collection('leagues').updateOne(
    { league_id: data.league_id, season: data.season },
    { $set: leagueData },
    { upsert: true }
  );
}

export async function getRosterData(leagueId: string, year: string): Promise<SleeperRoster[]> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const data = await db.collection('rosters').find({ league_id: leagueId }).toArray();
  return data.map(({ _id, lastUpdated, ...roster }) => roster as SleeperRoster);
}

export async function saveRosterData(data: SleeperRoster): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const rosterData = addLastUpdated(data);
  await db.collection('rosters').updateOne(
    { roster_id: data.roster_id },
    { $set: rosterData },
    { upsert: true }
  );
}

export async function getPlayerData(playerId: string): Promise<SleeperPlayer | null> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const data = await db.collection('players').findOne({ player_id: playerId });
  if (!data) return null;
  const { _id, lastUpdated, ...player } = data as PlayerData;
  return player;
}

export async function savePlayerData(data: SleeperPlayer): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const playerData = addLastUpdated(data);
  await db.collection('players').updateOne(
    { player_id: data.player_id },
    { $set: playerData },
    { upsert: true }
  );
}

export async function getUserData(userId: string): Promise<SleeperUser | null> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const data = await db.collection('users').findOne({ user_id: userId });
  if (!data) return null;
  const { _id, lastUpdated, ...user } = data as UserData;
  return user;
}

export async function saveUserData(data: SleeperUser): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const userData = addLastUpdated(data);
  await db.collection('users').updateOne(
    { user_id: data.user_id },
    { $set: userData },
    { upsert: true }
  );
}

export async function getDraftPicks(leagueId: string, year: string): Promise<SleeperDraftPick[]> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const data = await db.collection('draftpicks').find({ league_id: leagueId }).toArray();
  return data.map(({ _id, lastUpdated, ...pick }) => pick as SleeperDraftPick);
}

export async function saveDraftPick(data: SleeperDraftPick): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  const pickData = addLastUpdated(data);
  await db.collection('draftpicks').updateOne(
    { draft_id: data.draft_id, player_id: data.player_id },
    { $set: pickData },
    { upsert: true }
  );
} 