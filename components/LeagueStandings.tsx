import React, { useMemo } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { SleeperRoster } from '../types/sleeper';

interface TeamStanding {
  teamId: string;
  ownerId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  totalPoints: number;
  pointsAgainst: number;
}

const LeagueStandings: React.FC = () => {
  const { rosters, currentLeague } = useSleeper();

  const standings = useMemo(() => {
    if (!rosters || !currentLeague) return [];

    // Filter rosters to only include those from the current league
    const leagueRosters = rosters.filter((r: SleeperRoster) => r.league_id === currentLeague.league_id);
    
    // Calculate standings for each team
    const teamStandings: TeamStanding[] = leagueRosters.map(roster => ({
      teamId: roster.roster_id,
      ownerId: roster.owner_id,
      teamName: roster.metadata?.team_name || `Team ${roster.roster_id}`,
      wins: roster.settings.wins,
      losses: roster.settings.losses,
      ties: 0, // This would come from actual league data if available
      totalPoints: roster.settings.fpts + (roster.settings.fpts_decimal || 0),
      pointsAgainst: roster.settings.fpts_against + (roster.settings.fpts_against_decimal || 0)
    }));

    // Sort standings by wins, then by total points
    return teamStandings.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.totalPoints - a.totalPoints;
    });
  }, [rosters, currentLeague]);

  if (!currentLeague) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">League Standings</h2>
        <p className="text-gray-600">{currentLeague.name}</p>
        <p className="text-gray-600">Season: {currentLeague.season}</p>
        <p className="text-gray-600">Status: {currentLeague.status}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                W
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                T
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PA
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.map((team, index) => (
              <tr key={team.teamId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {team.teamName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.wins}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.losses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.ties}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.totalPoints.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.pointsAgainst.toFixed(2)}
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