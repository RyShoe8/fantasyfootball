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
  // Sort leagues by season to determine which season number this is
  const sortedLeagues = [...leagues].sort((a, b) => parseInt(a.season) - parseInt(b.season));
  const seasonIndex = sortedLeagues.findIndex(l => l.season === season);
  
  if (seasonIndex === -1) return '';
  
  // Convert to ordinal (1st, 2nd, 3rd, etc.)
  const seasonNumber = seasonIndex + 1;
  const suffix = ['th', 'st', 'nd', 'rd'][seasonNumber % 10] || 'th';
  return ` (${seasonNumber}${suffix} Season)`;
};

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
        players: roster.players?.length || 0
      }));
    case 'players':
      return `Total players: ${Object.keys(data).length}`;
    default:
      return data;
  }
};

export default function LeagueInfo() {
  const { currentLeague, leagues, setCurrentLeague, user, rosters, players } = useSleeper();
  const [showDebug, setShowDebug] = useState(false);

  console.log('LeagueInfo - currentLeague:', currentLeague);
  console.log('LeagueInfo - leagues:', leagues);

  if (!currentLeague) {
    console.log('LeagueInfo - No current league selected');
    return null;
  }

  // Helper function to format JSON for display
  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (err) {
      return 'Error formatting JSON';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
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

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">League Settings</h3>
            <dl className="mt-2 space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Teams</dt>
                <dd className="text-gray-900">{currentLeague.settings.num_teams}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Roster Positions</dt>
                <dd className="text-gray-900 text-sm">{formatRosterPositions(currentLeague.roster_positions).positions}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Bench Slots</dt>
                <dd className="text-gray-900">{formatRosterPositions(currentLeague.roster_positions).benchSlots}</dd>
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

      {/* Debug Section - Now at the bottom */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">API Debug Data</h2>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showDebug ? 'Hide Debug Data' : 'Show Debug Data'}
          </button>
        </div>

        {showDebug && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Data</h3>
              <pre className="overflow-auto p-4 bg-gray-800 text-gray-100 rounded-md text-sm">
                {formatJSON(formatApiResponse(user, 'user'))}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Current League Data</h3>
              <pre className="overflow-auto p-4 bg-gray-800 text-gray-100 rounded-md text-sm">
                {formatJSON(formatApiResponse(currentLeague, 'league'))}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Leagues Data</h3>
              <pre className="overflow-auto p-4 bg-gray-800 text-gray-100 rounded-md text-sm">
                {formatJSON(leagues.map(league => formatApiResponse(league, 'league')))}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Rosters Data</h3>
              <pre className="overflow-auto p-4 bg-gray-800 text-gray-100 rounded-md text-sm">
                {formatJSON(formatApiResponse(rosters, 'rosters'))}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Players Data</h3>
              <pre className="overflow-auto p-4 bg-gray-800 text-gray-100 rounded-md text-sm">
                {formatApiResponse(players, 'players')}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 