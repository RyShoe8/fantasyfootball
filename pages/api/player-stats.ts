import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const statsCollection = db.collection('player_stats');

    // Get the current season and week from the request
    const season = req.query.season || new Date().getFullYear();
    const week = req.query.week || '1';

    // Check if we have recent data (within last hour)
    const lastUpdate = await statsCollection.findOne({ season, week }, { sort: { updatedAt: -1 } });
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (lastUpdate && lastUpdate.updatedAt > oneHourAgo) {
      // Return cached data if it's less than an hour old
      const stats = await statsCollection.findOne({ season, week }, { projection: { _id: 0, updatedAt: 0 } });
      return res.status(200).json(stats?.stats || {});
    }

    // Fetch fresh data from Sleeper API
    const response = await axios.get(`https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}`);
    const stats = response.data;

    // Store in MongoDB with timestamp
    await statsCollection.deleteMany({ season, week }); // Clear old data
    await statsCollection.insertOne({
      season,
      week,
      stats,
      updatedAt: now
    });

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return res.status(500).json({ message: 'Error fetching player stats' });
  }
} 