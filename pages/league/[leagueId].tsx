import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSleeper } from '../../contexts/SleeperContext';
import LeagueInfo from '../../components/LeagueInfo';
import TeamOverview from '../../components/TeamOverview';
import LeagueStandings from '../../components/LeagueStandings';
import PlayerRankings from '../../components/PlayerRankings';

export default function LeaguePage() {
  const router = useRouter();
  const { leagueId } = router.query;
  const { currentLeague, setCurrentLeague, leagues } = useSleeper();

  useEffect(() => {
    if (leagueId && leagues) {
      const league = leagues.find(l => l.league_id === leagueId);
      if (league) {
        setCurrentLeague(league);
      } else {
        // If league not found, redirect to home
        router.push('/');
      }
    }
  }, [leagueId, leagues, setCurrentLeague, router]);

  if (!currentLeague) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading league data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* League Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <LeagueInfo />
      </div>

      {/* Team Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <TeamOverview />
      </div>

      {/* League Standings and Trade Evaluator */}
      <div className="space-y-6">
        {/* League Standings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">League Standings</h2>
          <LeagueStandings />
        </div>
      </div>

      {/* Player Rankings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Player Rankings</h2>
        <PlayerRankings />
      </div>
    </div>
  );
} 