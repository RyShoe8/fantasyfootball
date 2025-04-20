import React, { ChangeEvent, useState, useMemo } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperLeague, SleeperRoster } from '../types/sleeper';
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
    user, 
    leagues, 
    currentLeague, 
    setCurrentLeague,
    selectedYear,
    setSelectedYear,
    rosters,
    users,
    players,
    playerStats,
    fetchPlayerStats,
    isLoading: contextLoading,
    setLeagues,
    setRosters,
    setUsers,
    setPlayers
  } = useSleeper();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const handleLeagueChange = async (leagueId: string) => {
    const league = leagues.find((l: SleeperLeague) => l.league_id === leagueId);
    if (league) {
      setCurrentLeague(league);
    }
  };

  const handleYearChange = async (year: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set the year first
      setSelectedYear(year);
      
      // Fetch leagues for the new year
      const response = await axios.get(`https://api.sleeper.app/v1/user/${user?.user_id}/leagues/nfl/${year}`);
      const leagues = response.data;
      
      if (leagues.length > 0) {
        // Update leagues state
        setLeagues(leagues);
        
        // Try to find a league with the same name as current league
        if (currentLeague) {
          const sameNameLeague = leagues.find((l: SleeperLeague) => l.name === currentLeague.name);
          if (sameNameLeague) {
            setCurrentLeague(sameNameLeague);
            return;
          }
        }
        
        // If no matching league found, use the first one
        const newLeague = leagues[0];
        setCurrentLeague(newLeague);
      } else {
        setError('No leagues found for this year');
        setLeagues([]);
        setCurrentLeague(null);
        // Clear other states
        setRosters([]);
        setUsers([]);
        setPlayers({});
      }
    } catch (error) {
      console.error('Error changing year:', error);
      setError('Failed to load leagues for this year');
    } finally {
      setIsLoading(false);
    }
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Start from current year and go down to 2023
    for (let year = currentYear; year >= 2023; year--) {
      years.push(year.toString());
    }
    return years;
  }, []);

  if (contextLoading || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{currentLeague?.name}</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* Add weeks based on the current league's season */}
            {/* This is a placeholder and should be replaced with actual weeks */}
            {/* For example, you can use a range from 1 to the number of weeks in the season */}
            {/* For simplicity, we'll use a fixed range */}
            {Array.from({ length: 17 }, (_, i) => i + 1).map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">League ID</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">{currentLeague?.league_id}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Season</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">{currentLeague?.season}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">{currentLeague?.status}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Settings</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {currentLeague?.settings?.type === 1 ? 'Keeper League' : 'Redraft League'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeagueInfo; 