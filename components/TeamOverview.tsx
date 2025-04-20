import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import type { SleeperRoster, SleeperUser, SleeperPlayer } from '../types/sleeper';
import type { PlayerStats } from '../types/player';

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

    const allPlayers = [
      ...(userRoster.starters || []),
      ...(userRoster.reserves || []),
      ...(userRoster.taxi || []),
      ...(userRoster.ir || [])
    ];
    
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

    const leagueRosters = rosters.filter((r: SleeperRoster) => r.league_id === currentLeague.league_id);
    console.log('League rosters:', leagueRosters.map((r: SleeperRoster) => ({ 
      rosterId: r.roster_id, 
      ownerId: r.owner_id,
      leagueId: r.league_id
    })));
    
    const userRoster = leagueRosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) {
      console.log('User roster not found in current league:', { userId: user.user_id, leagueId: currentLeague.league_id });
      return null;
    }

    console.log('User roster metadata:', userRoster.metadata);
    console.log('User roster ID:', userRoster.roster_id);
    console.log('User roster settings:', userRoster.settings);

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

    const stats: TeamStats = {
      teamId: userRoster.roster_id.toString(),
      ownerId: userRoster.owner_id,
      teamName: teamName,
      wins: userRoster.settings?.wins || 0,
      losses: userRoster.settings?.losses || 0,
      ties: 0,
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

  const getSeasonNumber = (season: string) => {
    const sortedLeagues = [...leagues].sort((a, b) => parseInt(a.season) - parseInt(b.season));
    const seasonIndex = sortedLeagues.findIndex(l => l.season === season);
    
    if (seasonIndex === -1) return '';
    
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Standings</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points For</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Against</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTeams.map((team, index) => (
              <tr key={team.roster.roster_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.teamName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.wins}-{team.losses}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.totalPoints.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.totalPoints.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamOverview;