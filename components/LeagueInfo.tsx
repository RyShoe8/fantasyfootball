import React, { ChangeEvent, useState } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperLeague } from '../types/sleeper';
import axios from 'axios';
import { useRouter } from 'next/router';

// Helper function to format dates
const formatDate = (timestamp: number): string => {
  if (!timestamp) return 'Not set';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format roster positions
const formatRosterPositions = (positions: string[]) => {
  const starters = positions.filter(pos => !pos.startsWith('BN') && !pos.startsWith('IR') && !pos.startsWith('TAXI'));
  const benchSlots = positions.filter(pos => pos.startsWith('BN')).length;
  const irSlots = positions.filter(pos => pos.startsWith('IR')).length;
  const taxiSlots = positions.filter(pos => pos.startsWith('TAXI')).length;

  return {
    positions: starters.join(', '),
    benchSlots,
    irSlots,
    taxiSlots
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

// Helper function to format playoff type
const formatPlayoffType = (type: number) => {
  const types: Record<number, string> = {
    1: 'Single Elimination',
    2: 'Double Elimination',
    3: 'Round Robin'
  };
  return types[type] || 'Unknown';
};

export const LeagueInfo: React.FC = () => {
  const { 
    currentLeague, 
    leagues, 
    setCurrentLeague, 
    selectedYear,
    setSelectedYear,
    isLoading: contextLoading,
    user,
    setLeagues,
    setRosters,
    setUsers,
    setPlayers
  } = useSleeper();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeagueChange = async (leagueId: string) => {
    const league = leagues.find((l: SleeperLeague) => l.league_id === leagueId);
    if (league) {
      setCurrentLeague(league);
      // Only navigate if we're not already on the league page
      if (!router.pathname.includes('/league/')) {
        router.push(`/league/${league.league_id}`);
      }
    }
  };

  const handleYearChange = async (year: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedYear(year);
      // Refresh leagues for the selected year
      if (user) {
        const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${year}`);
        if (leaguesResponse.data.length > 0) {
          setLeagues(leaguesResponse.data);
          const newLeague = leaguesResponse.data[0];
          setCurrentLeague(newLeague);

          // Fetch all necessary data for the new league
          const [rostersResponse, usersResponse, playersResponse] = await Promise.all([
            axios.get(`https://api.sleeper.app/v1/league/${newLeague.league_id}/rosters`),
            axios.get(`https://api.sleeper.app/v1/league/${newLeague.league_id}/users`),
            axios.get('https://api.sleeper.app/v1/players/nfl')
          ]);

          // Update all the necessary state
          setRosters(rostersResponse.data);
          setUsers(usersResponse.data);
          setPlayers(playersResponse.data);

          // Only navigate after all data is loaded
          router.push('/');
        } else {
          console.log('No leagues found for year:', year);
          setError('No leagues found for this year');
          setLeagues([]);
          setCurrentLeague(null);
          setRosters([]);
          setUsers([]);
          setPlayers({});
        }
      }
    } catch (error) {
      console.error('Error fetching leagues for year:', error);
      setError('Failed to fetch leagues for this year');
    } finally {
      setIsLoading(false);
    }
  };

  if (contextLoading || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select League</label>
          <select
            className="w-full p-2 border rounded"
            value={currentLeague?.league_id || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleLeagueChange(e.target.value)}
          >
            <option value="">Select a league</option>
            {leagues.map((league: SleeperLeague) => (
              <option key={league.league_id} value={league.league_id}>
                {league.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Year</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedYear}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleYearChange(e.target.value)}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
        </div>
      </div>
      
      {currentLeague && (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">League Name</h3>
              <p className="mt-1">{currentLeague.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Season</h3>
              <p className="mt-1">{currentLeague.season}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">{formatStatus(currentLeague.status)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Settings</h3>
              <p className="mt-1">
                {currentLeague.settings.type === 1 ? 'Keeper League' : 'Redraft League'} •{' '}
                {currentLeague.settings.playoff_teams} Teams
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">League Start</h3>
              <p className="mt-1">{formatDate(currentLeague.settings.start_week)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Trade Deadline</h3>
              <p className="mt-1">{formatDate(currentLeague.settings.trade_deadline)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Playoff Teams</h3>
              <p className="mt-1">{currentLeague.settings.playoff_teams} Teams</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Playoff Format</h3>
              <p className="mt-1">
                {formatPlayoffType(currentLeague.settings.playoff_type)} • Weeks {currentLeague.settings.playoff_week_start}-{currentLeague.settings.playoff_week_start + currentLeague.settings.playoff_teams - 1}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Starting Positions</h4>
                <p className="mt-1">{formatRosterPositions(currentLeague.roster_positions).positions}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Bench Slots</h4>
                <p className="mt-1">{formatRosterPositions(currentLeague.roster_positions).benchSlots}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">IR Slots</h4>
                <p className="mt-1">{formatRosterPositions(currentLeague.roster_positions).irSlots}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Taxi Slots</h4>
                <p className="mt-1">{formatRosterPositions(currentLeague.roster_positions).taxiSlots}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeagueInfo; 