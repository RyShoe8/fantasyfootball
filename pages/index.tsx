/**
 * Dashboard Page (Home)
 * 
 * This is the main dashboard of the Fantasy Football application.
 * It displays an overview of the user's league, team, and provides
 * access to various features like roster management, trade evaluation,
 * and player rankings.
 * 
 * Key features:
 * - League information display
 * - Team overview with record and points
 * - Quick access to roster management
 * - Trade evaluation tool
 * - Placeholder cards for upcoming features
 */

import LeagueInfo from '../components/LeagueInfo';
import { useSleeper } from '../contexts/SleeperContext';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SleeperLeague } from '../types/sleeper';
import axios from 'axios';
import DebugSection from '../components/DebugSection';
import Link from 'next/link';
import TeamOverview from '../components/TeamOverview';
import LeagueStandings from '../components/LeagueStandings';
import PlayerRankings from '../components/PlayerRankings';

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

// Helper function to format API response data
const formatApiResponse = (data: any, type: string) => {
  switch (type) {
    case 'user':
      return {
        username: data.username,
        display_name: data.display_name,
        user_id: data.user_id,
        avatar: data.avatar,
        metadata: data.metadata || {}
      };
    case 'league':
      return {
        name: data.name,
        league_id: data.league_id,
        season: data.season,
        status: data.status,
        total_rosters: data.total_rosters,
        roster_positions: data.roster_positions,
        settings: {
          num_teams: data.settings.num_teams,
          playoff_teams: data.settings.playoff_teams,
          waiver_type: data.settings.waiver_type,
          waiver_budget: data.settings.waiver_budget
        }
      };
    case 'rosters':
      return data.map((roster: any) => ({
        roster_id: roster.roster_id,
        owner_id: roster.owner_id,
        team_name: roster.metadata?.team_name || `Team ${roster.roster_id}`,
        starters: roster.starters || [],
        reserves: roster.reserve || [],
        taxi: roster.taxi || [],
        ir: roster.ir || [],
        players: roster.players || [],
        settings: roster.settings || {}
      }));
    case 'players':
      return `Total players: ${Object.keys(data).length}`;
    case 'draft_picks':
      return data.map((pick: any) => ({
        round: pick.round,
        roster_id: pick.roster_id,
        owner_id: pick.owner_id,
        player_id: pick.player_id,
        picked_by: pick.picked_by,
        metadata: pick.metadata || {}
      }));
    default:
      return data;
  }
};

export default function Home() {
  const { 
    currentLeague, 
    leagues, 
    rosters, 
    players, 
    user, 
    setCurrentLeague,
    setRosters,
    setUsers,
    setPlayers,
    setDraftPicks
  } = useSleeper();
  const router = useRouter();
  
  // Find the current roster (assuming it's the first one for now)
  const currentRoster = rosters.length > 0 ? rosters[0] : null;

  console.log('Home - currentLeague:', currentLeague);
  console.log('Home - currentRoster:', currentRoster);
  console.log('Home - players:', players ? Object.keys(players).length : 0, 'players loaded');

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* League Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LeagueInfo />
      </div>

      {/* Team Overview and Trade Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <TeamOverview />
        </div>

        {/* Trade Evaluator */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Trade Evaluator</h2>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Evaluate potential trades with other teams</p>
            <Link href="/trade-evaluator">
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Open Trade Evaluator
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* League Standings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">League Standings</h2>
        <LeagueStandings />
      </div>

      {/* Player Rankings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Player Rankings</h2>
        <PlayerRankings />
      </div>

      {/* Debug Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <DebugSection />
      </div>
    </div>
  );
}
