import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const playersCollection = db.collection('players');

    // Check if we have recent data (within last 24 hours)
    const lastUpdate = await playersCollection.findOne({}, { sort: { updatedAt: -1 } });
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (lastUpdate && lastUpdate.updatedAt > oneDayAgo) {
      // Return cached data if it's less than 24 hours old
      const players = await playersCollection.find({}, { projection: { _id: 0, updatedAt: 0 } }).toArray();
      return res.status(200).json(players[0]?.players || {});
    }

    // Fetch fresh data from Sleeper API
    const response = await axios.get('https://api.sleeper.app/v1/players/nfl');
    const players = response.data;

    // Store in MongoDB with timestamp
    await playersCollection.deleteMany({}); // Clear old data
    await playersCollection.insertOne({
      players,
      updatedAt: now
    });

    return res.status(200).json(players);
  } catch (error) {
    console.error('Error fetching player data:', error);
    return res.status(500).json({ message: 'Error fetching player data' });
  }
} 