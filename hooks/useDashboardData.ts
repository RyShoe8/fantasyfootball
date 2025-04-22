import React from 'react';
import { useLeague } from '../contexts/league';
import { DashboardData, TeamStanding, PlayerStats } from '../types/dashboard';

export const useDashboardData = (leagueId: string | undefined) => {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { setCurrentLeague, currentLeague } = useLeague();

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

        // Wait for the league data to be loaded
        if (!currentLeague) {
          throw new Error('Failed to load league data');
        }

        // TODO: Implement actual API calls to fetch:
        // - Standings
        // - Top players
        // - Recent transactions
        // For now, using mock data
        const mockData: DashboardData = {
          standings: [],
          topPlayers: [],
          recentTransactions: [],
          leagueInfo: currentLeague
        };

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [leagueId, setCurrentLeague, currentLeague]);

  return { data, isLoading, error };
}; 