/**
 * Trade Evaluator Page
 * 
 * This page allows users to evaluate potential trades between their team and other teams in the league.
 * It calculates the total points from the previous season and projected points for the upcoming season
 * to help users make informed trading decisions.
 * 
 * Key features:
 * - Select players from your roster to include in a trade
 * - Choose another team from your league
 * - Select players from the other team to include in the trade
 * - View total points comparison between both sides
 * - See projected points comparison for the upcoming season
 */

/** @jsxImportSource react */
import React, { useState, useMemo, useEffect } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import { useRouter } from 'next/router';
import { SleeperRoster, SleeperPlayer } from '../types/sleeper';

interface PlayerStats {
  pts_ppr?: number;
  pts_half_ppr?: number;
  pts_std?: number;
  projected_pts?: number;
  [key: string]: any;
}

interface Player {
  player_id: string;
  full_name: string;
  position: string;
  team: string;
  injury_status?: string;
  stats?: PlayerStats;
  projected_pts?: number;
  pts_ppr?: number;
}

interface Roster {
  roster_id: number;
  owner_id: string;
  starters: string[];
  reserves: string[];
  players: string[];
  metadata: {
    team_name?: string;
  };
}

interface TradePlayer {
  playerId: string;
  player: Player;
  projectedPoints: number;
  totalPoints: number;
}

interface TradeSide {
  players: TradePlayer[];
  totalProjectedPoints: number;
  totalPoints: number;
}

export default function TradeEvaluator() {
  const { user, rosters, players } = useSleeper();
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState('0');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [mySide, setMySide] = useState<TradePlayer[]>([]);
  const [theirSide, setTheirSide] = useState<TradePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we have the necessary data, redirect if not
  useEffect(() => {
    // If we don't have rosters or players data, redirect to home
    if ((!rosters || rosters.length === 0) || !players || Object.keys(players).length === 0) {
      console.log('Trade Evaluator page: Missing data, redirecting to home');
      router.push('/');
      return;
    }
    
    // If we have the data, we're no longer loading
    setIsLoading(false);
  }, [rosters, players, router]);

  const currentRoster = useMemo(() => {
    if (!user || !rosters) return null;
    return rosters.find((r: Roster) => r.owner_id === user.user_id);
  }, [user, rosters]);

  const availablePlayers = useMemo(() => {
    if (!currentRoster || !players) return [];
    const allPlayers = [...currentRoster.starters, ...currentRoster.reserves];
    return allPlayers.map((playerId: string) => {
      const player = players[playerId as keyof typeof players] as Player | undefined;
      return {
        playerId,
        player,
        projectedPoints: player?.stats?.[selectedWeek]?.projected_pts || 0,
        totalPoints: player?.stats?.[selectedWeek]?.pts_ppr || 0
      };
    }).filter((p): p is TradePlayer => p.player !== undefined);
  }, [currentRoster, players, selectedWeek]);

  const selectedTeamRoster = useMemo(() => {
    if (!rosters || !selectedTeam) return null;
    return rosters.find((r: Roster) => r.roster_id.toString() === selectedTeam);
  }, [rosters, selectedTeam]);

  const selectedTeamPlayers = useMemo(() => {
    if (!selectedTeamRoster || !players) return [];
    const allPlayers = [...selectedTeamRoster.starters, ...selectedTeamRoster.reserves];
    return allPlayers.map((playerId: string) => {
      const player = players[playerId as keyof typeof players] as Player | undefined;
      return {
        playerId,
        player,
        projectedPoints: player?.stats?.[selectedWeek]?.projected_pts || 0,
        totalPoints: player?.stats?.[selectedWeek]?.pts_ppr || 0
      };
    }).filter((p): p is TradePlayer => p.player !== undefined);
  }, [selectedTeamRoster, players, selectedWeek]);

  const handleAddToMySide = (player: TradePlayer) => {
    setMySide([...mySide, player]);
  };

  const handleAddToTheirSide = (player: TradePlayer) => {
    setTheirSide([...theirSide, player]);
  };

  const handleRemoveFromMySide = (playerId: string) => {
    setMySide(mySide.filter(p => p.playerId !== playerId));
  };

  const handleRemoveFromTheirSide = (playerId: string) => {
    setTheirSide(theirSide.filter(p => p.playerId !== playerId));
  };

  const mySideStats: TradeSide = {
    players: mySide,
    totalProjectedPoints: mySide.reduce((sum, p) => sum + p.projectedPoints, 0),
    totalPoints: mySide.reduce((sum, p) => sum + p.totalPoints, 0)
  };

  const theirSideStats: TradeSide = {
    players: theirSide,
    totalProjectedPoints: theirSide.reduce((sum, p) => sum + p.projectedPoints, 0),
    totalPoints: theirSide.reduce((sum, p) => sum + p.totalPoints, 0)
  };

  // Show loading state if data is not available
  if (isLoading || !currentRoster) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with back button */}
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
          <div className="space-y-2">
            {mySide.map(player => (
              <div key={player.playerId} className="flex justify-between items-center">
                <span>{player.player.full_name}</span>
                <button
                  onClick={() => handleRemoveFromMySide(player.playerId)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p>Total Projected Points: {mySideStats.totalProjectedPoints.toFixed(2)}</p>
            <p>Total Points: {mySideStats.totalPoints.toFixed(2)}</p>
          </div>
        </div>

        {/* Their Side */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Their Side</h2>
          <div className="space-y-2">
            {theirSide.map(player => (
              <div key={player.playerId} className="flex justify-between items-center">
                <span>{player.player.full_name}</span>
                <button
                  onClick={() => handleRemoveFromTheirSide(player.playerId)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p>Total Projected Points: {theirSideStats.totalProjectedPoints.toFixed(2)}</p>
            <p>Total Points: {theirSideStats.totalPoints.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Player Selection */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available Players</h2>
        <select
          className="w-full p-2 border rounded"
          value={selectedTeam}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTeam(e.target.value)}
        >
          <option value="">Select a team</option>
          {rosters?.map(roster => (
            <option key={roster.roster_id} value={roster.roster_id.toString()}>
              {roster.metadata?.team_name || `Team ${roster.roster_id}`}
            </option>
          ))}
        </select>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {/* My Players */}
          <div>
            <h3 className="font-semibold mb-2">My Players</h3>
            <div className="space-y-2">
              {availablePlayers.map(player => (
                <div key={player.playerId} className="flex justify-between items-center">
                  <span>{player.player.full_name}</span>
                  <button
                    onClick={() => handleAddToMySide(player)}
                    className="text-blue-500"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Their Players */}
          <div>
            <h3 className="font-semibold mb-2">Their Players</h3>
            <div className="space-y-2">
              {selectedTeamPlayers.map(player => (
                <div key={player.playerId} className="flex justify-between items-center">
                  <span>{player.player.full_name}</span>
                  <button
                    onClick={() => handleAddToTheirSide(player)}
                    className="text-blue-500"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 