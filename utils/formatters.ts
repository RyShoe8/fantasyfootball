/**
 * Utility functions for formatting data
 */

// Format points to display with one decimal place
export const formatPoints = (points: number | undefined): string => {
  if (points === undefined) return '-';
  return points.toFixed(1);
};

// Format position names for display
export const formatPosition = (position: string): string => {
  const positionMap: Record<string, string> = {
    QB: 'Quarterback',
    RB: 'Running Back',
    WR: 'Wide Receiver',
    TE: 'Tight End',
    K: 'Kicker',
    DEF: 'Defense',
    DL: 'Defensive Line',
    LB: 'Linebacker',
    DB: 'Defensive Back'
  };
  return positionMap[position] || position;
};

// Format team names for display
export const formatTeamName = (teamName: string | undefined, ownerName?: string): string => {
  if (!teamName) {
    return ownerName ? formatOwnerName(ownerName) : 'Unknown Team';
  }
  
  // If the team name is just the owner's name, format it nicely
  if (ownerName && teamName.toLowerCase() === ownerName.toLowerCase()) {
    return formatOwnerName(ownerName);
  }
  
  // Format the team name
  return teamName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
};

// Format owner names for display
export const formatOwnerName = (ownerName: string): string => {
  if (!ownerName) return 'Unknown Owner';
  return ownerName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
};

// Format season year for display
export const formatSeason = (season: string): string => {
  const year = parseInt(season);
  return isNaN(year) ? season : `${year} Season`;
};

// Format record for display (wins-losses-ties)
export const formatRecord = (wins: number, losses: number, ties: number): string => {
  return `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;
};

// Format percentage for display
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

// Format date for display
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}; 