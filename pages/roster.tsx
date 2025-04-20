import { useSleeper } from '../contexts/SleeperContext';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';

interface PlayerStats {
  player: any;
  projectedPoints: number;
  totalPoints: number;
  position: string;
}

export default function Roster() {
  const { rosters, players } = useSleeper();
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState(1);

  const currentRoster = useMemo(() => {
    if (!rosters || rosters.length === 0) return null;
    return rosters[0]; // For now, just show first roster
  }, [rosters]);

  const playerStats = useMemo(() => {
    if (!currentRoster || !players) return [];

    const stats: PlayerStats[] = [];
    
    // Process starters
    currentRoster.starters.forEach(playerId => {
      const player = players[playerId];
      if (player) {
        stats.push({
          player,
          projectedPoints: player.stats?.['2024_projected_pts'] || 0,
          totalPoints: player.stats?.['2023_total_pts'] || 0,
          position: player.position
        });
      }
    });

    // Process reserves
    currentRoster.reserves.forEach(playerId => {
      const player = players[playerId];
      if (player) {
        stats.push({
          player,
          projectedPoints: player.stats?.['2024_projected_pts'] || 0,
          totalPoints: player.stats?.['2023_total_pts'] || 0,
          position: player.position
        });
      }
    });

    return stats.sort((a, b) => {
      // Sort by position first
      const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'IDP'];
      const posA = positionOrder.indexOf(a.position);
      const posB = positionOrder.indexOf(b.position);
      if (posA !== posB) return posA - posB;
      
      // Then by projected points
      return b.projectedPoints - a.projectedPoints;
    });
  }, [currentRoster, players]);

  if (!currentRoster) {
    return <div className="p-6">Loading roster...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Roster</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {['QB', 'RB', 'WR', 'TE', 'K', 'IDP'].map(position => {
          const positionPlayers = playerStats.filter(p => p.position === position);
          if (positionPlayers.length === 0) return null;

          return (
            <div key={position} className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">{position}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Player</th>
                      <th className="px-4 py-2 text-left">Team</th>
                      <th className="px-4 py-2 text-right">2023 Points</th>
                      <th className="px-4 py-2 text-right">2024 Projected</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionPlayers.map(({ player, totalPoints, projectedPoints }) => (
                      <tr key={player.player_id} className="border-t">
                        <td className="px-4 py-2">
                          {player.first_name} {player.last_name}
                        </td>
                        <td className="px-4 py-2">{player.team}</td>
                        <td className="px-4 py-2 text-right">{totalPoints.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{projectedPoints.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          {player.injury_status ? (
                            <span className="text-red-500">{player.injury_status}</span>
                          ) : (
                            <span className="text-green-500">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 