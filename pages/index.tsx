/**
 * Dashboard Page (Home)
 * 
 * This is the main dashboard of the Fantasy Football application.
 * It displays an overview of the user's league, team, and provides
 * access to various features like roster management, trade evaluation,
 * and player rankings.
 * 
 * Key features:
 * - League information display
 * - Team overview with record and points
 * - Quick access to roster management
 * - Trade evaluation tool
 * - Placeholder cards for upcoming features
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import LeagueInfo from '../components/LeagueInfo';
import LeagueStandings from '../components/LeagueStandings';
import { SleeperLeague } from '../types/sleeper';
import axios from 'axios';
import DebugSection from '../components/DebugSection';
import Link from 'next/link';
import TeamOverview from '../components/TeamOverview';
import PlayerRankings from '../components/PlayerRankings';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

// Helper function to format API response data
const formatApiResponse = (data: any, type: string) => {
  switch (type) {
    case 'user':
      return {
        username: data.username,
        display_name: data.display_name,
        user_id: data.user_id,
        avatar: data.avatar,
        metadata: data.metadata || {}
      };
    case 'league':
      return {
        name: data.name,
        league_id: data.league_id,
        season: data.season,
        status: data.status,
        total_rosters: data.total_rosters,
        roster_positions: data.roster_positions,
        settings: {
          num_teams: data.settings.num_teams,
          playoff_teams: data.settings.playoff_teams,
          waiver_type: data.settings.waiver_type,
          waiver_budget: data.settings.waiver_budget
        }
      };
    case 'rosters':
      return data.map((roster: any) => ({
        roster_id: roster.roster_id,
        owner_id: roster.owner_id,
        team_name: roster.metadata?.team_name || `Team ${roster.roster_id}`,
        starters: roster.starters || [],
        reserves: roster.reserve || [],
        taxi: roster.taxi || [],
        ir: roster.ir || [],
        players: roster.players || [],
        settings: roster.settings || {}
      }));
    case 'players':
      return `Total players: ${Object.keys(data).length}`;
    case 'draft_picks':
      return data.map((pick: any) => ({
        round: pick.round,
        roster_id: pick.roster_id,
        owner_id: pick.owner_id,
        player_id: pick.player_id,
        picked_by: pick.picked_by,
        metadata: pick.metadata || {}
      }));
    default:
      return data;
  }
};

const Home: React.FC = () => {
  const router = useRouter();
  const { user, login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [userLeagues, setUserLeagues] = useState<SleeperLeague[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) return;

    setIsSubmitting(true);
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/user/${username}/leagues/nfl/2023`);
      const leagues: SleeperLeague[] = response.data;
      setUserLeagues(leagues);
      await login(username);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Fantasy Football Stats</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Sleeper Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Sleeper username"
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error.message}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'Loading...' : 'View Stats'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <LeagueInfo />
        <TeamOverview />
        <LeagueStandings />
        <DebugSection />
      </div>
    </div>
  );
};

export default Home;
