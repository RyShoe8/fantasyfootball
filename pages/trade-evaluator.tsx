import { useSleeper } from '../contexts/SleeperContext';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';

interface TradePlayer {
  playerId: string;
  player: any;
  projectedPoints: number;
  totalPoints: number;
}

interface TradeSide {
  players: TradePlayer[];
  totalProjectedPoints: number;
  totalLastYearPoints: number;
}

export default function TradeEvaluator() {
  const { rosters, players } = useSleeper();
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [myPlayers, setMyPlayers] = useState<TradePlayer[]>([]);
  const [theirPlayers, setTheirPlayers] = useState<TradePlayer[]>([]);

  const currentRoster = useMemo(() => {
    if (!rosters || rosters.length === 0) return null;
    return rosters[0]; // For now, just show first roster
  }, [rosters]);

  const myRosterPlayers = useMemo(() => {
    if (!currentRoster || !players) return [];
    
    const allPlayers = [...currentRoster.starters, ...currentRoster.reserves];
    return allPlayers.map(playerId => {
      const player = players[playerId];
      return {
        playerId,
        player,
        projectedPoints: player.stats?.['2024_projected_pts'] || 0,
        totalPoints: player.stats?.['2023_total_pts'] || 0
      };
    });
  }, [currentRoster, players]);

  const selectedTeamRoster = useMemo(() => {
    if (!selectedTeam || !rosters) return null;
    return rosters.find(r => r.roster_id === selectedTeam);
  }, [selectedTeam, rosters]);

  const theirRosterPlayers = useMemo(() => {
    if (!selectedTeamRoster || !players) return [];
    
    const allPlayers = [...selectedTeamRoster.starters, ...selectedTeamRoster.reserves];
    return allPlayers.map(playerId => {
      const player = players[playerId];
      return {
        playerId,
        player,
        projectedPoints: player.stats?.['2024_projected_pts'] || 0,
        totalPoints: player.stats?.['2023_total_pts'] || 0
      };
    });
  }, [selectedTeamRoster, players]);

  const mySide: TradeSide = useMemo(() => ({
    players: myPlayers,
    totalProjectedPoints: myPlayers.reduce((sum, p) => sum + p.projectedPoints, 0),
    totalLastYearPoints: myPlayers.reduce((sum, p) => sum + p.totalPoints, 0)
  }), [myPlayers]);

  const theirSide: TradeSide = useMemo(() => ({
    players: theirPlayers,
    totalProjectedPoints: theirPlayers.reduce((sum, p) => sum + p.projectedPoints, 0),
    totalLastYearPoints: theirPlayers.reduce((sum, p) => sum + p.totalPoints, 0)
  }), [theirPlayers]);

  const handleAddMyPlayer = (player: TradePlayer) => {
    setMyPlayers([...myPlayers, player]);
  };

  const handleAddTheirPlayer = (player: TradePlayer) => {
    setTheirPlayers([...theirPlayers, player]);
  };

  const handleRemoveMyPlayer = (playerId: string) => {
    setMyPlayers(myPlayers.filter(p => p.playerId !== playerId));
  };

  const handleRemoveTheirPlayer = (playerId: string) => {
    setTheirPlayers(theirPlayers.filter(p => p.playerId !== playerId));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trade Evaluator</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* My Side */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">My Side</h2>
          <div className="mb-4">
            <h3 className="font-medium mb-2">Add Players from My Roster</h3>
            <div className="space-y-2">
              {myRosterPlayers.map(player => (
                <button
                  key={player.playerId}
                  onClick={() => handleAddMyPlayer(player)}
                  className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100"
                >
                  {player.player.first_name} {player.player.last_name} ({player.player.position})
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Selected Players</h3>
            <div className="space-y-2">
              {mySide.players.map(player => (
                <div key={player.playerId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{player.player.first_name} {player.player.last_name}</span>
                  <button
                    onClick={() => handleRemoveMyPlayer(player.playerId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p>Total 2023 Points: {mySide.totalLastYearPoints.toFixed(2)}</p>
              <p>Total 2024 Projected: {mySide.totalProjectedPoints.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Their Side */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Their Side</h2>
          <div className="mb-4">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Select a team</option>
              {rosters?.map(roster => (
                <option key={roster.roster_id} value={roster.roster_id}>
                  Team {roster.roster_id}
                </option>
              ))}
            </select>
            {theirRosterPlayers.length > 0 && (
              <div className="space-y-2">
                {theirRosterPlayers.map(player => (
                  <button
                    key={player.playerId}
                    onClick={() => handleAddTheirPlayer(player)}
                    className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    {player.player.first_name} {player.player.last_name} ({player.player.position})
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium mb-2">Selected Players</h3>
            <div className="space-y-2">
              {theirSide.players.map(player => (
                <div key={player.playerId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{player.player.first_name} {player.player.last_name}</span>
                  <button
                    onClick={() => handleRemoveTheirPlayer(player.playerId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p>Total 2023 Points: {theirSide.totalLastYearPoints.toFixed(2)}</p>
              <p>Total 2024 Projected: {theirSide.totalProjectedPoints.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Analysis */}
      {mySide.players.length > 0 && theirSide.players.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Trade Analysis</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-medium mb-2">2023 Season Comparison</h3>
              <p>Difference: {(mySide.totalLastYearPoints - theirSide.totalLastYearPoints).toFixed(2)} points</p>
              <p className="text-sm text-gray-600">
                {mySide.totalLastYearPoints > theirSide.totalLastYearPoints ? 'You gain' : 'You lose'} points
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-medium mb-2">2024 Projection Comparison</h3>
              <p>Difference: {(mySide.totalProjectedPoints - theirSide.totalProjectedPoints).toFixed(2)} points</p>
              <p className="text-sm text-gray-600">
                {mySide.totalProjectedPoints > theirSide.totalProjectedPoints ? 'You gain' : 'You lose'} points
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 