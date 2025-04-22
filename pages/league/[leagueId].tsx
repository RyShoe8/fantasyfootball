/** @jsxImportSource react */
import * as React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/auth';
import { useLeague } from '../../contexts/league';
import { usePlayer } from '../../contexts/player/PlayerContext';
import { useRoster } from '../../contexts/roster';
import LeagueInfo from '../../components/LeagueInfo';
import LeagueStandings from '../../components/LeagueStandings';
import TeamOverview from '../../components/TeamOverview';
import PlayerRankings from '../../components/PlayerRankings';

export default function LeaguePage() {
  const router = useRouter();
  const { leagueId } = router.query;
  const { user } = useAuth();
  const { currentLeague, isLoading: leagueLoading, error: leagueError } = useLeague();
  const { players, isLoading: playersLoading, error: playersError } = usePlayer();
  const { rosters, loading: rostersLoading, error: rostersError } = useRoster();
  const [activeTab, setActiveTab] = React.useState('overview');

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (leagueLoading || playersLoading || rostersLoading) {
    return <div>Loading...</div>;
  }

  if (leagueError || playersError || rostersError) {
    return <div>Error loading league data</div>;
  }

  if (!currentLeague) {
    return <div>League not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LeagueInfo 
        league={currentLeague} 
        selectedYear={currentLeague.season}
        availableYears={[currentLeague.season]}
        onYearChange={(year) => {
          // Handle year change if needed
          console.log('Year changed:', year);
        }}
      />
      <div className="mt-8">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'standings' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('standings')}
          >
            Standings
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'players' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('players')}
          >
            Players
          </button>
        </div>
        {activeTab === 'overview' && <TeamOverview />}
        {activeTab === 'standings' && <LeagueStandings />}
        {activeTab === 'players' && <PlayerRankings />}
      </div>
    </div>
  );
} 