import React from 'react';
import type { SleeperRoster, SleeperUser, SleeperPlayer } from '../types/sleeper';
import type { PlayerStats } from '../types/player';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';

interface TeamOverviewProps {
  rosterId?: string;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({ rosterId }: TeamOverviewProps) => {
  const { currentLeague, selectedYear } = useLeague();
  const { rosters } = useRoster();
  const { players, playerStats, fetchPlayers, fetchPlayerStats } = usePlayer();
  const { users } = useLeague();
  const [selectedRosterId, setSelectedRosterId] = React.useState<string>(rosterId || '');

  // Fetch players when component mounts or year changes
  React.useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers, selectedYear]);

  // Fetch player stats when roster changes or week/year changes
  React.useEffect(() => {
    if (currentLeague?.season) {
      fetchPlayerStats(currentLeague.season, currentLeague.settings.leg ? 1 : 0);
    }
  }, [currentLeague?.season, currentLeague?.settings.leg, fetchPlayerStats, selectedYear]);

  const roster = React.useMemo(() => {
    if (!rosters || !selectedRosterId) return null;
    return rosters.find((r: SleeperRoster) => r.roster_id === selectedRosterId);
  }, [rosters, selectedRosterId]);

  const owner = React.useMemo(() => {
    if (!users || !roster) return null;
    return users.find((u: SleeperUser) => u.user_id === roster.owner_id);
  }, [users, roster]);

  const teamName = React.useMemo(() => {
    if (!roster || !owner) return 'Unknown Team';
    return roster.metadata?.team_name || owner.display_name || owner.username || `Team ${roster.roster_id}`;
  }, [roster, owner]);

  const rosterPlayers = React.useMemo(() => {
    if (!roster || !players) return [];
    return roster.players.map((playerId: string) => players[playerId]).filter(Boolean);
  }, [roster, players]);

  const rosterStats = React.useMemo(() => {
    if (!roster || !playerStats) return {};
    const stats: Record<string, PlayerStats> = {};
    roster.players.forEach((playerId: string) => {
      if (playerStats[playerId]) {
        stats[playerId] = playerStats[playerId];
      }
    });
    return stats;
  }, [roster, playerStats]);

  const handleRosterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRosterId(e.target.value);
  };

  React.useEffect(() => {
    if (rosterId) {
      setSelectedRosterId(rosterId);
    }
  }, [rosterId]);

  if (!currentLeague || !rosters || !users) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team Overview</h2>
          {owner && (
            <p className="text-gray-600">Owner: {owner.display_name}</p>
          )}
          <p className="text-gray-600">Team: {teamName}</p>
        </div>
        <select
          value={selectedRosterId}
          onChange={handleRosterChange}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a team</option>
          {rosters.map((r: SleeperRoster) => {
            const teamOwner = users.find((u: SleeperUser) => u.user_id === r.owner_id);
            return (
              <option key={r.roster_id} value={r.roster_id}>
                {teamOwner?.display_name || `Team ${r.roster_id}`}
              </option>
            );
          })}
        </select>
      </div>

      {roster && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Record</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {roster.settings.wins}-{roster.settings.losses}{roster.settings.ties ? `-${roster.settings.ties}` : ''}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Points For</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {(roster.settings.fpts + (roster.settings.fpts_decimal || 0) / 100).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Points Against</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {(roster.settings.fpts_against + (roster.settings.fpts_against_decimal || 0) / 100).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {rosterPlayers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Roster</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rosterPlayers.map((player: SleeperPlayer) => (
              <div key={player.player_id} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900">{player.full_name}</h4>
                <p className="text-sm text-gray-500">{player.position}</p>
                {rosterStats[player.player_id] && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Points: {rosterStats[player.player_id].points.toFixed(2)}</p>
                    <p>Projected: {rosterStats[player.player_id].projected_points?.toFixed(2) || 'N/A'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
      </div>
      )}
    </div>
  );
};

export default TeamOverview;