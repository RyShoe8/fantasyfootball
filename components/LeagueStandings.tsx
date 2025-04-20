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
  const { rosters, currentLeague } = useSleeper();

  const standings = useMemo(() => {
    if (!rosters || !currentLeague) {
      console.log('Missing required data:', { rosters, currentLeague });
      return [];
    }

    // Filter rosters to only include those from the current league
    const leagueRosters = rosters.filter((r: SleeperRoster) => r.league_id === currentLeague.league_id);
    console.log('League rosters:', leagueRosters);
    
    if (leagueRosters.length === 0) {
      console.log('No rosters found for league:', currentLeague.league_id);
      return [];
    }

    // Calculate standings for each team
    const teamStandings: TeamStanding[] = leagueRosters.map((roster: SleeperRoster) => {
      console.log('Processing roster:', {
        rosterId: roster.roster_id,
        ownerId: roster.owner_id,
        metadata: roster.metadata,
        settings: roster.settings
      });
      
      // Calculate streak (this would come from actual league data in a real app)
      const streak = roster.settings.wins > roster.settings.losses 
        ? `W${roster.settings.wins}`
        : roster.settings.losses > roster.settings.wins
          ? `L${roster.settings.losses}`
          : '';

      const teamName = roster.metadata?.team_name || `Team ${roster.roster_id}`;
      console.log('Team name resolved:', { 
        rosterId: roster.roster_id, 
        teamName,
        metadata: roster.metadata,
        hasMetadata: !!roster.metadata,
        hasTeamName: !!roster.metadata?.team_name
      });

      const totalPoints = (roster.settings.fpts || 0) + (roster.settings.fpts_decimal || 0);
      const pointsAgainst = (roster.settings.fpts_against || 0) + (roster.settings.fpts_against_decimal || 0);

      console.log('Team stats calculated:', {
        rosterId: roster.roster_id,
        wins: roster.settings.wins || 0,
        losses: roster.settings.losses || 0,
        totalPoints,
        pointsAgainst,
        streak
      });

      return {
        teamId: roster.roster_id,
        ownerId: roster.owner_id,
        teamName,
        wins: roster.settings.wins || 0,
        losses: roster.settings.losses || 0,
        ties: 0, // This would come from actual league data if available
        totalPoints,
        pointsAgainst,
        streak
      };
    });

    console.log('Calculated standings:', teamStandings);

    // Sort standings by wins, then by total points
    const sortedStandings = teamStandings.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.totalPoints - a.totalPoints;
    });

    console.log('Sorted standings:', sortedStandings);
    return sortedStandings;
  }, [rosters, currentLeague]);

  if (!currentLeague) {
    return <div>Loading...</div>;
  }

  console.log('Rendering standings with:', {
    leagueName: currentLeague.name,
    leagueStatus: currentLeague.status,
    formattedStatus: formatStatus(currentLeague.status),
    standingsCount: standings.length
  });

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">League Standings</h2>
        <p className="text-gray-600">{currentLeague.name}</p>
        <p className="text-gray-600">Season: {currentLeague.season}</p>
        <p className="text-gray-600">Status: {formatStatus(currentLeague.status)}</p>
      </div>

      {standings.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No standings available yet
        </div>
      ) : (
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
                  Record
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Streak
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
              {standings.map((team: TeamStanding, index: number) => (
                <tr key={team.teamId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {team.teamName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {team.wins}-{team.losses}{team.ties > 0 ? `-${team.ties}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {team.streak}
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
      )}
    </div>
  );
};

export default LeagueStandings; 