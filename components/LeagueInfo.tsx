import React from 'react';
import { SleeperLeague } from '../types/sleeper';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import { useRoster } from '../contexts/roster';

interface LeagueInfoProps {
  league: SleeperLeague;
  selectedYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
}

export default function LeagueInfo({ 
  league, 
  selectedYear, 
  availableYears, 
  onYearChange 
}: LeagueInfoProps) {
  const { setCurrentLeague } = useLeague();
  const { rosters } = useRoster();

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onYearChange(event.target.value);
  };

  // Helper function to determine scoring type
  const getScoringType = (league: SleeperLeague) => {
    // For now, we'll default to Standard scoring since we don't have direct access to PPR settings
    // This can be enhanced later when we have access to the scoring settings
    return 'Standard';
  };

  // Helper function to get roster breakdown
  const getRosterBreakdown = (league: SleeperLeague) => {
    if (!league.roster_positions) return { breakdown: {}, totalStarters: 0 };
    
    const breakdown: Record<string, number> = {};
    let totalStarters = 0;
    
    league.roster_positions.forEach((pos: string) => {
      if (pos !== 'BN' && pos !== 'IR' && pos !== 'TAXI') {
        breakdown[pos] = (breakdown[pos] || 0) + 1;
        totalStarters++;
      }
    });
    
    return { breakdown, totalStarters };
  };

  // Helper function to get bench size
  const getBenchSize = (league: SleeperLeague) => {
    if (!league.roster_positions) return 0;
    return league.roster_positions.filter((pos: string) => pos === 'BN').length;
  };

  // Helper function to get IR slots
  const getIRSlots = (league: SleeperLeague) => {
    if (!league.roster_positions) return 0;
    return league.roster_positions.filter((pos: string) => pos === 'IR').length;
  };

  // Helper function to get taxi slots
  const getTaxiSlots = (league: SleeperLeague) => {
    if (!league.settings) return 0;
    return league.settings.taxi_slots || 0;
  };

  // Helper function to get trade deadline info
  const getTradeDeadlineInfo = (league: SleeperLeague) => {
    if (!league.settings) return null;
    const tradeDeadlineWeek = league.settings.trade_deadline;
    // Calculate actual date based on week number (this is approximate)
    const seasonStart = new Date(league.season + '-09-01'); // Approximate NFL season start
    const deadlineDate = new Date(seasonStart);
    deadlineDate.setDate(deadlineDate.getDate() + (tradeDeadlineWeek * 7));
    return { week: tradeDeadlineWeek, date: deadlineDate };
  };

  // Helper function to format position name
  const formatPositionName = (pos: string) => {
    switch (pos) {
      case 'SUPER_FLEX':
        return 'Super Flex';
      case 'IDP_FLEX':
        return 'IDP Flex';
      case 'FLEX':
        return 'Flex';
      case 'WR':
        return 'WR';
      case 'RB':
        return 'RB';
      case 'TE':
        return 'TE';
      case 'QB':
        return 'QB';
      default:
        return pos;
    }
  };

  const { breakdown: rosterBreakdown, totalStarters } = getRosterBreakdown(league);
  const tradeDeadline = getTradeDeadlineInfo(league);
  const totalTeams = league.total_rosters || league.settings?.num_teams || 0;

  if (!league) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{league.name}</h2>
          <p className="text-sm text-gray-500">{totalTeams} Teams</p>
        </div>
        <div className="flex gap-4">
          <select
            className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={selectedYear}
            onChange={handleYearChange}
          >
            {availableYears.map((year: string) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Roster Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Starting Lineup ({totalStarters} total)</h4>
            <div className="mt-2 space-y-1">
              {Object.entries(rosterBreakdown || {}).map(([pos, count]) => (
                <p key={pos} className="text-sm text-gray-900">
                  <span className="font-medium">{formatPositionName(pos)}:</span> {count}
                </p>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Bench & Reserve</h4>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Bench Spots:</span> {getBenchSize(league)}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">IR Slots:</span> {getIRSlots(league)}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Taxi Slots:</span> {getTaxiSlots(league)}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Trades & Playoffs</h4>
            <div className="mt-2 space-y-1">
              {tradeDeadline && (
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Trade Deadline:</span> Week {tradeDeadline.week} ({tradeDeadline.date.toLocaleDateString()})
                </p>
              )}
              <p className="text-sm text-gray-900">
                <span className="font-medium">Playoff Teams:</span> {league.settings?.playoff_teams || 0}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Playoff Format:</span> {league.settings?.playoff_type === 1 ? 'Single Elimination' : 'Double Elimination'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 