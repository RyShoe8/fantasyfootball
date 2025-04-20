/** @jsxImportSource react */
import React, { useState, useMemo, ChangeEvent } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperRoster, SleeperPlayer } from '../types/sleeper';
import LeagueStandings from './LeagueStandings';

interface PlayerStats {
  pts_ppr?: number;
  pts_half_ppr?: number;
  pts_std?: number;
  projected_pts?: number;
  fpts?: number;
  fpts_decimal?: number;
  fpts_against?: number;
  fpts_against_decimal?: number;
  [key: string]: any;
}

interface Player extends SleeperPlayer {
  stats?: PlayerStats;
  projected_pts?: number;
  pts_ppr?: number;
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
  const { user, rosters, players, currentLeague } = useSleeper();
  const [selectedWeek, setSelectedWeek] = useState('0');
  const [sortField, setSortField] = useState<SortableFields>('totalPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const teamStats = useMemo(() => {
    if (!user || !rosters || !players || !currentLeague) return null;

    // Filter rosters to only include those from the current league
    const leagueRosters = rosters.filter((r: SleeperRoster) => r.league_id === currentLeague.league_id);
    
    // Find the user's roster in the current league
    const userRoster = leagueRosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) return null;

    console.log('User roster:', userRoster);
    console.log('User ID:', user.user_id);
    console.log('Current league:', currentLeague);

    // Get all players from the roster
    const rosterPlayers = [...(userRoster.starters || []), ...(userRoster.reserves || [])]
      .map(playerId => {
        const player = players[playerId as keyof typeof players];
        if (!player) return null;

        // Get stats for the selected week
        const weekStats = player.stats?.[selectedWeek] || {};
        
        // Calculate fantasy points based on Sleeper API format
        const fpts = weekStats.fpts || 0;
        const fptsDecimal = weekStats.fpts_decimal || 0;
        const totalFpts = fpts + (fptsDecimal / 100);
        
        return {
          ...player,
          stats: weekStats,
          projected_pts: weekStats.projected_pts || 0,
          pts_ppr: totalFpts
        } as Player;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Calculate total points
    const totalPoints = rosterPlayers.reduce((sum, player) => 
      sum + (player.pts_ppr || 0), 0);

    // Calculate position stats
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
      acc[pos].points += (player.pts_ppr || 0);
      acc[pos].projected += (player.projected_pts || 0);
      return acc;
    }, {} as Record<string, { count: number; points: number; projected: number }>);

    const teamStats: TeamStats = {
      teamId: userRoster.roster_id,
      ownerId: userRoster.owner_id,
      teamName: userRoster.metadata?.team_name || `Team ${userRoster.roster_id}`,
      wins: userRoster.settings.wins,
      losses: userRoster.settings.losses,
      ties: 0, // This would come from actual league data if available
      totalPoints,
      positionStats,
      players: rosterPlayers
    };

    return teamStats;
  }, [user, rosters, players, selectedWeek, currentLeague]);

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
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Team Overview</h2>
          <select
            className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={selectedWeek}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedWeek(e.target.value)}
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

      <LeagueStandings />
    </div>
  );
};

export default TeamOverview; 