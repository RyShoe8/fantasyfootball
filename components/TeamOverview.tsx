import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
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

// Create a separate interface for our extended player type
interface ExtendedPlayer extends Omit<SleeperPlayer, 'stats'> {
  stats?: Record<string, PlayerStats>;
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
  positionStats: Record<string, {
    count: number;
    points: number;
  }>;
  players: ExtendedPlayer[];
}

// Update SortableFields to only include fields that exist in TeamStats
type SortableFields = 'teamName' | 'wins' | 'losses' | 'ties' | 'totalPoints';

interface RosterPlayer extends ExtendedPlayer {
  isStarter: boolean;
  owner_id: string;
  full_name: string;
  position: string;
  team: string;
  player_id: string;
  stats: PlayerStats;
  projected_pts: number;
  pts_ppr: number;
}

interface RosterData {
  roster: SleeperRoster;
  players: RosterPlayer[];
  teamName: string;
}

export const TeamOverview: React.FC = () => {
  const { user, rosters, players, selectedWeek, setSelectedWeek, currentLeague, users, leagues } = useSleeper();
  const [sortField, setSortField] = useState<SortableFields>('totalPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});

  const rosterData = useMemo<RosterData | null>(() => {
    if (!user || !rosters || !players || !currentLeague) {
      console.log('Missing required data:', { 
        hasUser: !!user, 
        hasRosters: !!rosters, 
        hasPlayers: !!players, 
        hasCurrentLeague: !!currentLeague 
      });
      return null;
    }

    // Filter rosters to only include those from the current league
    const leagueRosters = rosters.filter((r: SleeperRoster) => {
      const matches = r.league_id === currentLeague.league_id;
      console.log('Checking roster:', { 
        rosterId: r.roster_id, 
        leagueId: r.league_id, 
        currentLeagueId: currentLeague.league_id,
        matches 
      });
      return matches;
    });
    console.log('League rosters:', leagueRosters.map((r: SleeperRoster) => ({ 
      rosterId: r.roster_id, 
      ownerId: r.owner_id,
      leagueId: r.league_id
    })));
    
    // Find the user's roster in the current league
    const userRoster = leagueRosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) {
      console.log('User roster not found in current league:', { 
        userId: user.user_id, 
        leagueId: currentLeague.league_id,
        availableRosters: leagueRosters.map((r: SleeperRoster) => ({ 
          rosterId: r.roster_id, 
          ownerId: r.owner_id 
        }))
      });
      return null;
    }

    // Get team name from users array
    const userData = users.find((u: { user_id: string }) => u.user_id === userRoster.owner_id);
    const teamName = userData?.metadata?.team_name || userData?.display_name || userData?.username || `Team ${userRoster.roster_id}`;
    console.log('Team name from users array:', { 
      userId: userRoster.owner_id, 
      userData, 
      teamName,
      metadata: userData?.metadata,
      display_name: userData?.display_name,
      username: userData?.username
    });

    // Get all players from the roster
    const allPlayers = [
      ...(userRoster.starters || []),
      ...(userRoster.reserves || []),
      ...(userRoster.taxi || []),
      ...(userRoster.ir || [])
    ];
    
    // Get starters and bench players
    const starters = userRoster.starters || [];
    const benchPlayers = allPlayers.filter((playerId: string) => !starters.includes(playerId));

    const rosterPlayers = [...starters, ...benchPlayers]
      .map(playerId => {
        const player = players[playerId as keyof typeof players];
        if (!player) return null;

        const rawStats = (player.stats?.[selectedWeek] || {}) as Partial<PlayerStats>;
        const weekStats: PlayerStats = {
          ...rawStats,
          fpts: typeof rawStats.fpts === 'number' ? rawStats.fpts : 0,
          fpts_decimal: typeof rawStats.fpts_decimal === 'number' ? rawStats.fpts_decimal : 0,
          projected_pts: typeof rawStats.projected_pts === 'number' ? rawStats.projected_pts : 0
        };
        
        const fpts = weekStats.fpts || 0;
        const fptsDecimal = weekStats.fpts_decimal || 0;
        const totalFpts = fpts + (fptsDecimal / 100);
        
        return {
          ...player,
          stats: weekStats,
          projected_pts: weekStats.projected_pts || 0,
          pts_ppr: totalFpts,
          full_name: `${player.first_name} ${player.last_name}`,
          position: player.position || '',
          team: player.team || '',
          player_id: player.player_id || '',
          isStarter: starters.includes(playerId),
          owner_id: userRoster.owner_id
        } as RosterPlayer;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return {
      roster: userRoster,
      players: rosterPlayers,
      teamName: teamName
    };
  }, [user, rosters, players, selectedWeek, currentLeague, users]);

  const teamStats = useMemo(() => {
    if (!user || !rosters || !currentLeague || !users) {
      console.log('Missing required data:', { user, rosters, currentLeague, users });
      return null;
    }

    // Filter rosters to only include those from the current league
    const leagueRosters = rosters.filter((r: SleeperRoster) => r.league_id === currentLeague.league_id);
    console.log('League rosters:', leagueRosters.map((r: SleeperRoster) => ({ 
      rosterId: r.roster_id, 
      ownerId: r.owner_id,
      leagueId: r.league_id
    })));
    
    // Find the user's roster in the current league
    const userRoster = leagueRosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) {
      console.log('User roster not found in current league:', { userId: user.user_id, leagueId: currentLeague.league_id });
      return null;
    }

    console.log('User roster metadata:', userRoster.metadata);
    console.log('User roster ID:', userRoster.roster_id);
    console.log('User roster settings:', userRoster.settings);

    // Get team name from users array
    const userData = users.find((u: { user_id: string }) => u.user_id === userRoster.owner_id);
    const teamName = userData?.metadata?.team_name || userData?.display_name || userData?.username || `Team ${userRoster.roster_id}`;
    console.log('Team name from users array:', { 
      userId: userRoster.owner_id, 
      userData, 
      teamName,
      metadata: userData?.metadata,
      display_name: userData?.display_name,
      username: userData?.username
    });

    // Calculate team stats
    const stats: TeamStats = {
      teamId: userRoster.roster_id.toString(),
      ownerId: userRoster.owner_id,
      teamName: teamName,
      wins: userRoster.settings?.wins || 0,
      losses: userRoster.settings?.losses || 0,
      ties: 0, // Ties are not tracked in Sleeper API
      totalPoints: 0,
      positionStats: {
        QB: { count: 0, points: 0 },
        RB: { count: 0, points: 0 },
        WR: { count: 0, points: 0 },
        TE: { count: 0, points: 0 },
        FLEX: { count: 0, points: 0 },
        SUPERFLEX: { count: 0, points: 0 },
        DEF: { count: 0, points: 0 },
        K: { count: 0, points: 0 }
      },
      players: []
    };

    // Process starters
    userRoster.starters.forEach((playerId: string) => {
      const player = players[playerId];
      if (player) {
        const position = player.position as keyof typeof stats.positionStats;
        if (position in stats.positionStats) {
          stats.positionStats[position].count++;
          stats.positionStats[position].points += player.stats?.pts_ppr || 0;
          stats.totalPoints += player.stats?.pts_ppr || 0;
          stats.players.push(player as ExtendedPlayer);
        }
      }
    });

    // Process bench players (reserve)
    if (userRoster.reserves) {
      userRoster.reserves.forEach((playerId: string) => {
        const player = players[playerId];
        if (player) {
          const position = player.position as keyof typeof stats.positionStats;
          if (position in stats.positionStats) {
            stats.positionStats[position].count++;
            stats.positionStats[position].points += player.stats?.pts_ppr || 0;
            stats.totalPoints += player.stats?.pts_ppr || 0;
            stats.players.push(player as ExtendedPlayer);
          }
        }
      });
    }

    // Process taxi squad
    if (userRoster.taxi) {
      userRoster.taxi.forEach((playerId: string) => {
        const player = players[playerId];
        if (player) {
          const position = player.position as keyof typeof stats.positionStats;
          if (position in stats.positionStats) {
            stats.positionStats[position].count++;
            stats.positionStats[position].points += player.stats?.pts_ppr || 0;
            stats.totalPoints += player.stats?.pts_ppr || 0;
            stats.players.push(player as ExtendedPlayer);
          }
        }
      });
    }

    // Process IR spots
    if (userRoster.ir) {
      userRoster.ir.forEach((playerId: string) => {
        const player = players[playerId];
        if (player) {
          const position = player.position as keyof typeof stats.positionStats;
          if (position in stats.positionStats) {
            stats.positionStats[position].count++;
            stats.positionStats[position].points += player.stats?.pts_ppr || 0;
            stats.totalPoints += player.stats?.pts_ppr || 0;
            stats.players.push(player as ExtendedPlayer);
          }
        }
      });
    }

    return stats;
  }, [user, rosters, players, selectedWeek, currentLeague, users]);

  useEffect(() => {
    // Fetch player stats when component mounts
    const fetchPlayerStats = async () => {
      try {
        const stats: Record<string, PlayerStats> = {};
        // TODO: Implement actual stats fetching
        setPlayerStats(stats);
      } catch (error) {
        console.error('Error fetching player stats:', error);
      }
    };
    fetchPlayerStats();
  }, []);

  if (!teamStats || !rosterData) {
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

  // Format roster positions
  const formatPosition = (pos: string) => {
    switch (pos) {
      case 'SUPER_FLEX':
        return 'Super Flex';
      case 'IDP_FLEX':
        return 'IDP Flex';
      default:
        return pos;
    }
  };

  // Helper function to determine season number
  const getSeasonNumber = (season: string) => {
    // Sort leagues by season to determine which season number this is
    const sortedLeagues = [...leagues].sort((a, b) => parseInt(a.season) - parseInt(b.season));
    const seasonIndex = sortedLeagues.findIndex(l => l.season === season);
    
    if (seasonIndex === -1) return '';
    
    // Convert to ordinal (1st, 2nd, 3rd, etc.)
    const seasonNumber = seasonIndex + 1;
    const suffix = ['th', 'st', 'nd', 'rd'][seasonNumber % 10] || 'th';
    return ` (${seasonNumber}${suffix} Season)`;
  };

  const handleIdClick = (id: string): void => {
    console.log('ID clicked:', id);
  };

  const handlePlayerClick = (playerId: string): void => {
    console.log('Player clicked:', playerId);
  };

  const handleBenchPlayerClick = (playerId: string): void => {
    console.log('Bench player clicked:', playerId);
  };

  const handleTaxiPlayerClick = (playerId: string): void => {
    console.log('Taxi player clicked:', playerId);
  };

  const handleIRPlayerClick = (playerId: string): void => {
    console.log('IR player clicked:', playerId);
  };

  const handleReservePlayerClick = (playerId: string): void => {
    console.log('Reserve player clicked:', playerId);
  };

  const getPlayerStats = (playerId: string): PlayerStats => {
    const stats = playerStats[playerId] as PlayerStats;
    return stats || { projected: 0, actual: 0 };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Team Name</h3>
          <p className="text-gray-700">{teamStats.teamName}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Team Stats</h3>
          <div className="grid grid-cols-2 gap-2">
            <p className="text-gray-700">Total Points: {teamStats.totalPoints}</p>
            <p className="text-gray-700">QB: {teamStats.positionStats.QB.count} players</p>
            <p className="text-gray-700">RB: {teamStats.positionStats.RB.count} players</p>
            <p className="text-gray-700">WR: {teamStats.positionStats.WR.count} players</p>
            <p className="text-gray-700">TE: {teamStats.positionStats.TE.count} players</p>
            <p className="text-gray-700">FLEX: {teamStats.positionStats.FLEX.count} players</p>
          </div>
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
                          <span>{formatPosition(pos)}:</span>
                          <span>{(stats as { points: number }).points.toFixed(2)} pts</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span>Bench:</span>
                        <span>{rosterData.roster.players?.filter((id: string) => !rosterData.roster.starters?.includes(id)).length || 0} players</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{teamStats.teamName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Starters</h3>
            <div className="space-y-2">
              {rosterData.roster.starters?.map((playerId: string) => {
                const player = players?.[playerId];
                return player ? (
                  <div key={playerId} className="flex justify-between items-center">
                    <span>{`${player.first_name} ${player.last_name}`} ({player.position})</span>
                    <span>{getPlayerStats(playerId).projected} pts</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Bench</h3>
            <div className="space-y-2">
              {rosterData.roster.players?.filter((id: string) => !rosterData.roster.starters?.includes(id)).map((playerId: string) => {
                const player = players?.[playerId];
                return player ? (
                  <div key={playerId} className="flex justify-between items-center">
                    <span>{`${player.first_name} ${player.last_name}`} ({player.position})</span>
                    <span>{getPlayerStats(playerId).projected} pts</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          {rosterData.roster.taxi && rosterData.roster.taxi.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Taxi Squad</h3>
              <div className="space-y-2">
                {rosterData.roster.taxi.map((playerId: string) => {
                  const player = players?.[playerId];
                  return player ? (
                    <div key={playerId} className="flex justify-between items-center">
                      <span>{`${player.first_name} ${player.last_name}`} ({player.position})</span>
                      <span>{getPlayerStats(playerId).projected} pts</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {rosterData.roster.ir && rosterData.roster.ir.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Injured Reserve</h3>
              <div className="space-y-2">
                {rosterData.roster.ir.map((playerId: string) => {
                  const player = players?.[playerId];
                  return player ? (
                    <div key={playerId} className="flex justify-between items-center">
                      <span>{`${player.first_name} ${player.last_name}`} ({player.position})</span>
                      <span>{getPlayerStats(playerId).projected} pts</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
        {teamStats && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Team Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-xl font-bold">{teamStats.totalPoints.toFixed(2)}</p>
              </div>
              {Object.entries(teamStats.positionStats).map(([position, stats]) => (
                <div key={position}>
                  <p className="text-sm text-gray-600">{position}</p>
                  <p className="text-xl font-bold">{(stats as { count: number }).count} players</p>
                  <p className="text-sm text-gray-600">{(stats as { points: number }).points.toFixed(2)} pts</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LeagueStandings />
    </div>
  );
};

export default TeamOverview;