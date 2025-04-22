import React from 'react';
import { SleeperLeague } from '../../types/sleeper';
import { DashboardData, TeamStanding, PlayerStats } from '../../types/dashboard';
import { useLeague } from '../../contexts/league';
import { useRoster } from '../../contexts/roster';
import { usePlayer } from '../../contexts/player/PlayerContext';
import { useDashboardData } from '../../hooks/useDashboardData';

interface DashboardLayoutProps {
  league: SleeperLeague;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ league }: DashboardLayoutProps) => {
  const { positions } = usePlayer();
  
  if (!league.league_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invalid League</h2>
          <p className="text-gray-600">No league ID found. Please select a valid league.</p>
        </div>
      </div>
    );
  }

  const { data: dashboardData, isLoading, error } = useDashboardData(league.league_id);
  
  // Helper functions to format data
  const formatStreak = (streak: string | undefined) => {
    return streak || '-';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getPositionName = (pos: string) => {
    return positions[pos] || pos;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load dashboard data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* League Info Area */}
      <section className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-lg">
            {/* League Image will go here */}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{league.name}</h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <span>Season {league.season}</span>
              <span>•</span>
              <span>{dashboardData.seasonNumber || ''}th Season</span>
              <span>•</span>
              <span className="capitalize">{league.status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roster Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Roster Settings</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">Total Starters:</span>
                <span className="ml-2 text-sm text-gray-900">{dashboardData.rosterBreakdown?.totalStarters || 0}</span>
              </div>
              <div className="space-y-2">
                {/* Position slots will be mapped here */}
                {dashboardData.rosterBreakdown?.positions && Object.entries(dashboardData.rosterBreakdown.positions).map(([pos, count]) => (
                  <div key={pos} className="flex justify-between">
                    <span className="text-sm text-gray-600">{getPositionName(pos)}</span>
                    <span className="text-sm text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bench Spots</span>
                  <span className="text-sm text-gray-900">{dashboardData.rosterBreakdown?.benchSpots || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Taxi Spots</span>
                  <span className="text-sm text-gray-900">{dashboardData.rosterBreakdown?.taxiSpots || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">IR Spots</span>
                  <span className="text-sm text-gray-900">{dashboardData.rosterBreakdown?.irSpots || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trade and Playoff Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Trade & Playoff Info</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Trade Deadline</h3>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Week</span>
                  <span className="text-sm text-gray-900">{dashboardData.tradeDeadline?.week || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm text-gray-900">{dashboardData.tradeDeadline?.date ? formatDate(dashboardData.tradeDeadline.date) : 'N/A'}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Playoff Info</h3>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Teams</span>
                  <span className="text-sm text-gray-900">{dashboardData.playoffInfo?.teams || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Start Date</span>
                  <span className="text-sm text-gray-900">{dashboardData.playoffInfo?.startDate ? formatDate(dashboardData.playoffInfo.startDate) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Format</span>
                  <span className="text-sm text-gray-900">{dashboardData.playoffInfo?.format || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Standings Section */}
      <section className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Standings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.standings?.map((team: TeamStanding) => (
                <tr key={team.teamId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {team.teamImage ? (
                          <img className="h-10 w-10 rounded-full" src={team.teamImage} alt={team.teamName} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{team.wins}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{team.losses}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{team.pointsFor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{team.pointsAgainst}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatStreak(team.streak)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Team Overview Section */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Team Overview</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Starters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.starters?.map((player: PlayerStats) => (
                <div key={player.playerId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full">
                      {player.playerImage && (
                        <img 
                          src={player.playerImage} 
                          alt={player.playerName || player.name} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{player.playerName || player.name}</div>
                      <div className="text-xs text-gray-500">{player.position}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500">Points</div>
                      <div className="text-sm font-medium text-gray-900">{player.points}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Projected</div>
                      <div className="text-sm font-medium text-gray-900">{player.projectedPoints || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardLayout; 