import React, { ChangeEvent } from 'react';
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
  const positionCounts: Record<string, number> = {};
  let benchSlots = 0;
  let irSlots = 0;
  let taxiSlots = 0;
  
  positions.forEach(pos => {
    if (pos === 'BN') {
      benchSlots++;
    } else if (pos === 'IR') {
      irSlots++;
    } else if (pos === 'TAXI') {
      taxiSlots++;
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

export const LeagueInfo: React.FC = () => {
  const { 
    currentLeague, 
    leagues, 
    setCurrentLeague, 
    selectedYear,
    setSelectedYear,
    isLoading,
    user,
    setLeagues
  } = useSleeper();
  const router = useRouter();

  const handleLeagueChange = async (leagueId: string) => {
    const league = leagues.find((l: SleeperLeague) => l.league_id === leagueId);
    if (league) {
      setCurrentLeague(league);
      router.push(`/league/${league.league_id}`);
    }
  };

  const handleYearChange = async (year: string) => {
    setSelectedYear(year);
    // Refresh leagues for the selected year
    if (user) {
      try {
        const leaguesResponse = await axios.get(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${year}`);
        if (leaguesResponse.data.length > 0) {
          setLeagues(leaguesResponse.data);
          setCurrentLeague(leaguesResponse.data[0]);
          router.push(`/league/${leaguesResponse.data[0].league_id}`);
        }
      } catch (error) {
        console.error('Error fetching leagues for year:', error);
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
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
              {currentLeague.settings.playoff_week_start} Teams
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueInfo; 