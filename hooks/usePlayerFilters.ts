/**
 * Custom hook for managing player filtering and sorting
 */

import React, { useState, useMemo } from 'react';
import { SleeperPlayer } from '../types/sleeper';
import { PlayerStats } from '../types/player';
import { POSITION_GROUPS, SORT_OPTIONS, FILTER_OPTIONS, DEFAULT_FILTERS, DEBUG } from '../utils/constants';

// Types
type PositionGroup = keyof typeof POSITION_GROUPS;
type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];
type FilterOption = typeof FILTER_OPTIONS[keyof typeof FILTER_OPTIONS];

// Type guard to check if a string is a valid position
function isValidPosition(position: string): position is PositionGroup {
  return position in POSITION_GROUPS;
}

interface Player {
  id: string;
  name: string;
  position: PositionGroup;
  team: string;
  points: number;
  projectedPoints: number;
}

interface FilterState {
  positions: Set<PositionGroup>;
  searchTerm: string;
  sortBy: SortOption;
  sortAscending: boolean;
  minPoints: number;
  maxPoints: number;
  filterOption: FilterOption;
}

interface UsePlayerFiltersReturn {
  filters: FilterState;
  setPositionFilter: (position: PositionGroup, enabled: boolean) => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (option: SortOption) => void;
  toggleSortDirection: () => void;
  setPointsRange: (min: number, max: number) => void;
  setFilterOption: (option: FilterOption) => void;
  filterPlayers: (players: Player[]) => Player[];
}

export function usePlayerFilters(
  players: Record<string, SleeperPlayer>,
  playerStats: Record<string, PlayerStats>
): UsePlayerFiltersReturn {
  const [filters, setFilters] = useState<FilterState>({
    positions: new Set(),
    searchTerm: '',
    sortBy: SORT_OPTIONS.NAME,
    sortAscending: true,
    minPoints: DEFAULT_FILTERS.MIN_POINTS,
    maxPoints: DEFAULT_FILTERS.MAX_POINTS,
    filterOption: FILTER_OPTIONS.ALL
  });

  // Filter and sort players based on current filters
  const filteredPlayers = useMemo(() => {
    if (!players) return [];

    let filtered = Object.values(players)
      // Add stats to players
      .map((player: SleeperPlayer) => ({
        ...player,
        stats: playerStats?.[player.player_id]
      }))
      // Filter by position
      .filter((player: SleeperPlayer & { stats?: PlayerStats }) => 
        filters.positions.size === 0 || 
        (player.position && isValidPosition(player.position) && filters.positions.has(player.position))
      )
      // Filter by search term
      .filter((player: SleeperPlayer & { stats?: PlayerStats }) => {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          !filters.searchTerm ||
          player.full_name?.toLowerCase().includes(searchLower) ||
          player.team?.toLowerCase().includes(searchLower)
        );
      })
      // Filter by points range
      .filter((player: SleeperPlayer & { stats?: PlayerStats }) => {
        const points = player.stats?.pts_ppr || 0;
        return points >= filters.minPoints && points <= filters.maxPoints;
      });

    // Sort players
    filtered.sort((a: SleeperPlayer & { stats?: PlayerStats }, b: SleeperPlayer & { stats?: PlayerStats }) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case SORT_OPTIONS.NAME:
          comparison = (a.full_name || '').localeCompare(b.full_name || '');
          break;
        case SORT_OPTIONS.POINTS:
          comparison = (b.stats?.pts_ppr || 0) - (a.stats?.pts_ppr || 0);
          break;
        case SORT_OPTIONS.PROJECTED:
          comparison = (b.stats?.projected_pts || 0) - (a.stats?.projected_pts || 0);
          break;
        case SORT_OPTIONS.POSITION:
          comparison = (a.position || '').localeCompare(b.position || '');
          break;
        case SORT_OPTIONS.TEAM:
          comparison = (a.team || '').localeCompare(b.team || '');
          break;
      }
      return filters.sortAscending ? comparison : -comparison;
    });

    return filtered;
  }, [players, playerStats, filters]);

  // Filter update functions
  const setPositionFilter = (position: PositionGroup, enabled: boolean) => {
    if (DEBUG.FILTERS) console.log(`Setting position filter: ${position} -> ${enabled}`);
    setFilters((prev: FilterState) => {
      const newPositions = new Set(prev.positions);
      if (enabled) {
        newPositions.add(position);
      } else {
        newPositions.delete(position);
      }
      return { ...prev, positions: newPositions };
    });
  };

  const setSearchTerm = (term: string) => {
    if (DEBUG.FILTERS) console.log(`Setting search term: ${term}`);
    setFilters((prev: FilterState) => ({ ...prev, searchTerm: term }));
  };

  const setSortBy = (option: SortOption) => {
    if (DEBUG.FILTERS) console.log(`Setting sort by: ${option}`);
    setFilters((prev: FilterState) => ({ ...prev, sortBy: option }));
  };

  const toggleSortDirection = () => {
    if (DEBUG.FILTERS) console.log('Toggling sort direction');
    setFilters((prev: FilterState) => ({ ...prev, sortAscending: !prev.sortAscending }));
  };

  const setPointsRange = (min: number, max: number) => {
    if (DEBUG.FILTERS) console.log(`Setting points range: ${min} - ${max}`);
    setFilters((prev: FilterState) => ({ ...prev, minPoints: min, maxPoints: max }));
  };

  const setFilterOption = (option: FilterOption) => {
    if (DEBUG.FILTERS) console.log(`Setting filter option: ${option}`);
    setFilters((prev: FilterState) => ({ ...prev, filterOption: option }));
  };

  const filterPlayers = useMemo(() => (players: Player[]): Player[] => {
    if (DEBUG.FILTERS) console.log('Filtering players with current filters:', filters);

    return players
      .filter(player => {
        // Position filter
        if (filters.positions.size > 0 && !filters.positions.has(player.position)) {
          return false;
        }

        // Search term filter
        if (filters.searchTerm && !player.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
          return false;
        }

        // Points range filter
        if (player.points < filters.minPoints || player.points > filters.maxPoints) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case SORT_OPTIONS.NAME:
            comparison = a.name.localeCompare(b.name);
            break;
          case SORT_OPTIONS.POINTS:
            comparison = a.points - b.points;
            break;
          case SORT_OPTIONS.PROJECTED:
            comparison = a.projectedPoints - b.projectedPoints;
            break;
          case SORT_OPTIONS.POSITION:
            comparison = a.position.localeCompare(b.position);
            break;
          case SORT_OPTIONS.TEAM:
            comparison = a.team.localeCompare(b.team);
            break;
        }
        return filters.sortAscending ? comparison : -comparison;
      });
  }, [filters]);

  return {
    filters,
    setPositionFilter,
    setSearchTerm,
    setSortBy,
    toggleSortDirection,
    setPointsRange,
    setFilterOption,
    filterPlayers
  };
} 