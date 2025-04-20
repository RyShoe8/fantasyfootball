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
import React, { useState, useMemo, useEffect, ChangeEvent } from 'react';
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
  const [selectedTeamRoster, setSelectedTeamRoster] = useState<SleeperRoster | null>(null);

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
    return rosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
  }, [user, rosters]);

  const availablePlayers = useMemo(() => {
    if (!currentRoster || !players) return [];
    return [...(currentRoster.starters || []), ...(currentRoster.reserves || [])]
      .map(playerId => {
        const player = players[playerId as keyof typeof players];
        if (!player) return null;

        // Get stats for the selected week
        const rawStats = (player.stats?.[selectedWeek] || {}) as Partial<PlayerStats>;
        const weekStats: PlayerStats = {
          ...rawStats,
          fpts: typeof rawStats.fpts === 'number' ? rawStats.fpts : 0,
          fpts_decimal: typeof rawStats.fpts_decimal === 'number' ? rawStats.fpts_decimal : 0,
          projected_pts: typeof rawStats.projected_pts === 'number' ? rawStats.projected_pts : 0
        };
        
        // Calculate fantasy points based on Sleeper API format
        const fpts = weekStats.fpts || 0;
        const fptsDecimal = weekStats.fpts_decimal || 0;
        const totalFpts = fpts + (fptsDecimal / 100);
        
        return {
          ...player,
          stats: weekStats,
          projected_pts: weekStats.projected_pts || 0,
          pts_ppr: totalFpts,
          full_name: `${player.first_name} ${player.last_name}`,
          position: player.position || '',
          team: player.team || '',
          player_id: player.player_id || ''
        } as TradePlayer;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [currentRoster, players, selectedWeek]);

  const selectedTeamPlayers = useMemo(() => {
    if (!selectedTeamRoster || !players) return [];
    
    // Get all players from the selected team's roster
    return [...(selectedTeamRoster.starters || []), ...(selectedTeamRoster.reserves || [])]
      .map((playerId: string) => {
        const player = players[playerId as keyof typeof players] as Player | undefined;
        if (!player) return null;

        // Get stats for the selected week
        const weekStats = player.stats?.[selectedWeek] || {};
        
        return {
          playerId,
          player,
          projectedPoints: weekStats.projected_pts || 0,
          totalPoints: weekStats.pts_ppr || 0
        };
      })
      .filter((p: TradePlayer | null): p is TradePlayer => p !== null);
  }, [selectedTeamRoster, players, selectedWeek]);

  const handleAddPlayer = (player: TradePlayer, side: 'my' | 'their') => {
    if (side === 'my') {
      setMySide([...mySide, player]);
    } else {
      setTheirSide([...theirSide, player]);
    }
  };

  const handleRemovePlayer = (player: TradePlayer, side: 'my' | 'their') => {
    if (side === 'my') {
      setMySide(mySide.filter((p: TradePlayer) => p.playerId !== player.playerId));
    } else {
      setTheirSide(theirSide.filter((p: TradePlayer) => p.playerId !== player.playerId));
    }
  };

  const handleWeekChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedWeek(e.target.value);
  };

  const handleTeamChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const roster = rosters.find((r: SleeperRoster) => r.roster_id === e.target.value);
    setSelectedTeamRoster(roster || null);
  };

  const mySideStats: TradeSide = {
    players: mySide,
    totalProjectedPoints: mySide.reduce((sum: number, p: TradePlayer) => sum + p.projectedPoints, 0),
    totalPoints: mySide.reduce((sum: number, p: TradePlayer) => sum + p.totalPoints, 0)
  };

  const theirSideStats: TradeSide = {
    players: theirSide,
    totalProjectedPoints: theirSide.reduce((sum: number, p: TradePlayer) => sum + p.projectedPoints, 0),
    totalPoints: theirSide.reduce((sum: number, p: TradePlayer) => sum + p.totalPoints, 0)
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
            {mySide.map((player: TradePlayer) => (
              <div key={player.playerId} className="flex justify-between items-center">
                <span>{player.player.full_name}</span>
                <button
                  onClick={() => handleRemovePlayer(player, 'my')}
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
            {theirSide.map((player: TradePlayer) => (
              <div key={player.playerId} className="flex justify-between items-center">
                <span>{player.player.full_name}</span>
                <button
                  onClick={() => handleRemovePlayer(player, 'their')}
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
      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* My Players */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">My Players</h2>
          <div className="space-y-2">
            {availablePlayers.map((player: TradePlayer) => (
              <div key={player.playerId} className="flex justify-between items-center">
                <span>{player.player.full_name}</span>
                <button
                  onClick={() => handleAddPlayer(player, 'my')}
                  className="text-blue-500"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Their Players */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Their Players</h2>
          <select
            className="w-full mb-4 p-2 border rounded"
            value={selectedTeam}
            onChange={handleTeamChange}
          >
            <option value="">Select a team</option>
            {rosters
              .filter((r: SleeperRoster) => r.owner_id !== user?.user_id)
              .map((team: SleeperRoster) => (
                <option key={team.roster_id} value={team.roster_id}>
                  {team.metadata?.team_name || `Team ${team.roster_id}`}
                </option>
              ))}
          </select>
          <div className="space-y-2">
            {selectedTeamPlayers.map((player: TradePlayer) => (
              <div key={player.playerId} className="flex justify-between items-center">
                <span>{player.player.full_name}</span>
                <button
                  onClick={() => handleAddPlayer(player, 'their')}
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
  );
} 