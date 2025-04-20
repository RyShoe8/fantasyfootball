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
  positionStats: Record<string, { count: number; points: number; projected: number }>;
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
}

const TeamOverview: React.FC = () => {
  const { user, rosters, players, currentLeague, leagues } = useSleeper();
  const [selectedWeek, setSelectedWeek] = useState('0');
  const [sortField, setSortField] = useState<SortableFields>('totalPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const rosterData = useMemo<RosterData | null>(() => {
    if (!user || !rosters || !players || !currentLeague) return null;

    const userRoster = rosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) return null;

    const rosterPlayers = [...(userRoster.starters || []), ...(userRoster.reserves || [])]
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
          isStarter: userRoster.starters?.includes(playerId) || false,
          owner_id: userRoster.owner_id
        } as RosterPlayer;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return {
      roster: userRoster,
      players: rosterPlayers
    };
  }, [user, rosters, players, selectedWeek, currentLeague]);

  const teamStats = useMemo(() => {
    if (!user || !rosters || !currentLeague) {
      console.log('Missing required data:', { user, rosters, currentLeague });
      return null;
    }

    // Filter rosters to only include those from the current league
    const leagueRosters = rosters.filter((r: SleeperRoster) => r.league_id === currentLeague.league_id);
    console.log('League rosters:', leagueRosters);
    
    // Find the user's roster in the current league
    const userRoster = leagueRosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
    if (!userRoster) {
      console.log('User roster not found in current league:', { userId: user.user_id, leagueId: currentLeague.league_id });
      return null;
    }

    console.log('User roster metadata:', userRoster.metadata);
    console.log('User roster ID:', userRoster.roster_id);
    console.log('User roster settings:', userRoster.settings);

    const rosterPlayers = [...(userRoster.starters || []), ...(userRoster.reserves || [])]
      .map(playerId => {
        const player = players[playerId as keyof typeof players] as ExtendedPlayer | undefined;
        if (!player) {
          console.log('Player not found:', playerId);
          return null;
        }
        
        const weekStats = player.stats?.[selectedWeek] || {};
        console.log('Player stats for week', selectedWeek, ':', { playerId, weekStats });
        
        return {
          ...player,
          stats: player.stats || {},
          projected_pts: weekStats.projected_pts || 0,
          pts_ppr: weekStats.pts_ppr || 0
        } as ExtendedPlayer;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const totalPoints = rosterPlayers.reduce((sum, player) => 
      sum + ((player.pts_ppr as number) || 0), 0);
    console.log('Total points calculated:', totalPoints);

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
    console.log('Position stats calculated:', positionStats);

    // Get the team name from the roster metadata, or use a default if not available
    const teamName = userRoster.metadata?.team_name || 
                    `Team ${userRoster.roster_id}`;
    console.log('Team name resolved:', { 
      fromMetadata: userRoster.metadata?.team_name,
      final: teamName 
    });

    const teamStats: TeamStats = {
      teamId: userRoster.roster_id.toString(),
      ownerId: userRoster.owner_id,
      teamName,
      wins: userRoster.settings.wins || 0,
      losses: userRoster.settings.losses || 0,
      ties: userRoster.settings.fpts === userRoster.settings.fpts_against ? 1 : 0,
      totalPoints,
      positionStats,
      players: rosterPlayers
    };

    console.log('Final team stats:', teamStats);
    return teamStats;
  }, [user, rosters, players, selectedWeek, currentLeague]);

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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {teamStats.teamName}
            {currentLeague && (
              <span className="text-sm text-gray-500 ml-2">
                {getSeasonNumber(currentLeague.season)}
              </span>
            )}
          </h2>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('totalPoints')}>
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('totalPoints')}>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {player.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPosition(player.position)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.team}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.pts_ppr?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.projected_pts?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.isStarter ? 'Starter' : 'Bench'}
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
                          <span>{formatPosition(pos)}:</span>
                          <span>{stats.points.toFixed(2)} pts</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span>Bench:</span>
                        <span>{rosterData.roster.reserves?.length || 0} players</span>
                      </div>
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