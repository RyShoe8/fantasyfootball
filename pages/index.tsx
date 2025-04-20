import LeagueInfo from '../components/LeagueInfo';
import { useSleeper } from '../contexts/SleeperContext';

export default function Home() {
  const { currentLeague, rosters, players } = useSleeper();
  
  // Find the current roster (assuming it's the first one for now)
  const currentRoster = rosters.length > 0 ? rosters[0] : null;

  console.log('Home - currentLeague:', currentLeague);
  console.log('Home - currentRoster:', currentRoster);
  console.log('Home - players:', players ? Object.keys(players).length : 0, 'players loaded');

  return (
    <div className="space-y-6">
      {currentLeague && <LeagueInfo />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Team Overview Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Team Overview</h2>
          {currentRoster ? (
            <div className="space-y-2">
              <p className="text-gray-600">Team Name: {currentRoster.roster_id || 'Unnamed Team'}</p>
              <p className="text-gray-600">Record: {currentRoster.settings.wins}-{currentRoster.settings.losses}</p>
              <p className="text-gray-600">Total Points: {currentRoster.settings.fpts}</p>
            </div>
          ) : (
            <p className="text-gray-600">Select a team to view overview.</p>
          )}
        </div>

        {/* Trade Evaluator Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Trade Evaluator</h2>
          <p className="text-gray-600">Evaluate potential trades with our advanced analytics.</p>
        </div>

        {/* Historical Data Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Historical Data</h2>
          <p className="text-gray-600">Access historical performance data and trends.</p>
        </div>

        {/* Virtual Assistant Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Virtual Assistant</h2>
          <p className="text-gray-600">Get AI-powered advice for your fantasy decisions.</p>
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
            <p className="text-gray-600">Loaded {Object.keys(players).length} players</p>
          ) : (
            <p className="text-gray-600">Loading player data...</p>
          )}
        </div>
      </div>
    </div>
  );
}
