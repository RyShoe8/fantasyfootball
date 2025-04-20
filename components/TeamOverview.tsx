/** @jsxImportSource react */
import React, { useState, useMemo, ChangeEvent } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperRoster, SleeperPlayer } from '../types/sleeper';

interface PlayerStats {
  pts_ppr?: number;
  pts_half_ppr?: number;
  pts_std?: number;
  projected_pts?: number;
}

interface Player {
  player_id: string;
  full_name: string;
  position: string;
  team: string;
  injury_status?: string;
  stats?: Record<string, PlayerStats>;
}

interface Roster {
  roster_id: number;
  owner_id: string;
  starters: string[];
  reserves: string[];
  players: string[];
  metadata: {
    team_name?: string;
  };
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

type SortableFields = 'teamName' | 'wins' | 'losses' | 'ties' | 'totalPoints';

const TeamOverview: React.FC = () => {
  const { user, rosters, players } = useSleeper();
  const [selectedWeek, setSelectedWeek] = useState('0');
  const [sortField, setSortField] = useState<SortableFields>('totalPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const teamStats = useMemo(() => {
    if (!user || !rosters) return null;

    const userRoster = rosters.find(r => r.owner_id === user.user_id);
    if (!userRoster) return null;

    const rosterPlayers = [...(userRoster.starters || []), ...(userRoster.reserves || [])]
      .map(playerId => {
        const player = players[playerId as keyof typeof players] as Player | undefined;
        return player ? {
          ...player,
          stats: (player?.stats?.[selectedWeek] || {}) as PlayerStats,
          projected_pts: player?.stats?.[selectedWeek]?.projected_pts || 0,
          pts_ppr: player?.stats?.[selectedWeek]?.pts_ppr || 0
        } : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const totalPoints = rosterPlayers.reduce((sum, player) => 
      sum + ((player.pts_ppr as number) || 0), 0);

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
      acc[pos].points += ((player.pts_ppr as number) || 0);
      acc[pos].projected += ((player.projected_pts as number) || 0);
      return acc;
    }, {} as Record<string, { count: number; points: number; projected: number }>);

    return {
      teamId: userRoster.roster_id.toString(),
      ownerId: userRoster.owner_id,
      teamName: userRoster.metadata?.team_name || `Team ${userRoster.roster_id}`,
      wins: 0, // These would come from actual league data
      losses: 0,
      ties: 0,
      totalPoints,
      positionStats,
      players: rosterPlayers
    } as TeamStats;
  }, [user, rosters, players, selectedWeek]);

  if (!teamStats) {
    return <div>Loading...</div>;
  }

  const handleSort = (field: SortableFields) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTeams = [teamStats].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    return sortDirection === 'asc' ? 
      (aValue < bValue ? -1 : 1) : 
      (aValue > bValue ? -1 : 1);
  });

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Team Overview</h2>
        <select
          className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
        >
          {Array.from({ length: 18 }, (_, i) => (
            <option key={i} value={i.toString()}>
              Week {i}
            </option>
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
            {sortedTeams.map((team: TeamStats) => (
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