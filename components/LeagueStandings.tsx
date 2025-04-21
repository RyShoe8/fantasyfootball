import React from 'react';
import type { SleeperRoster, SleeperUser } from '../types/sleeper';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';

interface TeamStanding {
  teamId: string;
  ownerId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  totalPoints: number;
  pointsAgainst: number;
  streak: string;
}

// Helper function to format status
const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'pre_draft': 'Pre-Draft',
    'drafting': 'Drafting',
    'in_season': 'In Season',
    'complete': 'Complete',
    'off_season': 'Off Season'
  };
  
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const LeagueStandings: React.FC = () => {
  const { currentLeague } = useLeague();
  const { rosters } = useRoster();
  const { users } = useLeague();

  const standings = React.useMemo(() => {
    if (!currentLeague || !rosters || !users) return [];

    return rosters.map((roster: SleeperRoster) => {
      const owner = users.find((user: SleeperUser) => user.user_id === roster.owner_id);
      return {
        teamId: roster.roster_id,
        ownerId: roster.owner_id,
        teamName: owner?.display_name || 'Unknown Owner',
        wins: roster.settings.wins,
        losses: roster.settings.losses,
        ties: roster.settings.ties || 0,
        totalPoints: roster.settings.fpts + (roster.settings.fpts_decimal || 0) / 100,
        pointsAgainst: roster.settings.fpts_against + (roster.settings.fpts_against_decimal || 0) / 100,
        streak: calculateStreak(roster.settings.wins, roster.settings.losses)
      };
    }).sort((a: TeamStanding, b: TeamStanding) => {
      // First sort by wins
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Then by total points
      return b.totalPoints - a.totalPoints;
    });
  }, [currentLeague, rosters, users]);

  const calculateStreak = (wins: number, losses: number): string => {
    if (wins > losses) return `W${wins - losses}`;
    if (losses > wins) return `L${losses - wins}`;
    return 'T';
  };

  if (!currentLeague || !standings.length) return null;

  console.log('Rendering standings with:', {
    leagueName: currentLeague.name,
    leagueStatus: currentLeague.status,
    formattedStatus: formatStatus(currentLeague.status),
    standingsCount: standings.length
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">League Standings</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">T</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STREAK</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.map((team: TeamStanding, index: number) => (
              <tr key={team.teamId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.teamName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.wins}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.losses}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.ties}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {((team.wins + (team.ties * 0.5)) / (team.wins + team.losses + team.ties)).toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.totalPoints.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.pointsAgainst.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeagueStandings; 