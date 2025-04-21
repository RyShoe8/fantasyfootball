/**
 * Custom hook for managing roster data
 */

import React from 'react';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';
import { SleeperRoster, SleeperPlayer } from '../types/sleeper';
import { PlayerStats } from '../types/player';
import { calculateRosterPoints, calculateProjectedPoints } from '../utils/calculators';
import { POSITION_GROUPS } from '../utils/constants';

interface RosterStats {
  totalPoints: number;
  projectedPoints: number;
  positionBreakdown: Record<string, {
    count: number;
    points: number;
    projected: number;
  }>;
}

interface UseRosterDataReturn {
  roster: SleeperRoster | null;
  rosterPlayers: SleeperPlayer[];
  rosterStats: RosterStats;
  starters: SleeperPlayer[];
  bench: SleeperPlayer[];
  ir: SleeperPlayer[];
  taxi: SleeperPlayer[];
  isLoading: boolean;
  error: string | null;
}

export function useRosterData(rosterId?: string): UseRosterDataReturn {
  const { user } = useAuth();
  const { currentLeague } = useLeague();
  const { rosters } = useRoster();
  const { players, playerStats, loading: playersLoading } = usePlayer();
  const [error, setError] = React.useState<string | null>(null);

  // Find the roster we're interested in
  const roster = React.useMemo(() => {
    if (!rosters || !rosterId) return null;
    return rosters.find((r: SleeperRoster) => r.roster_id === rosterId) || null;
  }, [rosters, rosterId]);

  // Get all players in the roster
  const rosterPlayers = React.useMemo(() => {
    if (!roster || !players) return [];
    return roster.players.map((id: string) => players[id]).filter(Boolean);
  }, [roster, players]);

  // Calculate roster statistics
  const rosterStats = React.useMemo(() => {
    if (!roster || !players || !playerStats) {
      return {
        totalPoints: 0,
        projectedPoints: 0,
        positionBreakdown: {}
      };
    }

    const stats: RosterStats = {
      totalPoints: calculateRosterPoints(roster, playerStats),
      projectedPoints: calculateProjectedPoints(roster, players),
      positionBreakdown: {}
    };

    // Calculate position breakdown
    rosterPlayers.forEach((player: SleeperPlayer) => {
      const position = player.position;
      if (!stats.positionBreakdown[position]) {
        stats.positionBreakdown[position] = {
          count: 0,
          points: 0,
          projected: 0
        };
      }

      const playerStatsForPlayer = playerStats[player.player_id];
      stats.positionBreakdown[position].count++;
      stats.positionBreakdown[position].points += playerStatsForPlayer?.pts_ppr || 0;
      stats.positionBreakdown[position].projected += (player as any).projected_pts || 0;
    });

    return stats;
  }, [roster, players, playerStats, rosterPlayers]);

  // Separate players by roster slot
  const starters = React.useMemo(() => {
    if (!roster || !players) return [];
    return roster.starters.map((id: string) => players[id]).filter(Boolean);
  }, [roster, players]);

  const bench = React.useMemo(() => {
    if (!roster || !players) return [];
    const starterIds = new Set(roster.starters);
    const reserveIds = new Set(roster.reserves || []);
    const taxiIds = new Set(roster.taxi || []);
    return roster.players
      .filter((id: string) => !starterIds.has(id) && !reserveIds.has(id) && !taxiIds.has(id))
      .map((id: string) => players[id])
      .filter(Boolean);
  }, [roster, players]);

  const ir = React.useMemo(() => {
    if (!roster || !players || !roster.reserves) return [];
    return roster.reserves.map((id: string) => players[id]).filter(Boolean);
  }, [roster, players]);

  const taxi = React.useMemo(() => {
    if (!roster || !players || !roster.taxi) return [];
    return roster.taxi.map((id: string) => players[id]).filter(Boolean);
  }, [roster, players]);

  // Set error if roster not found
  React.useEffect(() => {
    if (rosterId && rosters && !roster) {
      setError('Roster not found');
    } else {
      setError(null);
    }
  }, [rosterId, rosters, roster]);

  return {
    roster,
    rosterPlayers,
    rosterStats,
    starters,
    bench,
    ir,
    taxi,
    isLoading: playersLoading,
    error
  };
} 