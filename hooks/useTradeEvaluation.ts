/**
 * Custom hook for evaluating trades
 */

import React from 'react';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { SleeperPlayer } from '../types/sleeper';
import { PlayerStats } from '../types/player';

interface TradePlayer extends SleeperPlayer {
  projected_pts: number;
  pts_ppr: number;
}

interface TradeEvaluation {
  team1Value: number;
  team2Value: number;
  difference: number;
  winner: 'team1' | 'team2' | 'even';
  details: {
    team1: {
      players: TradePlayer[];
      totalProjectedPoints: number;
      totalActualPoints: number;
    };
    team2: {
      players: TradePlayer[];
      totalProjectedPoints: number;
      totalActualPoints: number;
    };
  };
}

interface UseTradeEvaluationReturn {
  evaluateTrade: (team1Players: string[], team2Players: string[]) => TradeEvaluation | null;
  error: string | null;
  loading: boolean;
}

export function useTradeEvaluation(): UseTradeEvaluationReturn {
  const { players, playerStats, loading } = usePlayer();
  const [error, setError] = React.useState<string | null>(null);

  const evaluateTrade = React.useMemo(
    () => (team1Players: string[], team2Players: string[]): TradeEvaluation | null => {
      try {
        // Validate inputs
        if (!team1Players.length || !team2Players.length) {
          setError('Both teams must provide at least one player');
          return null;
        }

        // Get player details for team 1
        const team1Details = team1Players.map((playerId) => {
          const player = players[playerId];
          if (!player) {
            throw new Error(`Player ${playerId} not found`);
          }
          return {
            ...player,
            projected_pts: playerStats[playerId]?.projected_pts || 0,
            pts_ppr: playerStats[playerId]?.pts_ppr || 0,
          };
        });

        // Get player details for team 2
        const team2Details = team2Players.map((playerId) => {
          const player = players[playerId];
          if (!player) {
            throw new Error(`Player ${playerId} not found`);
          }
          return {
            ...player,
            projected_pts: playerStats[playerId]?.projected_pts || 0,
            pts_ppr: playerStats[playerId]?.pts_ppr || 0,
          };
        });

        // Calculate values
        const team1ProjectedPoints = team1Details.reduce((sum, player) => sum + player.projected_pts, 0);
        const team2ProjectedPoints = team2Details.reduce((sum, player) => sum + player.projected_pts, 0);
        const team1ActualPoints = team1Details.reduce((sum, player) => sum + player.pts_ppr, 0);
        const team2ActualPoints = team2Details.reduce((sum, player) => sum + player.pts_ppr, 0);

        // Calculate total value (weighted average of projected and actual points)
        const team1Value = team1ProjectedPoints * 0.6 + team1ActualPoints * 0.4;
        const team2Value = team2ProjectedPoints * 0.6 + team2ActualPoints * 0.4;
        const difference = Math.abs(team1Value - team2Value);

        // Determine winner
        let winner: 'team1' | 'team2' | 'even' = 'even';
        if (difference > 1) { // Use a small threshold to determine if values are significantly different
          winner = team1Value > team2Value ? 'team1' : 'team2';
        }

        return {
          team1Value,
          team2Value,
          difference,
          winner,
          details: {
            team1: {
              players: team1Details,
              totalProjectedPoints: team1ProjectedPoints,
              totalActualPoints: team1ActualPoints,
            },
            team2: {
              players: team2Details,
              totalProjectedPoints: team2ProjectedPoints,
              totalActualPoints: team2ActualPoints,
            },
          },
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to evaluate trade');
        return null;
      }
    },
    [players, playerStats]
  );

  return {
    evaluateTrade,
    error,
    loading
  };
} 