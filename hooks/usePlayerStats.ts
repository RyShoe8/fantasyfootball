/**
 * Custom hook for managing player statistics
 */

import { useState, useEffect, useMemo } from 'react';
import { usePlayer } from '../contexts/player';
import { SleeperPlayer } from '../types/sleeper';
import { PlayerStats } from '../types/player';
import { POSITION_GROUPS } from '../utils/constants';

interface PositionStats {
  position: string;
  players: Array<SleeperPlayer & { stats: PlayerStats }>;
  averagePoints: number;
  totalPoints: number;
  topPerformer: {
    player: SleeperPlayer;
    points: number;
  } | null;
}

interface UsePlayerStatsReturn {
  positionStats: Record<string, PositionStats>;
  topPerformers: Array<{
    player: SleeperPlayer;
    points: number;
    position: string;
  }>;
  getPlayerProjection: (playerId: string) => number;
  getPlayerPoints: (playerId: string) => number;
  isLoading: boolean;
  error: string | null;
}

export function usePlayerStats(): UsePlayerStatsReturn {
  const { players, playerStats, loading } = usePlayer();
  const [error, setError] = useState<string | null>(null);

  // Calculate stats for each position
  const positionStats = useMemo(() => {
    const stats: Record<string, PositionStats> = {};

    if (!players || !playerStats) return stats;

    // Initialize position stats
    Object.values(POSITION_GROUPS).flat().forEach(position => {
      stats[position] = {
        position,
        players: [],
        averagePoints: 0,
        totalPoints: 0,
        topPerformer: null
      };
    });

    // Process each player
    Object.values(players).forEach((player: SleeperPlayer) => {
      if (!player || !player.position) return;

      const position = player.position;
      const playerStat = playerStats[player.player_id];

      if (!stats[position]) return;

      if (playerStat) {
        const points = playerStat.pts_ppr || 0;
        const playerWithStats = { ...player, stats: playerStat };

        stats[position].players.push(playerWithStats);
        stats[position].totalPoints += points;

        // Update top performer
        if (!stats[position].topPerformer || points > stats[position].topPerformer.points) {
          stats[position].topPerformer = {
            player,
            points
          };
        }
      }
    });

    // Calculate averages
    Object.values(stats).forEach((posStats: PositionStats) => {
      if (posStats.players.length > 0) {
        posStats.averagePoints = posStats.totalPoints / posStats.players.length;
      }
      // Sort players by points
      posStats.players.sort((a, b) => (b.stats?.pts_ppr || 0) - (a.stats?.pts_ppr || 0));
    });

    return stats;
  }, [players, playerStats]);

  // Get top performers across all positions
  const topPerformers = useMemo(() => {
    return Object.values(positionStats)
      .filter((stats: PositionStats) => stats.topPerformer !== null)
      .map((stats: PositionStats) => ({
        player: stats.topPerformer!.player,
        points: stats.topPerformer!.points,
        position: stats.position
      }))
      .sort((a, b) => b.points - a.points);
  }, [positionStats]);

  // Helper function to get player projection
  const getPlayerProjection = (playerId: string): number => {
    const stats = playerStats[playerId];
    return stats?.projected_pts || 0;
  };

  // Helper function to get player points
  const getPlayerPoints = (playerId: string): number => {
    const stats = playerStats[playerId];
    return stats?.pts_ppr || 0;
  };

  return {
    positionStats,
    topPerformers,
    getPlayerProjection,
    getPlayerPoints,
    isLoading: loading,
    error
  };
} 