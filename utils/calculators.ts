/**
 * Utility functions for calculations
 */

import { SleeperRoster, SleeperPlayer } from '../types/sleeper';
import { PlayerStats } from '../types/player';

// Calculate total points for a roster
export const calculateRosterPoints = (roster: SleeperRoster, playerStats: Record<string, PlayerStats>): number => {
  return roster.starters.reduce((total, playerId) => {
    const stats = playerStats[playerId];
    return total + (stats?.pts_ppr || 0);
  }, 0);
};

// Calculate projected points for a roster
export const calculateProjectedPoints = (roster: SleeperRoster, players: Record<string, SleeperPlayer>): number => {
  return roster.starters.reduce((total, playerId) => {
    const player = players[playerId];
    return total + (player?.projected_pts || 0);
  }, 0);
};

// Calculate win percentage
export const calculateWinPercentage = (wins: number, losses: number, ties: number): number => {
  const totalGames = wins + losses + ties;
  if (totalGames === 0) return 0;
  return (wins + ties * 0.5) / totalGames;
};

// Calculate points per game
export const calculatePointsPerGame = (totalPoints: number, gamesPlayed: number): number => {
  if (gamesPlayed === 0) return 0;
  return totalPoints / gamesPlayed;
};

// Calculate current week of the season
export const getCurrentWeek = (): number => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 8, 1); // September 1st
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.ceil(diffDays / 7), 18); // Max 18 weeks
};

// Calculate streak type and length
export const calculateStreak = (results: ('W' | 'L' | 'T')[]): { type: 'W' | 'L' | 'T', length: number } => {
  if (!results.length) return { type: 'T', length: 0 };
  
  const currentType = results[results.length - 1];
  let length = 0;
  
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === currentType) {
      length++;
    } else {
      break;
    }
  }
  
  return { type: currentType, length };
};

// Calculate position rankings
export const calculatePositionRankings = (
  players: Record<string, SleeperPlayer>,
  stats: Record<string, PlayerStats>
): Record<string, SleeperPlayer[]> => {
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  const rankings: Record<string, SleeperPlayer[]> = {};
  
  positions.forEach(pos => {
    rankings[pos] = Object.values(players)
      .filter(p => p.position === pos)
      .sort((a, b) => {
        const aStats = stats[a.player_id];
        const bStats = stats[b.player_id];
        return (bStats?.pts_ppr || 0) - (aStats?.pts_ppr || 0);
      });
  });
  
  return rankings;
}; 