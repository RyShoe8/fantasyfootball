/**
 * Global Type Declarations
 * 
 * Type declarations for external modules and global types.
 */

// React and Next.js module declarations
declare module 'react' {
  export = React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export default any;
}

declare module 'next/app' {
  import { AppProps } from 'next/app';
  export default function App(props: AppProps): JSX.Element;
}

declare module 'next/router' {
  import { Router } from 'next/router';
  export function useRouter(): Router;
}

declare module 'next/link' {
  import { LinkProps } from 'next/link';
  export default function Link(props: LinkProps): JSX.Element;
}

// JSX Intrinsic Elements
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Context module declarations
declare module '../contexts/auth' {
  import { SleeperUser } from './sleeper';
  export function useAuth(): {
    user: SleeperUser | null;
    login: (username: string) => Promise<void>;
    logout: () => void;
  };
}

declare module '../contexts/league' {
  import { SleeperLeague, SleeperRoster } from './sleeper';
  export function useLeague(): {
    currentLeague: SleeperLeague | null;
    rosters: SleeperRoster[];
  };
}

declare module '../contexts/player' {
  import { SleeperPlayer } from './sleeper';
  import { PlayerStats } from './player';
  export function usePlayer(): {
    players: Record<string, SleeperPlayer>;
    playerStats: Record<string, PlayerStats>;
    isLoading: boolean;
  };
}

declare module '../contexts/roster' {
  import { Roster } from './roster';
  import { ApiError } from './api';
  export function useRoster(): {
    rosters: Roster[];
    loading: boolean;
    error: ApiError | null;
    refreshRosters: (leagueId: string) => Promise<void>;
  };
}

// Extend SleeperPlayer interface to include projected_pts
declare module './sleeper' {
  interface SleeperPlayer {
    projected_pts?: number;
  }
} 