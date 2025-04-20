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

export default function Home() {
  // Get league, roster, and player data from the Sleeper context
  const { currentLeague, rosters, players } = useSleeper();
  const router = useRouter();
  
  // Find the current roster (assuming it's the first one for now)
  const currentRoster = rosters.length > 0 ? rosters[0] : null;

  // Helper function to format league settings for display
  const formatLeagueSetting = (value: any): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    return value || 'N/A';
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
    </div>
  );
}
