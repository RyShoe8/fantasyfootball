/**
 * Roster Page
 * 
 * This page displays the user's fantasy football roster with detailed player statistics.
 * It organizes players by position and shows their performance metrics.
 * 
 * Key features:
 * - Displays players grouped by position (QB, RB, WR, TE, K, IDP)
 * - Shows 2023 total points and 2024 projected points for each player
 * - Indicates player injury status
 * - Provides a back button to return to the dashboard
 */

/** @jsxImportSource react */
import React, { useState, useMemo } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperRoster, SleeperPlayer } from '../types/sleeper';

interface PlayerStats {
  pts_ppr?: number;
  pts_half_ppr?: number;
  pts_std?: number;
  projected_pts?: number;
  fpts?: number;
  fpts_decimal?: number;
  fpts_against?: number;
  fpts_against_decimal?: number;
  // Position-specific stats
  passing_yards?: number;
  passing_tds?: number;
  passing_ints?: number;
  rushing_yards?: number;
  rushing_tds?: number;
  receiving_yards?: number;
  receiving_tds?: number;
  receptions?: number;
  tackles?: number;
  sacks?: number;
  interceptions?: number;
  fumbles?: number;
  fumbles_lost?: number;
  [key: string]: any;
}

interface Player extends SleeperPlayer {
  stats?: PlayerStats;
  projected_pts?: number;
  pts_ppr?: number;
  full_name: string;
  position: string;
  team: string;
  player_id: string;
  overall_rank?: number;
  position_rank?: number;
  roster_slot?: 'starter' | 'bench' | 'ir' | 'taxi';
}

interface RosterPlayer extends Player {
  isStarter: boolean;
  owner_id: string;
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

interface RosterData {
  roster: SleeperRoster;
  players: RosterPlayer[];
}

const Roster: React.FC = () => {
  const { user, rosters, players, currentLeague } = useSleeper();
  const [selectedWeek, setSelectedWeek] = useState('0');
  const [sortField, setSortField] = useState<keyof PlayerStats>('pts_ppr');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const rosterData = useMemo<RosterData | null>(() => {
    if (!user || !rosters || !players || !currentLeague) return null;

    // Filter rosters to only include those from the current league
    const leagueRosters = rosters.filter((r: SleeperRoster) => r.league_id === currentLeague.league_id);
    
    // Find the user's roster in the current league
    const userRoster = leagueRosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) return null;

    // Get all players from the roster including all roster spots
    const rosterPlayers = [
      ...(userRoster.starters || []).map(id => ({ id, slot: 'starter' as const })),
      ...(userRoster.reserves || []).map(id => ({ id, slot: 'bench' as const })),
      ...(userRoster.taxi || []).map(id => ({ id, slot: 'taxi' as const })),
      ...(userRoster.ir || []).map(id => ({ id, slot: 'ir' as const }))
    ].map(({ id, slot }) => {
      const player = players[id as keyof typeof players];
      if (!player) return null;

      // Get stats for the selected week and ensure it's typed as PlayerStats
      const rawStats = (player.stats?.[selectedWeek] || {}) as Partial<PlayerStats>;
      const weekStats: PlayerStats = {
        ...rawStats,
        fpts: typeof rawStats.fpts === 'number' ? rawStats.fpts : 0,
        fpts_decimal: typeof rawStats.fpts_decimal === 'number' ? rawStats.fpts_decimal : 0,
        projected_pts: typeof rawStats.projected_pts === 'number' ? rawStats.projected_pts : 0
      };
      
      // Calculate fantasy points based on Sleeper API format
      const fpts = weekStats.fpts || 0;
      const fptsDecimal = weekStats.fpts_decimal || 0;
      const totalFpts = fpts + (fptsDecimal / 100);
      
      return {
        ...player,
        stats: weekStats,
        projected_pts: weekStats.projected_pts || 0,
        pts_ppr: totalFpts,
        isStarter: slot === 'starter',
        full_name: `${player.first_name} ${player.last_name}`,
        position: player.position || '',
        team: player.team || '',
        player_id: player.player_id || '',
        owner_id: userRoster.owner_id,
        roster_slot: slot,
        overall_rank: player.search_rank || 0,
        position_rank: 0 // This would need to be calculated based on position
      } as RosterPlayer;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

    // Calculate position ranks
    const playersByPosition = rosterPlayers.reduce((acc, player) => {
      if (!acc[player.position]) {
        acc[player.position] = [];
      }
      acc[player.position].push(player);
      return acc;
    }, {} as Record<string, RosterPlayer[]>);

    Object.values(playersByPosition).forEach(positionPlayers => {
      positionPlayers.sort((a, b) => (b.pts_ppr || 0) - (a.pts_ppr || 0));
      positionPlayers.forEach((player, index) => {
        player.position_rank = index + 1;
      });
    });

    // Sort players
    const sortedPlayers = [...rosterPlayers].sort((a, b) => {
      const aValue = a.stats?.[sortField] || 0;
      const bValue = b.stats?.[sortField] || 0;
      return sortDirection === 'asc' ? 
        (aValue < bValue ? -1 : 1) : 
        (aValue > bValue ? -1 : 1);
    });

    return {
      roster: userRoster,
      players: sortedPlayers
    };
  }, [user, rosters, players, selectedWeek, currentLeague, sortField, sortDirection]);

  if (!rosterData) {
    return <div>Loading...</div>;
  }

  const handleSort = (field: keyof PlayerStats) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const teamStats = useMemo(() => {
    if (!user || !rosters) return null;

    const userRoster = rosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) return null;

    const rosterPlayers = [...(userRoster.starters || []), ...(userRoster.reserves || [])]
      .map(playerId => {
        const player = players[playerId as keyof typeof players] as Player | undefined;
        return player ? {
          ...player,
          stats: player.stats || {},
          projected_pts: player.stats?.[selectedWeek]?.projected_pts || 0,
          pts_ppr: player.stats?.[selectedWeek]?.pts_ppr || 0
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

    const teamStats: TeamStats = {
      teamId: userRoster.roster_id.toString(),
      ownerId: userRoster.owner_id,
      teamName: userRoster.metadata?.team_name || `Team ${userRoster.roster_id}`,
      wins: 0, // These would come from actual league data
      losses: 0,
      ties: 0,
      totalPoints,
      positionStats,
      players: rosterPlayers
    };

    return teamStats;
  }, [user, rosters, players, selectedWeek]);

  if (!teamStats) {
    return <div>Loading...</div>;
  }

  const sortedTeams = [teamStats].sort((a, b) => {
    const aValue = a[sortField as SortableFields];
    const bValue = b[sortField as SortableFields];
    return sortDirection === 'asc' ? 
      (aValue < bValue ? -1 : 1) : 
      (aValue > bValue ? -1 : 1);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Roster</h2>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ranks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('pts_ppr')}>
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('projected_pts')}>
                  Projected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rosterData.players.map((player: RosterPlayer) => (
                <tr key={player.player_id} className={player.isStarter ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={`https://sleepercdn.com/avatars/${player.player_id}`}
                          alt={player.full_name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://sleepercdn.com/avatars/default.png';
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{player.full_name}</div>
                        <div className="text-sm text-gray-500">{player.roster_slot}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.team}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Overall: #{player.overall_rank}</div>
                    <div>Position: #{player.position_rank}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPositionStats(player)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.pts_ppr?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.projected_pts?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.injury_status ? (
                      <span className="text-red-600">{player.injury_status}</span>
                    ) : (
                      <span className="text-green-600">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};

// Helper function to get position-specific stats
const getPositionStats = (player: RosterPlayer) => {
  const stats = player.stats || {};
  switch (player.position) {
    case 'QB':
      return (
        <div className="space-y-1">
          <div>Pass: {stats.passing_yards?.toLocaleString() || 0} yds</div>
          <div>TD: {stats.passing_tds || 0}</div>
          <div>INT: {stats.passing_ints || 0}</div>
        </div>
      );
    case 'RB':
      return (
        <div className="space-y-1">
          <div>Rush: {stats.rushing_yards?.toLocaleString() || 0} yds</div>
          <div>TD: {stats.rushing_tds || 0}</div>
          <div>Rec: {stats.receptions || 0}</div>
        </div>
      );
    case 'WR':
    case 'TE':
      return (
        <div className="space-y-1">
          <div>Rec: {stats.receptions || 0}</div>
          <div>Yds: {stats.receiving_yards?.toLocaleString() || 0}</div>
          <div>TD: {stats.receiving_tds || 0}</div>
        </div>
      );
    case 'IDP':
      return (
        <div className="space-y-1">
          <div>Tackles: {stats.tackles || 0}</div>
          <div>Sacks: {stats.sacks || 0}</div>
          <div>INT: {stats.interceptions || 0}</div>
        </div>
      );
    default:
      return null;
  }
};

export default Roster; 