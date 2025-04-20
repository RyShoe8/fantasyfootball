/** @jsxImportSource react */
import React, { useState, useMemo, ChangeEvent } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperRoster, SleeperPlayer } from '../types/sleeper';

interface PlayerStats {
  points?: number;
  projected?: number;
  [key: string]: any;
}

interface Player {
  position: string;
  stats?: PlayerStats;
  [key: string]: any;
}

interface TeamStats {
  teamId: string;
  ownerId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  totalPoints: number;
  positionStats: Record<string, { count: number; points: number; projected: number }>;
  players: Player[];
}

type SortConfig = {
  key: keyof TeamStats;
  direction: 'asc' | 'desc';
};

const TeamOverview: React.FC = () => {
  const { currentLeague, rosters, players } = useSleeper();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'wins', direction: 'desc' });
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const teamStats = useMemo(() => {
    if (!rosters || !players) return [];

    return rosters.map((roster: SleeperRoster) => {
      const rosterPlayers = [...(roster.starters || []), ...(roster.reserves || [])]
        .map(playerId => {
          const player = players[playerId];
          return {
            ...player,
            stats: (player?.stats?.[selectedWeek] || {}) as PlayerStats
          };
        });

      const totalPoints = rosterPlayers.reduce((sum, player) => 
        sum + ((player.stats?.points as number) || 0), 0);

      const positionStats = rosterPlayers.reduce((acc, player) => {
        const pos = player.position;
        if (!acc[pos]) {
          acc[pos] = {
            count: 0,
            points: 0,
            projected: 0
          };
        }
        acc[pos].count++;
        acc[pos].points += ((player.stats?.points as number) || 0);
        acc[pos].projected += ((player.stats?.projected as number) || 0);
        return acc;
      }, {} as Record<string, { count: number; points: number; projected: number }>);

      return {
        teamId: roster.roster_id,
        ownerId: roster.owner_id,
        teamName: `Team ${roster.roster_id}`,
        wins: roster.settings.wins,
        losses: roster.settings.losses,
        ties: 0, // Sleeper API doesn't provide ties in settings
        totalPoints: roster.settings.fpts,
        positionStats,
        players: rosterPlayers
      };
    });
  }, [rosters, players, selectedWeek]);

  const sortedTeams = useMemo(() => {
    const sorted = [...teamStats].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Fallback for other types
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [teamStats, sortConfig]);

  const handleSort = (key: keyof TeamStats) => {
    setSortConfig((current: SortConfig) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (!currentLeague) return null;

  const weeks = Array.from(
    { length: currentLeague.settings.playoff_week_start - currentLeague.settings.start_week + 1 },
    (_, i) => i + currentLeague.settings.start_week
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Team Overview</h2>
        <select
          className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedWeek}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedWeek(Number(e.target.value))}
        >
          {weeks.map(week => (
            <option key={week} value={week}>Week {week}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('teamName')}>
                Team Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('wins')}>
                W
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('losses')}>
                L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('ties')}>
                T
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('totalPoints')}>
                Total Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position Breakdown
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTeams.map((team) => (
              <tr key={team.teamId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {team.teamName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.wins}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.losses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.ties}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.totalPoints.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="space-y-1">
                    {Object.entries(team.positionStats).map(([pos, stats]) => (
                      <div key={pos} className="flex justify-between">
                        <span>{pos}:</span>
                        <span>{stats.count} players</span>
                        <span>{stats.points.toFixed(2)} pts</span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeamOverview; 