import clientPromise from './mongodb';
import { LeagueData, RosterData, PlayerData, UserData, DraftPickData } from './models';

export async function getLeagueData(leagueId: string, year: string): Promise<LeagueData | null> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  return db.collection('leagues').findOne({ league_id: leagueId, year });
}

export async function saveLeagueData(data: LeagueData): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  await db.collection('leagues').updateOne(
    { league_id: data.league_id, year: data.year },
    { $set: { ...data, lastUpdated: new Date() } },
    { upsert: true }
  );
}

export async function getRosterData(leagueId: string, year: string): Promise<RosterData[]> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  return db.collection('rosters').find({ league_id: leagueId, year }).toArray();
}

export async function saveRosterData(data: RosterData): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  await db.collection('rosters').updateOne(
    { roster_id: data.roster_id, year: data.year },
    { $set: { ...data, lastUpdated: new Date() } },
    { upsert: true }
  );
}

export async function getPlayerData(playerId: string): Promise<PlayerData | null> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  return db.collection('players').findOne({ player_id: playerId });
}

export async function savePlayerData(data: PlayerData): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  await db.collection('players').updateOne(
    { player_id: data.player_id },
    { $set: { ...data, lastUpdated: new Date() } },
    { upsert: true }
  );
}

export async function getUserData(userId: string): Promise<UserData | null> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  return db.collection('users').findOne({ user_id: userId });
}

export async function saveUserData(data: UserData): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  await db.collection('users').updateOne(
    { user_id: data.user_id },
    { $set: { ...data, lastUpdated: new Date() } },
    { upsert: true }
  );
}

export async function getDraftPicks(leagueId: string, year: string): Promise<DraftPickData[]> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  return db.collection('draftpicks').find({ league_id: leagueId, year }).toArray();
}

export async function saveDraftPick(data: DraftPickData): Promise<void> {
  const client = await clientPromise;
  const db = client.db('fantasyfootball');
  await db.collection('draftpicks').updateOne(
    { pick_id: data.pick_id },
    { $set: { ...data, lastUpdated: new Date() } },
    { upsert: true }
  );
} 