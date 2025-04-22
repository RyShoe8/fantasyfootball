import React from 'react';
import { useLeague } from '../contexts/league';
import { DashboardData, TeamStanding, PlayerStats } from '../types/dashboard';

export const useDashboardData = (leagueId: string | undefined) => {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { setCurrentLeague, currentLeague } = useLeague();
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

        // Fetch league data
        await setCurrentLeague({ league_id: leagueId } as any);
        
        // Set a flag to indicate the league has been loaded
        leagueLoadedRef.current = true;

        // Mock data for testing
        const mockData: DashboardData = {
          standings: [
            {
              teamId: '1',
              teamName: 'Team 1',
              wins: 8,
              losses: 5,
              pointsFor: 1500,
              pointsAgainst: 1450,
              streak: 'W3',
              rank: 1
            },
            {
              teamId: '2',
              teamName: 'Team 2',
              wins: 7,
              losses: 6,
              pointsFor: 1480,
              pointsAgainst: 1470,
              streak: 'L1',
              rank: 2
            }
          ],
          topPlayers: [
            {
              playerId: '1',
              playerName: 'Player 1',
              position: 'QB',
              points: 300,
              projectedPoints: 25,
              name: 'Player 1',
              team: 'Team 1',
              rank: 1
            },
            {
              playerId: '2',
              playerName: 'Player 2',
              position: 'RB',
              points: 280,
              projectedPoints: 22,
              name: 'Player 2',
              team: 'Team 2',
              rank: 2
            }
          ],
          recentTransactions: [
            {
              type: 'ADD',
              playerName: 'New Player',
              teamName: 'Team 1',
              timestamp: new Date()
            }
          ],
          leagueInfo: currentLeague || { league_id: leagueId } as any,
          seasonNumber: 2023,
          rosterBreakdown: {
            totalStarters: 9,
            positions: {
              QB: 1,
              RB: 2,
              WR: 3,
              TE: 1,
              FLEX: 1,
              DEF: 1
            },
            benchSpots: 7,
            taxiSpots: 3,
            irSpots: 2
          },
          tradeDeadline: {
            week: 13,
            date: new Date('2023-12-01')
          },
          playoffInfo: {
            teams: 6,
            startDate: new Date('2023-12-12'),
            format: 'Single Elimination'
          },
          starters: [
            {
              playerId: '1',
              playerName: 'QB Starter',
              position: 'QB',
              points: 25,
              projectedPoints: 22,
              playerImage: undefined,
              name: 'QB Starter',
              team: 'Team 1',
              rank: 1
            },
            {
              playerId: '2',
              playerName: 'RB Starter',
              position: 'RB',
              points: 18,
              projectedPoints: 15,
              playerImage: undefined,
              name: 'RB Starter',
              team: 'Team 2',
              rank: 2
            }
          ]
        };

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [leagueId, setCurrentLeague]);

  return { data, isLoading, error };
}; 