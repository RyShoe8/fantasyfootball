import React, { ChangeEvent, useState } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperLeague } from '../types/sleeper';

export default function LeagueInfo() {
  const { currentLeague, leagues, setCurrentLeague } = useSleeper();
  const [showDebug, setShowDebug] = useState(false);

  console.log('LeagueInfo - currentLeague:', currentLeague);
  console.log('LeagueInfo - leagues:', leagues);

  if (!currentLeague) {
    console.log('LeagueInfo - No current league selected');
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{currentLeague.name}</h2>
        <select
          className="mt-1 block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={currentLeague.league_id}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            console.log('LeagueInfo - League selection changed:', e.target.value);
            const league = leagues.find((l: SleeperLeague) => l.league_id === e.target.value);
            if (league) {
              console.log('LeagueInfo - Setting new current league:', league);
              setCurrentLeague(league);
            }
          }}
        >
          {leagues.map((league: SleeperLeague) => (
            <option key={league.league_id} value={league.league_id}>
              {league.name} ({league.season})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* League Settings Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">League Settings</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Teams</dt>
              <dd className="text-gray-900">{currentLeague.settings.num_teams}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Roster Positions</dt>
              <dd className="text-gray-900">{currentLeague.roster_positions.join(', ')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Waiver Type</dt>
              <dd className="text-gray-900">{currentLeague.settings.waiver_type === 0 ? 'Standard' : 'FAAB'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Trade Deadline</dt>
              <dd className="text-gray-900">Week {currentLeague.settings.trade_deadline}</dd>
            </div>
          </dl>
        </div>

        {/* Season Info Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Season Info</h3>
          <dl className="space-y-2">
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
            <div className="flex justify-between">
              <dt className="text-gray-600">Draft Rounds</dt>
              <dd className="text-gray-900">{currentLeague.settings.draft_rounds}</dd>
            </div>
          </dl>
        </div>

        {/* Playoff Info Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Playoff Info</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Playoff Teams</dt>
              <dd className="text-gray-900">{currentLeague.settings.playoff_teams}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Playoff Week Start</dt>
              <dd className="text-gray-900">{currentLeague.settings.playoff_week_start}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Playoff Type</dt>
              <dd className="text-gray-900">{currentLeague.settings.playoff_type === 0 ? 'Single Elimination' : 'Two Rounds'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 