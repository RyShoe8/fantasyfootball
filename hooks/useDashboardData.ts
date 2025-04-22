import React from 'react';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player/PlayerContext';
import { DashboardData, TeamStanding, PlayerStats } from '../types/dashboard';
import { LeagueApi, RosterApi, DraftApi } from '../services/api';
import { SleeperRoster, SleeperUser } from '../types/sleeper';

export const useDashboardData = (leagueId: string | undefined) => {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { setCurrentLeague, currentLeague, rosters, users, draftPicks } = useLeague();
  const { players, playerStats } = usePlayer();
  const leagueLoadedRef = React.useRef(false);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (!leagueId) {
        setError('No league ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch league data if not already loaded
        if (!currentLeague || currentLeague.league_id !== leagueId) {
          const leagueData = await LeagueApi.getLeague(leagueId);
          await setCurrentLeague(leagueData);
        }

        // Fetch rosters if not already loaded
        if (!rosters.length) {
          await RosterApi.getRosters(leagueId);
        }

        // Fetch users if not already loaded
        if (!users.length) {
          await LeagueApi.getLeagueUsers(leagueId);
        }

        // Fetch draft picks if not already loaded
        if (!draftPicks.length) {
          try {
            await DraftApi.getDraftPicks(leagueId);
          } catch (err) {
            console.error('Error fetching draft picks:', err);
            // Don't throw error for draft picks - they're optional
          }
        }

        // Set a flag to indicate the league has been loaded
        leagueLoadedRef.current = true;

        // Get the user's roster
        const userRoster = rosters[0]; // For now, just use the first roster
        
        // Get starters data
        const startersData = userRoster?.starters?.map((playerId: string) => {
          const player = players[playerId];
          const stats = playerStats[playerId];
          
          if (!player) return null;
          
          const playerData: PlayerStats = {
            playerId,
            name: player.full_name,
            position: player.position,
            team: player.team || '',
            points: stats?.pts_ppr || 0,
            rank: 0, // We'll need to calculate this if needed
            playerName: player.full_name,
            projectedPoints: stats?.projected_pts || 0,
            playerImage: `https://sleepercdn.com/content/nfl/players/${playerId}.jpg`
          };
          
          return playerData;
        }).filter((player: PlayerStats | null): player is PlayerStats => player !== null) || [];

        // Create dashboard data from real data
        const dashboardData: DashboardData = {
          standings: rosters.map((roster: SleeperRoster, index: number) => {
            const owner = users.find((u: SleeperUser) => u.user_id === roster.owner_id);
            const teamName = roster.metadata?.team_name || `Team ${index + 1}`;
            const displayName = owner?.display_name || owner?.username || 'Unknown';
            
            return {
              teamId: roster.roster_id,
              teamName: `${teamName} (${displayName})`,
              wins: roster.settings.wins,
              losses: roster.settings.losses,
              pointsFor: roster.settings.fpts,
              pointsAgainst: roster.settings.fpts_against,
              streak: calculateStreak(roster),
              rank: index + 1
            };
          }),
          topPlayers: [], // Will be populated by player context
          recentTransactions: [], // Will be populated by transaction context
          leagueInfo: currentLeague,
          seasonNumber: parseInt(currentLeague?.season || '2023'),
          rosterBreakdown: {
            totalStarters: currentLeague?.roster_positions.filter((pos: string) => !pos.includes('BN')).length || 0,
            positions: calculatePositionBreakdown(currentLeague?.roster_positions || []),
            benchSpots: currentLeague?.roster_positions.filter((pos: string) => pos.includes('BN')).length || 0,
            taxiSpots: currentLeague?.settings.taxi_slots || 0,
            irSpots: currentLeague?.roster_positions.filter((pos: string) => pos.includes('IR')).length || 0
          },
          tradeDeadline: {
            week: currentLeague?.settings.trade_deadline || 0,
            date: new Date() // Will be calculated based on week
          },
          playoffInfo: {
            teams: currentLeague?.settings.playoff_teams || 0,
            startDate: new Date(), // Will be calculated based on week
            format: currentLeague?.settings.playoff_type === 0 ? 'Single Elimination' : 'Double Elimination'
          },
          starters: startersData
        };

        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [leagueId, setCurrentLeague, currentLeague, rosters, users, draftPicks, players, playerStats]);

  return { data, isLoading, error };
};

// Helper function to calculate streak
const calculateStreak = (roster: SleeperRoster): string => {
  // Implementation will depend on your data structure
  return 'W1';
};

// Helper function to calculate position breakdown
const calculatePositionBreakdown = (positions: string[]): Record<string, number> => {
  const breakdown: Record<string, number> = {};
  positions.forEach((pos: string) => {
    if (!pos.includes('BN') && !pos.includes('IR')) {
      breakdown[pos] = (breakdown[pos] || 0) + 1;
    }
  });
  return breakdown;
};