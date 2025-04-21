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

import React from 'react';
import { SleeperRoster, SleeperPlayer, SleeperLeague } from '../types/sleeper';
import { PlayerStats } from '../types/player';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';

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
  age: number;
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
  const { user } = useAuth();
  const { rosters, loading: rosterLoading, error: rosterError } = useRoster();
  const { players, playerStats } = usePlayer();
  const { currentLeague, leagues, setCurrentLeague, selectedYear, setSelectedYear } = useLeague();
  const [selectedWeek, setSelectedWeek] = React.useState('0');
  const [sortField, setSortField] = React.useState<keyof PlayerStats>('pts_ppr');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  // Get current season helper function
  const getCurrentSeason = () => {
    const now = new Date();
    return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  };

  const rosterData = React.useMemo<RosterData | null>(() => {
    if (!user || !rosters || !players || !currentLeague) return null;

    // Filter rosters to only include those from the current league
    const leagueRosters = rosters.filter((r: SleeperRoster) => r.league_id === currentLeague.league_id);
    
    // Find the user's roster in the current league
    const userRoster = leagueRosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) return null;

    // Get all players from the roster including all roster spots
    const rosterPlayers = [
      ...(userRoster.starters || []).map((id: string) => ({ id, slot: 'starter' as const })),
      ...(userRoster.reserves || []).map((id: string) => ({ id, slot: 'bench' as const })),
      ...(userRoster.taxi || []).map((id: string) => ({ id, slot: 'taxi' as const })),
      ...(userRoster.ir || []).map((id: string) => ({ id, slot: 'ir' as const }))
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
        position_rank: 0, // This would need to be calculated based on position
        age: player.age
      } as RosterPlayer;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

    // Calculate position ranks
    const playersByPosition = rosterPlayers.reduce((acc, player) => {
      // Normalize position for IDP players
      const normalizedPosition = player.position === 'LB' ? 'IDP' : player.position;
      if (!acc[normalizedPosition]) {
        acc[normalizedPosition] = [];
      }
      acc[normalizedPosition].push(player);
      return acc;
    }, {} as Record<string, RosterPlayer[]>);

    // Calculate position ranks
    Object.values(playersByPosition).forEach(positionPlayers => {
      positionPlayers.sort((a, b) => (b.pts_ppr || 0) - (a.pts_ppr || 0));
      positionPlayers.forEach((player, index) => {
        player.position_rank = index + 1;
      });
    });

    // Calculate overall ranks across all players
    const allPlayers = [...rosterPlayers];
    allPlayers.sort((a, b) => (b.pts_ppr || 0) - (a.pts_ppr || 0));
    allPlayers.forEach((player, index) => {
      player.overall_rank = index + 1;
    });

    // Sort players by roster slot (starters first, then bench, then others)
    const sortedPlayers = [...rosterPlayers].sort((a, b) => {
      // First sort by roster slot
      const slotOrder = { starter: 0, bench: 1, taxi: 2, ir: 3 };
      const slotDiff = (slotOrder[a.roster_slot || 'bench'] || 0) - (slotOrder[b.roster_slot || 'bench'] || 0);
      if (slotDiff !== 0) return slotDiff;

      // Then sort by position
      const posOrder = { QB: 0, RB: 1, WR: 2, TE: 3, K: 4, DEF: 5 };
      const posDiff = (posOrder[a.position as keyof typeof posOrder] || 99) - (posOrder[b.position as keyof typeof posOrder] || 99);
      if (posDiff !== 0) return posDiff;

      // Finally sort by points
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

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWeek(e.currentTarget.value);
  };

  const handleSort = (field: keyof PlayerStats) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.currentTarget.value);
  };

  const teamStats = React.useMemo(() => {
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

  const getPlayerStats = (playerId: string) => {
    const stats = playerStats[playerId];
    if (!stats) return 'Loading stats...';

    const position = players[playerId]?.position;
    if (!position) return 'Position not found';

    try {
      switch (position) {
        case 'QB':
          return `Passing: ${stats.passing_yards || 0} yds, ${stats.passing_tds || 0} TD, ${stats.passing_ints || 0} INT\nRushing: ${stats.rushing_yards || 0} yds, ${stats.rushing_tds || 0} TD`;
        case 'RB':
          return `Rushing: ${stats.rushing_yards || 0} yds, ${stats.rushing_tds || 0} TD\nReceiving: ${stats.receiving_yards || 0} yds, ${stats.receiving_tds || 0} TD, ${stats.receptions || 0} rec`;
        case 'WR':
        case 'TE':
          return `Receiving: ${stats.receiving_yards || 0} yds, ${stats.receiving_tds || 0} TD, ${stats.receptions || 0} rec\nTargets: ${stats.receiving_targets || 0}`;
        case 'K':
          return `Kicking: ${stats.fg_made || 0}/${stats.fg_attempts || 0} FG, ${stats.xp_made || 0}/${stats.xp_attempts || 0} XP`;
        case 'DEF':
          return `Defense: ${stats.sacks || 0} sacks, ${stats.interceptions || 0} INT, ${stats.fumbles_recovered || 0} FR`;
        case 'LB':
        case 'DB':
        case 'DL':
          return `Tackles: ${stats.tackles || 0}, Sacks: ${stats.sacks || 0}, INT: ${stats.interceptions || 0}, FF: ${stats.fumbles_forced || 0}, FR: ${stats.fumbles_recovered || 0}`;
        default:
          return 'No stats available';
      }
    } catch (error) {
      console.error('Error formatting player stats:', error);
      return 'Error loading stats';
    }
  };

  const renderPlayerStats = (playerId: string) => {
    const stats = getPlayerStats(playerId);
    return (
      <div className="text-sm text-gray-600 whitespace-pre-line">
        {stats}
      </div>
    );
  };

  const getPointsDisplay = (points: number | undefined) => {
    if (points === undefined || points === null) return '0.00';
    return points.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Roster</h2>
          <div className="flex gap-4">
            {/* Year Selection */}
            <select
              className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {Array.from({ length: 3 }, (_, i) => {
                const year = (getCurrentSeason() - i).toString();
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            {/* Team Selection */}
            <select
              className="mt-1 block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={currentLeague?.league_id || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const league = leagues.find((l: SleeperLeague) => l.league_id === e.target.value);
                if (league) {
                  setCurrentLeague(league);
                }
              }}
            >
              {leagues.map((league: SleeperLeague) => (
                <option key={league.league_id} value={league.league_id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
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
                    onClick={(e: React.MouseEvent<HTMLTableHeaderCellElement>) => handleSort('pts_ppr')(e as React.MouseEvent<HTMLButtonElement>)}>
                  Season Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={(e: React.MouseEvent<HTMLTableHeaderCellElement>) => handleSort('projected_pts')(e as React.MouseEvent<HTMLButtonElement>)}>
                  Projected Season
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={(e: React.MouseEvent<HTMLTableHeaderCellElement>) => handleSort('pts_ppr')(e as React.MouseEvent<HTMLButtonElement>)}>
                  Avg Points/Game
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
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <img
                          className="h-10 w-10 rounded-full object-cover absolute inset-0"
                          src={`https://sleepercdn.com/players/avatar/${player.player_id}`}
                          alt={player.full_name}
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium absolute inset-0';
                              fallback.textContent = player.position;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium absolute inset-0 opacity-0">
                          {player.position}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{player.full_name}</div>
                        <div className="text-sm text-gray-500">{player.position} • {player.age || 'N/A'} years old</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.team}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Overall: #{player.overall_rank}</div>
                    <div>Position: #{player.position_rank}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {renderPlayerStats(player.player_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPointsDisplay(player.stats?.pts_ppr)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPointsDisplay(player.stats?.projected_pts)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPointsDisplay(player.stats?.pts_ppr ? player.stats.pts_ppr / (player.stats.games_played || 1) : 0)}
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
            onChange={handleWeekChange}
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
                    onClick={(e: React.MouseEvent<HTMLTableHeaderCellElement>) => handleSort('teamName')(e as React.MouseEvent<HTMLButtonElement>)}>
                  Team Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={(e: React.MouseEvent<HTMLTableHeaderCellElement>) => handleSort('wins')(e as React.MouseEvent<HTMLButtonElement>)}>
                  W
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={(e: React.MouseEvent<HTMLTableHeaderCellElement>) => handleSort('losses')(e as React.MouseEvent<HTMLButtonElement>)}>
                  L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={(e: React.MouseEvent<HTMLTableHeaderCellElement>) => handleSort('ties')(e as React.MouseEvent<HTMLButtonElement>)}>
                  T
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={(e: React.MouseEvent<HTMLTableHeaderCellElement>) => handleSort('totalPoints')(e as React.MouseEvent<HTMLButtonElement>)}>
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

      {/* IR Players Section */}
      {rosterData.players.some((p: RosterPlayer) => p.roster_slot === 'ir') && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Injured Reserve</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Injury Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rosterData.players
                  .filter((player: RosterPlayer) => player.roster_slot === 'ir')
                  .map((player: RosterPlayer) => (
                    <tr key={player.player_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <img
                              className="h-10 w-10 rounded-full object-cover absolute inset-0"
                              src={`https://sleepercdn.com/players/avatar/${player.player_id}`}
                              alt={player.full_name}
                              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium absolute inset-0';
                                  fallback.textContent = player.position;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium absolute inset-0 opacity-0">
                              {player.position}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{player.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.injury_status ? (
                          <span className="text-red-600">{player.injury_status}</span>
                        ) : (
                          <span className="text-gray-500">IR</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.injury_notes || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Taxi Squad Section */}
      {rosterData.players.some((p: RosterPlayer) => p.roster_slot === 'taxi') && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Taxi Squad</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Injury Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rosterData.players
                  .filter((player: RosterPlayer) => player.roster_slot === 'taxi')
                  .map((player: RosterPlayer) => (
                    <tr key={player.player_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <img
                              className="h-10 w-10 rounded-full object-cover absolute inset-0"
                              src={`https://sleepercdn.com/players/avatar/${player.player_id}`}
                              alt={player.full_name}
                              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium absolute inset-0';
                                  fallback.textContent = player.position;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium absolute inset-0 opacity-0">
                              {player.position}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{player.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.injury_status ? (
                          <span className="text-red-600">{player.injury_status}</span>
                        ) : (
                          <span className="text-gray-500">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.injury_notes || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roster; 