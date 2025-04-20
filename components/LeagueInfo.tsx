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

  // Helper function to get roster breakdown
  const getRosterBreakdown = (league: SleeperLeague) => {
    if (!league.roster_positions) return {};
    
    const breakdown: Record<string, number> = {};
    league.roster_positions.forEach(pos => {
      if (pos !== 'BN' && pos !== 'FLEX' && pos !== 'IDP_FLEX' && pos !== 'SUPER_FLEX') {
        breakdown[pos] = (breakdown[pos] || 0) + 1;
      }
    });
    
    return breakdown;
  };

  // Helper function to get bench size
  const getBenchSize = (league: SleeperLeague) => {
    if (!league.roster_positions) return 0;
    return league.roster_positions.filter(pos => pos === 'BN').length;
  };

  // Helper function to get IR slots
  const getIRSlots = (league: SleeperLeague) => {
    if (!league.roster_positions) return 0;
    return league.roster_positions.filter(pos => pos === 'IR').length;
  };

  // Helper function to get taxi squad size
  const getTaxiSquadSize = (league: SleeperLeague) => {
    return league.settings?.taxi_slots || 0;
  };

  // Helper function to get playoff format
  const getPlayoffFormat = (league: SleeperLeague) => {
    const teams = league.settings?.playoff_teams || 0;
    const weeks = league.settings?.playoff_week_start ? 
      18 - league.settings.playoff_week_start + 1 : 0;
    
    return `${teams} teams, ${weeks} weeks`;
  };

  const rosterBreakdown = getRosterBreakdown(currentLeague);

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
          <h3 className="text-sm font-medium text-gray-500">Teams</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {rosters.length}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Playoff Format</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {getPlayoffFormat(currentLeague)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Roster Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Starting Lineup</h4>
            <div className="mt-2 space-y-1">
              {Object.entries(rosterBreakdown).map(([pos, count]) => (
                <p key={pos} className="text-sm text-gray-900">
                  <span className="font-medium">{pos}:</span> {count}
                </p>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Bench & Reserve</h4>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Bench Spots:</span> {getBenchSize(currentLeague)}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">IR Slots:</span> {getIRSlots(currentLeague)}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Taxi Squad:</span> {getTaxiSquadSize(currentLeague) > 0 ? `${getTaxiSquadSize(currentLeague)} spots` : 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueInfo; 