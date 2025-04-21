/**
 * Custom hook for evaluating trades
 */

import { useState, useMemo } from 'react';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { SleeperPlayer } from '../types/sleeper';
import { PlayerStats } from '../types/player';

interface TradePlayer extends SleeperPlayer {
  projected_pts: number;
  pts_ppr: number;
}

interface TradeSide {
  players: TradePlayer[];
  draftPicks: {
    season: string;
    round: number;
    pick: number;
  }[];
  totalProjectedPoints: number;
  totalPoints: number;
}

interface TradeEvaluation {
  side1: TradeSide;
  side2: TradeSide;
  difference: {
    projectedPoints: number;
    currentPoints: number;
  };
  winner: 1 | 2 | 'even';
}

interface UseTradeEvaluationReturn {
  evaluateTrade: (
    side1Players: string[],
    side2Players: string[],
    side1Picks: { season: string; round: number; pick: number }[],
    side2Picks: { season: string; round: number; pick: number }[]
  ) => TradeEvaluation;
  isLoading: boolean;
  error: string | null;
}

export function useTradeEvaluation(): UseTradeEvaluationReturn {
  const { players, playerStats, isLoading } = usePlayer();
  const [error, setError] = useState<string | null>(null);

  const evaluateTrade = useMemo(
    () =>
      (
        side1Players: string[],
        side2Players: string[],
        side1Picks: { season: string; round: number; pick: number }[],
        side2Picks: { season: string; round: number; pick: number }[]
      ): TradeEvaluation => {
        try {
          // Calculate side 1
          const side1: TradeSide = {
            players: side1Players
              .map(id => {
                const player = players[id];
                const stats = playerStats[id];
                if (!player) return null;
                return {
                  ...player,
                  projected_pts: stats?.projected_pts || 0,
                  pts_ppr: stats?.pts_ppr || 0
                };
              })
              .filter(Boolean) as TradePlayer[],
            draftPicks: side1Picks,
            totalProjectedPoints: 0,
            totalPoints: 0
          };

          // Calculate side 2
          const side2: TradeSide = {
            players: side2Players
              .map(id => {
                const player = players[id];
                const stats = playerStats[id];
                if (!player) return null;
                return {
                  ...player,
                  projected_pts: stats?.projected_pts || 0,
                  pts_ppr: stats?.pts_ppr || 0
                };
              })
              .filter(Boolean) as TradePlayer[],
            draftPicks: side2Picks,
            totalProjectedPoints: 0,
            totalPoints: 0
          };

          // Calculate totals for side 1
          side1.totalProjectedPoints = side1.players.reduce(
            (total, player) => total + player.projected_pts,
            0
          );
          side1.totalPoints = side1.players.reduce(
            (total, player) => total + player.pts_ppr,
            0
          );

          // Calculate totals for side 2
          side2.totalProjectedPoints = side2.players.reduce(
            (total, player) => total + player.projected_pts,
            0
          );
          side2.totalPoints = side2.players.reduce(
            (total, player) => total + player.pts_ppr,
            0
          );

          // Calculate differences
          const projectedDiff = side1.totalProjectedPoints - side2.totalProjectedPoints;
          const currentDiff = side1.totalPoints - side2.totalPoints;

          // Determine winner
          let winner: 1 | 2 | 'even' = 'even';
          if (projectedDiff > 5) winner = 1;
          else if (projectedDiff < -5) winner = 2;

          return {
            side1,
            side2,
            difference: {
              projectedPoints: projectedDiff,
              currentPoints: currentDiff
            },
            winner
          };
        } catch (err) {
          setError('Error evaluating trade');
          return {
            side1: {
              players: [],
              draftPicks: [],
              totalProjectedPoints: 0,
              totalPoints: 0
            },
            side2: {
              players: [],
              draftPicks: [],
              totalProjectedPoints: 0,
              totalPoints: 0
            },
            difference: {
              projectedPoints: 0,
              currentPoints: 0
            },
            winner: 'even'
          };
        }
      },
    [players, playerStats]
  );

  return {
    evaluateTrade,
    isLoading,
    error
  };
} 