import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSleeper } from '../../contexts/SleeperContext';
import LeagueInfo from '../../components/LeagueInfo';
import TeamOverview from '../../components/TeamOverview';
import LeagueStandings from '../../components/LeagueStandings';
import PlayerRankings from '../../components/PlayerRankings';

export default function LeaguePage() {
  const router = useRouter();
  const { leagueId } = router.query;
  const { currentLeague, setCurrentLeague, leagues, isLoading } = useSleeper();
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  useEffect(() => {
    if (leagueId && leagues) {
      const league = leagues.find(l => l.league_id === leagueId);
      if (league) {
        setCurrentLeague(league);
        setIsLoadingPage(false);
      } else {
        // If league not found, redirect to home
        router.push('/');
      }
    }
  }, [leagueId, leagues, setCurrentLeague, router]);

  if (isLoading || isLoadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading league data...</p>
        </div>
      </div>
    );
  }

  if (!currentLeague) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">League not found</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
      >
        ← Back to Dashboard
      </button>

      {/* League Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <LeagueInfo />
      </div>

      {/* Team Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <TeamOverview />
      </div>

      {/* League Standings and Trade Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">League Standings</h2>
              <span className="text-gray-600">Season: {currentLeague.season}</span>
            </div>
          </div>
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