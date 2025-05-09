export interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  teamImage?: string;
  streak?: string;
}

export interface PlayerStats {
  playerId: string;
  name: string;
  position: string;
  team: string;
  points: number;
  rank: number;
  playerImage?: string;
  playerName?: string;
  projectedPoints?: number;
}

export interface DashboardData {
  standings: TeamStanding[];
  topPlayers: PlayerStats[];
  recentTransactions: any[];
  leagueInfo: any;
  seasonNumber?: number;
  rosterBreakdown?: {
    totalStarters: number;
    positions: Record<string, number>;
    benchSpots: number;
    taxiSpots: number;
    irSpots: number;
  };
  tradeDeadline?: {
    week: number;
    date: Date;
  };
  playoffInfo?: {
    teams: number;
    startDate: Date;
    format: string;
  };
  starters?: PlayerStats[];
}
