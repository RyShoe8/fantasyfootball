import React from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperLeague } from '../types/sleeper';

const LeagueInfo: React.FC = () => {
  const { 
    currentLeague, 
    leagues, 
    setCurrentLeague, 
    selectedYear, 
    setSelectedYear,
    rosters,
    users,
    players,
    playerStats
  } = useSleeper();

  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLeague = leagues.find(league => league.league_id === e.target.value);
    if (selectedLeague) {
      setCurrentLeague(selectedLeague);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  // Get available years (current year and previous 2 years)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 3 }, (_, i) => (currentYear - i).toString());

  if (!currentLeague) return null;

  // Helper function to determine scoring type
  const getScoringType = (league: SleeperLeague) => {
    if (league.scoring_settings?.pts_per_reception) {
      return 'PPR';
    }
    return 'Standard';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentLeague.name}</h1>
          <p className="text-gray-600">Season {currentLeague.season}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <select
            value={currentLeague.league_id}
            onChange={handleLeagueChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {leagues.map(league => (
              <option key={league.league_id} value={league.league_id}>
                {league.name} ({league.season})
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">League Status</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {currentLeague.status === 'complete' ? 'Completed' : 'In Progress'}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Scoring Settings</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {getScoringType(currentLeague)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Roster Size</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {currentLeague.roster_positions?.length || 'N/A'}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Teams</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {rosters.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeagueInfo; 