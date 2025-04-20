import React, { ChangeEvent, useState } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperLeague } from '../types/sleeper';
import axios from 'axios';

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

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
    default:
      return data;
  }
};

export default function LeagueInfo() {
  const { currentLeague, leagues, setCurrentLeague, setRosters, setUsers, setPlayers, setDraftPicks } = useSleeper();
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [debugType, setDebugType] = useState<string>('');

  console.log('LeagueInfo - currentLeague:', currentLeague);
  console.log('LeagueInfo - leagues:', leagues);

  if (!currentLeague) {
    console.log('LeagueInfo - No current league selected');
    return null;
  }

  const handleFetchRosters = async () => {
    if (!currentLeague) return;
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${currentLeague.league_id}/rosters`);
      setDebugData(response.data);
      setDebugType('rosters');
      setRosters(response.data);
    } catch (error) {
      console.error('Error fetching rosters:', error);
      setDebugData({ error: 'Failed to fetch rosters' });
      setDebugType('error');
    }
  };

  const handleFetchUsers = async () => {
    if (!currentLeague) return;
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${currentLeague.league_id}/users`);
      setDebugData(response.data);
      setDebugType('users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setDebugData({ error: 'Failed to fetch users' });
      setDebugType('error');
    }
  };

  const handleFetchPlayers = async () => {
    if (!currentLeague) return;
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${currentLeague.league_id}/players`);
      setDebugData(response.data);
      setDebugType('players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
      setDebugData({ error: 'Failed to fetch players' });
      setDebugType('error');
    }
  };

  const handleFetchDraftPicks = async () => {
    if (!currentLeague) return;
    try {
      const response = await axios.get(`${SLEEPER_API_BASE}/league/${currentLeague.league_id}/draft_picks`);
      setDebugData(response.data);
      setDebugType('draft_picks');
      setDraftPicks(response.data);
    } catch (error) {
      console.error('Error fetching draft picks:', error);
      setDebugData({ error: 'Failed to fetch draft picks' });
      setDebugType('error');
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* API Debug Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          {showDebug ? 'Hide Debug Data' : 'Show Debug Data'}
        </button>

        {showDebug && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleFetchRosters}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Fetch Rosters
              </button>
              <button
                onClick={handleFetchUsers}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Fetch Users
              </button>
              <button
                onClick={handleFetchPlayers}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Fetch Players
              </button>
              <button
                onClick={handleFetchDraftPicks}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Fetch Draft Picks
              </button>
            </div>

            {debugData && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">API Response:</h3>
                <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
                  {JSON.stringify(formatApiResponse(debugData, debugType), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 