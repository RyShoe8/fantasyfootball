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

import LeagueInfo from '../components/LeagueInfo';
import { useSleeper } from '../contexts/SleeperContext';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SleeperLeague } from '../types/sleeper';

// Helper function to format API response data
const formatApiResponse = (data: any, type: string) => {
  switch (type) {
    case 'user':
      return {
        username: data.username,
        display_name: data.display_name,
        user_id: data.user_id,
        avatar: data.avatar
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
        starters: roster.starters,
        reserves: roster.reserves || [],
        players: roster.players?.length || 0
      }));
    case 'players':
      return `Total players: ${Object.keys(data).length}`;
    default:
      return data;
  }
};

export default function Home() {
  // Get league, roster, and player data from the Sleeper context
  const { currentLeague, leagues, rosters, players, user } = useSleeper();
  const router = useRouter();
  const [showDebug, setShowDebug] = useState(false);
  
  // Find the current roster (assuming it's the first one for now)
  const currentRoster = rosters.length > 0 ? rosters[0] : null;

  // Helper function to format league settings for display
  const formatLeagueSetting = (value: any): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    return value || 'N/A';
  };

  // Helper function to format JSON for display
  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (err) {
      return 'Error formatting JSON';
    }
  };

  console.log('Home - currentLeague:', currentLeague);
  console.log('Home - currentRoster:', currentRoster);
  console.log('Home - players:', players ? Object.keys(players).length : 0, 'players loaded');

  return (
    <div className="space-y-6">
      {/* League Information Component */}
      {currentLeague && <LeagueInfo />}
      
      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Team Overview Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Team Overview</h2>
          {currentRoster ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-gray-600">Team Name: {currentRoster.roster_id || 'Unnamed Team'}</p>
                <p className="text-gray-600">Record: {currentRoster.settings.wins}-{currentRoster.settings.losses}</p>
                <p className="text-gray-600">Total Points: {currentRoster.settings.fpts}</p>
              </div>
              <button
                onClick={() => router.push('/roster')}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View Roster
              </button>
            </div>
          ) : (
            <p className="text-gray-600">Select a team to view overview.</p>
          )}
        </div>

        {/* Trade Evaluator Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Trade Evaluator</h2>
          <p className="text-gray-600 mb-4">Evaluate potential trades with our advanced analytics.</p>
          <button
            onClick={() => router.push('/trade-evaluator')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Build Trade
          </button>
        </div>

        {/* Historical Data Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Historical Data</h2>
          <p className="text-gray-600">Access historical performance data and trends.</p>
          <p className="text-sm text-gray-500 mt-2">Coming Soon</p>
        </div>

        {/* Virtual Assistant Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Virtual Assistant</h2>
          <p className="text-gray-600">Get AI-powered advice for your fantasy decisions.</p>
          <p className="text-sm text-gray-500 mt-2">Coming Soon</p>
        </div>

        {/* League Standings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">League Standings</h2>
          {currentLeague ? (
            <div className="space-y-2">
              <p className="text-gray-600">League Name: {currentLeague.name}</p>
              <p className="text-gray-600">Season: {currentLeague.season}</p>
              <p className="text-gray-600">Status: {currentLeague.status}</p>
            </div>
          ) : (
            <p className="text-gray-600">Select a league to view standings.</p>
          )}
        </div>

        {/* Player Rankings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Player Rankings</h2>
          {players && Object.keys(players).length > 0 ? (
            <div className="space-y-2">
              <p className="text-gray-600">Loaded {Object.keys(players).length} players</p>
              <p className="text-sm text-gray-500">Click to view detailed rankings</p>
            </div>
          ) : (
            <p className="text-gray-600">Loading player data...</p>
          )}
        </div>
      </div>

      {/* API Debug Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">API Debug</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              fetch(`https://api.sleeper.app/v1/league/${currentLeague?.league_id}/rosters`)
                .then(res => res.json())
                .then(data => {
                  console.log('Rosters API Response:', data);
                  // Update the rosters in the context
                  const formattedRosters = data.map((roster: any) => ({
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
                  console.log('Formatted Rosters:', formattedRosters);
                })
                .catch(err => console.error('Error fetching rosters:', err));
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Fetch Rosters
          </button>
          <button
            onClick={() => {
              fetch(`https://api.sleeper.app/v1/league/${currentLeague?.league_id}/users`)
                .then(res => res.json())
                .then(data => {
                  console.log('Users API Response:', data);
                  // Update the users in the context
                  const formattedUsers = data.map((user: any) => ({
                    user_id: user.user_id,
                    username: user.username,
                    display_name: user.display_name,
                    avatar: user.avatar,
                    metadata: user.metadata || {}
                  }));
                  console.log('Formatted Users:', formattedUsers);
                })
                .catch(err => console.error('Error fetching users:', err));
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Fetch Users
          </button>
          <button
            onClick={() => {
              fetch('https://api.sleeper.app/v1/players/nfl')
                .then(res => res.json())
                .then(data => {
                  console.log('Players API Response:', data);
                  // Update the players in the context
                  console.log('Total Players:', Object.keys(data).length);
                })
                .catch(err => console.error('Error fetching players:', err));
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            Fetch Players
          </button>
          <button
            onClick={() => {
              fetch(`https://api.sleeper.app/v1/league/${currentLeague?.league_id}`)
                .then(res => res.json())
                .then(data => {
                  console.log('League API Response:', data);
                  // Update the league in the context
                  console.log('League Settings:', data.settings);
                })
                .catch(err => console.error('Error fetching league:', err));
            }}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Fetch League
          </button>
        </div>
      </div>
    </div>
  );
}
