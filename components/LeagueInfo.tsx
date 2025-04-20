import React from 'react';
import { useSleeper } from '../contexts/SleeperContext';

// Helper function to format roster positions
const formatRosterPositions = (positions: string[]) => {
  const positionCounts: Record<string, number> = {};
  
  positions.forEach(pos => {
    if (pos === 'BN') {
      positionCounts['Bench'] = (positionCounts['Bench'] || 0) + 1;
    } else {
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    }
  });
  
  return Object.entries(positionCounts)
    .map(([pos, count]) => `${pos}${count > 1 ? ` (${count})` : ''}`)
    .join(', ');
};

// Helper function to format status
const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'pre_draft': 'Pre-Draft',
    'drafting': 'Drafting',
    'in_season': 'In Season',
    'complete': 'Complete',
    'off_season': 'Off Season'
  };
  
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to get date for a given week
const getDateForWeek = (week: number, season: string) => {
  // This is a simplified version - in a real app, you'd use a proper NFL schedule API
  const seasonStart = new Date(parseInt(season), 7, 1); // August 1st of the season year
  const weekDate = new Date(seasonStart);
  weekDate.setDate(weekDate.getDate() + (week - 1) * 7);
  return weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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
          className="mt-1 block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
              <dd className="text-gray-900 text-sm">{formatRosterPositions(currentLeague.roster_positions)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Bench Slots</dt>
              <dd className="text-gray-900">{currentLeague.settings.bench_slots}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Waiver Type</dt>
              <dd className="text-gray-900">
                {currentLeague.settings.waiver_type === 0 ? 'Standard' : 
                 currentLeague.settings.waiver_type === 1 ? 'FAAB' : 'Custom'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Daily Waivers</dt>
              <dd className="text-gray-900">{currentLeague.settings.daily_waivers === 1 ? 'Yes' : 'No'}</dd>
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
              <dd className="text-gray-900">{formatStatus(currentLeague.status)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Start Week</dt>
              <dd className="text-gray-900">Week {currentLeague.settings.start_week}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Season Start</dt>
              <dd className="text-gray-900">{getDateForWeek(currentLeague.settings.start_week, currentLeague.season)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Draft Rounds</dt>
              <dd className="text-gray-900">{currentLeague.settings.draft_rounds}</dd>
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
              <dd className="text-gray-900">
                Week {currentLeague.settings.playoff_week_start} 
                <span className="text-xs text-gray-500 ml-1">
                  ({getDateForWeek(currentLeague.settings.playoff_week_start, currentLeague.season)})
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Trade Deadline</dt>
              <dd className="text-gray-900">
                Week {currentLeague.settings.trade_deadline}
                <span className="text-xs text-gray-500 ml-1">
                  ({getDateForWeek(currentLeague.settings.trade_deadline, currentLeague.season)})
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Playoff Type</dt>
              <dd className="text-gray-900">
                {currentLeague.settings.playoff_type === 0 ? 'Single Elimination' : 
                 currentLeague.settings.playoff_type === 1 ? 'Two Rounds' : 'Custom'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 