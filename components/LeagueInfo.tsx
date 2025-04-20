import React from 'react';
import { useSleeper } from '../contexts/SleeperContext';

export default function LeagueInfo() {
  const { currentLeague, leagues, setCurrentLeague } = useSleeper();

  if (!currentLeague) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{currentLeague.name}</h2>
        <select
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={currentLeague.league_id}
          onChange={(e) => {
            const league = leagues.find(l => l.league_id === e.target.value);
            if (league) {
              setCurrentLeague(league);
            }
          }}
        >
          {leagues.map((league) => (
            <option key={league.league_id} value={league.league_id}>
              {league.name} ({league.season})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">League Settings</h3>
          <dl className="mt-2 space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Teams</dt>
              <dd className="text-gray-900">{currentLeague.settings.num_teams}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Roster Positions</dt>
              <dd className="text-gray-900">{currentLeague.roster_positions.join(', ')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Bench Slots</dt>
              <dd className="text-gray-900">{currentLeague.settings.bench_slots}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">Season Info</h3>
          <dl className="mt-2 space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Season</dt>
              <dd className="text-gray-900">{currentLeague.season}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Status</dt>
              <dd className="text-gray-900">{currentLeague.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Start Week</dt>
              <dd className="text-gray-900">{currentLeague.settings.start_week}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">Playoff Info</h3>
          <dl className="mt-2 space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Playoff Teams</dt>
              <dd className="text-gray-900">{currentLeague.settings.playoff_teams}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Playoff Week Start</dt>
              <dd className="text-gray-900">{currentLeague.settings.playoff_week_start}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Trade Deadline</dt>
              <dd className="text-gray-900">Week {currentLeague.settings.trade_deadline}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 