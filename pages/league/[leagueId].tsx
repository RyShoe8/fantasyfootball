/** @jsxImportSource react */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/auth';
import { useLeague } from '../../contexts/league';
import { usePlayer } from '../../contexts/player';
import { useRoster } from '../../contexts/roster';
import LeagueInfo from '../../components/league/LeagueInfo';
import LeagueStandings from '../../components/league/LeagueStandings';
import TeamOverview from '../../components/league/TeamOverview';
import PlayerRankings from '../../components/league/PlayerRankings';

export default function LeaguePage() {
  const router = useRouter();
  const { leagueId } = router.query;
  const { user } = useAuth();
  const { league, loading: leagueLoading, error: leagueError } = useLeague();
  const { players, loading: playersLoading, error: playersError } = usePlayer();
  const { rosters, loading: rostersLoading, error: rostersError } = useRoster();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
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

  if (!league) {
    return <div>League not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LeagueInfo league={league} />
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
        {activeTab === 'overview' && <TeamOverview rosters={rosters} />}
        {activeTab === 'standings' && <LeagueStandings rosters={rosters} />}
        {activeTab === 'players' && <PlayerRankings players={players} />}
      </div>
    </div>
  );
} 