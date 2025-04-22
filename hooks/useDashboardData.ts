import React from 'react';
import { useLeague } from '../contexts/league';
import { DashboardData, TeamStanding, PlayerStats } from '../types/dashboard';

export const useDashboardData = (leagueId: string | undefined) => {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { refreshLeague } = useLeague();

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
        await refreshLeague(leagueId);

        // TODO: Implement actual API calls to fetch:
        // - Standings
        // - Top players
        // - Recent transactions
        // For now, using mock data
        const mockData: DashboardData = {
          standings: [],
          topPlayers: [],
          recentTransactions: [],
          leagueInfo: {}
        };

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [leagueId, refreshLeague]);

  return { data, isLoading, error };
}; 