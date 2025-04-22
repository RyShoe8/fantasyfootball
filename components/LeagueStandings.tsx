import React from 'react';
import type { SleeperRoster, SleeperUser } from '../types/sleeper';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league/LeagueContext';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';
import { formatTeamName, formatOwnerName } from '../utils/formatters';

interface TeamStanding {
  teamId: string;
  teamName: string;
  ownerName: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  avatar?: string;
  streak?: string;
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
  const { currentLeague, rosters, users } = useLeague();

  const standings = React.useMemo(() => {
    if (!currentLeague || !rosters || !users) return [];

    console.log('LeagueStandings - Users:', users);
    console.log('LeagueStandings - Rosters:', rosters);

    return rosters
      .map((roster: SleeperRoster) => {
        const owner = users.find((user: SleeperUser) => user.user_id === roster.owner_id);
        console.log('LeagueStandings - Owner for roster:', roster.roster_id, owner);
        console.log('LeagueStandings - Owner metadata:', owner?.metadata);
        console.log('LeagueStandings - Roster metadata:', roster.metadata);
        
        const teamName = owner?.metadata?.team_name || formatTeamName(roster.metadata?.team_name, owner?.display_name);
        const ownerName = formatOwnerName(owner?.display_name || 'Unknown Owner');
        
        console.log('LeagueStandings - Final team name:', teamName);
        console.log('LeagueStandings - Final owner name:', ownerName);
        console.log('LeagueStandings - Avatar:', owner?.avatar);
        
        return {
          teamId: roster.roster_id,
          teamName,
          ownerName,
          wins: roster.settings.wins,
          losses: roster.settings.losses,
          pointsFor: roster.settings.fpts,
          pointsAgainst: roster.settings.fpts_against,
          rank: 0,
          avatar: owner?.avatar,
          streak: calculateStreak(roster)
        };
      })
      .sort((a: TeamStanding, b: TeamStanding) => {
        // First sort by wins
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        // Then by points for
        return b.pointsFor - a.pointsFor;
      })
      .map((team: TeamStanding, index: number) => ({ ...team, rank: index + 1 })); // Add ranks after sorting
  }, [currentLeague, rosters, users]);

  const calculateStreak = (roster: SleeperRoster): string => {
    const wins = roster.settings.wins;
    const losses = roster.settings.losses;
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.map((team: TeamStanding) => (
              <tr key={team.teamId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {team.rank}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {team.avatar && (
                      <div className="flex-shrink-0 h-8 w-8 mr-3">
                        <img
                          src={`https://sleepercdn.com/avatars/${team.avatar}`}
                          alt={`${team.teamName} avatar`}
                          className="h-8 w-8 rounded-full"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                      <div className="text-sm text-gray-500">{team.ownerName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.wins}-{team.losses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.pointsFor.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.pointsAgainst.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.streak || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeagueStandings; 