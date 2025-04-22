import React from 'react';
import { SleeperLeague } from '../types/sleeper';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts';
import { useRoster } from '../contexts/roster';
import { usePlayer } from '../contexts/player/PlayerContext';

interface LeagueInfoProps {
  league: SleeperLeague;
}

interface RosterBreakdown {
  breakdown: Record<string, number>;
  totalStarters: number;
}

interface TradeDeadlineInfo {
  week: number;
  date: Date;
}

const LeagueInfo: React.FC<LeagueInfoProps> = ({ league }: LeagueInfoProps) => {
  const { fetchLeaguesForYear, setSelectedYear, selectedYear } = useLeague();
  const { rosters } = useRoster();
  const { positions } = usePlayer();
  const [availableYears, setAvailableYears] = React.useState<string[]>([]);
  const [selectedLeague, setSelectedLeague] = React.useState<SleeperLeague | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchAvailableYears = async () => {
      setIsLoading(true);
      try {
        const years = await fetchLeaguesForYear(league.season);
        setAvailableYears(years);
      } catch (error) {
        console.error('Error fetching available years:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableYears();
  }, [league, fetchLeaguesForYear, selectedYear]);

  const handleYearChange = async (year: string): Promise<void> => {
    await setSelectedYear(year);
  };

  const getScoringType = (league: SleeperLeague): string => {
    return 'Standard';
  };

  const getRosterBreakdown = (league: SleeperLeague): RosterBreakdown => {
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

  const getBenchSize = (league: SleeperLeague): number => {
    if (!league.roster_positions) return 0;
    return league.roster_positions.filter((pos: string) => pos === 'BN').length;
  };

  const getIRSlots = (league: SleeperLeague): number => {
    if (!league.roster_positions) return 0;
    return league.roster_positions.filter((pos: string) => pos === 'IR').length;
  };

  const getTaxiSlots = (league: SleeperLeague): number => {
    return league.settings.taxi_slots;
  };

  const getTradeDeadlineInfo = (league: SleeperLeague): TradeDeadlineInfo | null => {
    const tradeDeadlineWeek = league.settings.trade_deadline;
    const seasonStart = new Date(league.season + '-09-01');
    const deadlineDate = new Date(seasonStart);
    deadlineDate.setDate(deadlineDate.getDate() + (tradeDeadlineWeek * 7));
    return { week: tradeDeadlineWeek, date: deadlineDate };
  };

  const formatPositionName = (pos: string): string => {
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{league.name}</h2>
        <select
          value={selectedYear}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleYearChange(e.target.value)}
          className="ml-4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isLoading}
        >
          {availableYears.map((year: string) => (
            <option key={year} value={year}>
              {year} Season
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">League Information</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">League ID</dt>
              <dd className="text-sm text-gray-900">{league.league_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Season</dt>
              <dd className="text-sm text-gray-900">{league.season}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900">{league.status}</dd>
            </div>
            {tradeDeadline && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Trade Deadline</dt>
                <dd className="text-sm text-gray-900">{tradeDeadline.date.toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Roster Settings</h3>
          <dl className="space-y-2">
            {Object.entries(rosterBreakdown).map(([pos, count]) => (
              <div key={pos}>
                <dt className="text-sm font-medium text-gray-500">
                  {positions[pos] || pos}
                </dt>
                <dd className="text-sm text-gray-900">{count}</dd>
              </div>
            ))}
            {getBenchSize(league) > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Bench</dt>
                <dd className="text-sm text-gray-900">{getBenchSize(league)}</dd>
              </div>
            )}
            {getIRSlots(league) > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">IR Slots</dt>
                <dd className="text-sm text-gray-900">{getIRSlots(league)}</dd>
              </div>
            )}
            {getTaxiSlots(league) > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Taxi Slots</dt>
                <dd className="text-sm text-gray-900">{getTaxiSlots(league)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default LeagueInfo; 