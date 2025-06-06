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

import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { SleeperLeague } from '../types/sleeper';
import Link from 'next/link';
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
  const { user, login, isLoading, error, isHydrated } = useAuth();
  const { currentLeague, leagues, setCurrentLeague, selectedYear, availableYears, setSelectedYear } = useLeague();
  const [username, setUsername] = React.useState('');
  const [userLeagues, setUserLeagues] = React.useState<SleeperLeague[]>([]);

  // Auto-select the first league if available and no league is currently selected
  React.useEffect(() => {
    if (leagues.length > 0 && !currentLeague) {
      setCurrentLeague(leagues[0]);
    }
  }, [leagues, currentLeague, setCurrentLeague]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      await login(username);
      // After successful login, fetch user's leagues
      const response = await fetch(`${SLEEPER_API_BASE}/user/${username}/leagues/nfl/2023`);
      if (!response.ok) {
        throw new Error('Failed to fetch leagues');
      }
      const leagues = await response.json();
      setUserLeagues(leagues);
    } catch (err) {
      console.error('Error during login:', err);
    }
  };

  // Show loading state while auth is initializing
  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Fantasy OS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Fantasy OS</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Sleeper Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Sleeper username"
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error.message || 'An error occurred'}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isLoading ? 'Loading...' : 'View Stats'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {!currentLeague ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to Fantasy Football Stats</h2>
            <p className="text-gray-600 mb-4">Loading your leagues...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <DashboardLayout 
            league={currentLeague}
            selectedYear={selectedYear || ''}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
