import React, { ChangeEvent, useState } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperLeague } from '../types/sleeper';

// Helper function to format roster positions
const formatRosterPositions = (positions: string[]) => {
  const positionCounts: Record<string, number> = {};
  let benchSlots = 0;
  
  positions.forEach(pos => {
    if (pos === 'BN') {
      benchSlots++;
    } else if (pos === 'IDP_FLEX') {
      positionCounts['IDP Flex'] = (positionCounts['IDP Flex'] || 0) + 1;
    } else if (pos === 'SUPER_FLEX') {
      positionCounts['Super Flex'] = (positionCounts['Super Flex'] || 0) + 1;
    } else if (pos === 'FLEX') {
      positionCounts['Flex'] = (positionCounts['Flex'] || 0) + 1;
    } else {
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    }
  });
  
  const formattedPositions = Object.entries(positionCounts)
    .map(([pos, count]) => `${pos}${count > 1 ? ` (${count})` : ''}`)
    .join(', ');

  return {
    positions: formattedPositions,
    benchSlots
  };
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

// Helper function to determine season number
const getSeasonNumber = (season: string, leagues: SleeperLeague[]) => {
  // Find all leagues with the same name as the current league
  const leagueName = leagues.find(l => l.season === season)?.name || '';
  const sameNameLeagues = leagues.filter(l => l.name === leagueName);
  
  // Sort leagues by season to determine which season number this is
  const sortedLeagues = [...sameNameLeagues].sort((a, b) => parseInt(a.season) - parseInt(b.season));
  const seasonIndex = sortedLeagues.findIndex(l => l.season === season);
  
  if (seasonIndex === -1) return '';
  
  // Convert to ordinal (1st, 2nd, 3rd, etc.)
  const seasonNumber = seasonIndex + 1;
  const suffix = ['th', 'st', 'nd', 'rd'][seasonNumber % 10] || 'th';
  return ` (${seasonNumber}${suffix} Season)`;
};

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
          <h2 className="text-xl font-bold mb-4">League Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">League Name</p>
              <p className="font-medium">{currentLeague.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Season</p>
              <p className="font-medium">{currentLeague.season}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium capitalize">{currentLeague.status}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Rosters</p>
              <p className="font-medium">{currentLeague.settings.num_teams}</p>
            </div>
            <div>
              <p className="text-gray-600">Previous League ID</p>
              <p className="font-medium">{currentLeague.previous_league_id || 'None'}</p>
            </div>
            <div>
              <p className="text-gray-600">Season Start</p>
              <p className="font-medium">{formatDate(currentLeague.season_start)}</p>
            </div>
            <div>
              <p className="text-gray-600">Start Week</p>
              <p className="font-medium">{currentLeague.start_week} ({formatDate(currentLeague.start_week_date)})</p>
            </div>
            <div>
              <p className="text-gray-600">Roster Positions</p>
              <p className="font-medium">{formatRosterPositions(currentLeague.roster_positions)}</p>
            </div>
            <div>
              <p className="text-gray-600">Bench Slots</p>
              <p className="font-medium">{countBenchSlots(currentLeague.roster_positions)}</p>
            </div>
          </div>
        </div>

        {/* Season Info Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Season Info</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Season</dt>
              <dd className="text-gray-900">
                {currentLeague.season}
                <span className="text-xs text-gray-500 ml-1">
                  {getSeasonNumber(currentLeague.season, leagues)}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Status</dt>
              <dd className="text-gray-900">{formatStatus(currentLeague.status)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Start Week</dt>
              <dd className="text-gray-900">
                Week {currentLeague.settings.start_week}
                <span className="text-xs text-gray-500 ml-1">
                  ({getDateForWeek(currentLeague.settings.start_week, currentLeague.season)})
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Season Start</dt>
              <dd className="text-gray-900">
                {getDateForWeek(currentLeague.settings.start_week, currentLeague.season)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Draft Rounds</dt>
              <dd className="text-gray-900">{currentLeague.settings.draft_rounds}</dd>
            </div>
          </dl>
        </div>

        {/* Playoff Info Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Playoff Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Playoff Week Start</p>
              <p className="font-medium">{currentLeague.playoff_week_start} ({formatDate(currentLeague.playoff_week_start_date)})</p>
            </div>
            <div>
              <p className="text-gray-600">Trade Deadline</p>
              <p className="font-medium">{formatDate(currentLeague.trade_deadline)}</p>
            </div>
            <div>
              <p className="text-gray-600">Playoff Teams</p>
              <p className="font-medium">{currentLeague.settings.playoff_teams}</p>
            </div>
            <div>
              <p className="text-gray-600">Playoff Rounds</p>
              <p className="font-medium">{currentLeague.settings.playoff_rounds}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 