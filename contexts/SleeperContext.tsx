import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SleeperService } from '../services/sleeperService';
import { SleeperUser, SleeperLeague, SleeperRoster, SleeperPlayer } from '../types/sleeper';
import axios from 'axios';

interface SleeperContextType {
  service: SleeperService | null;
  user: SleeperUser | null;
  leagues: SleeperLeague[];
  currentLeague: SleeperLeague | null;
  rosters: SleeperRoster[];
  players: Record<string, SleeperPlayer>;
  isLoading: boolean;
  error: string | null;
  setCurrentLeague: (league: SleeperLeague) => void;
  initialize: (username: string) => Promise<void>;
}

const SleeperContext = createContext<SleeperContextType>({
  service: null,
  user: null,
  leagues: [],
  currentLeague: null,
  rosters: [],
  players: {},
  isLoading: false,
  error: null,
  setCurrentLeague: () => {},
  initialize: async () => {},
});

export const useSleeper = () => useContext(SleeperContext);

export const SleeperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [service, setService] = useState<SleeperService | null>(null);
  const [user, setUser] = useState<SleeperUser | null>(null);
  const [leagues, setLeagues] = useState<SleeperLeague[]>([]);
  const [currentLeague, setCurrentLeague] = useState<SleeperLeague | null>(null);
  const [rosters, setRosters] = useState<SleeperRoster[]>([]);
  const [players, setPlayers] = useState<Record<string, SleeperPlayer>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = async (username: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Initializing Sleeper service for username:', username);
      const sleeperService = new SleeperService(username);
      await sleeperService.initialize();
      setService(sleeperService);

      console.log('Fetching user data...');
      const userData = await sleeperService.getUser();
      console.log('User data:', userData);
      setUser(userData);

      console.log('Fetching leagues data...');
      const leaguesData = await sleeperService.getLeagues();
      console.log('Leagues data:', leaguesData);
      setLeagues(leaguesData);

      console.log('Fetching players data...');
      const playersData = await sleeperService.getPlayers();
      console.log('Players data loaded:', Object.keys(playersData).length, 'players');
      setPlayers(playersData);

      if (leaguesData.length > 0) {
        console.log('Setting current league:', leaguesData[0]);
        setCurrentLeague(leaguesData[0]);
        console.log('Fetching rosters data...');
        const rostersData = await sleeperService.getRosters(leaguesData[0].league_id);
        console.log('Rosters data:', rostersData);
        setRosters(rostersData);
      }
    } catch (error: unknown) {
      console.error('Error initializing Sleeper service:', error);
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || 'Network request failed';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentLeague) {
      const fetchRosters = async () => {
        try {
          setIsLoading(true);
          const rostersData = await service?.getRosters(currentLeague.league_id);
          if (rostersData) {
            setRosters(rostersData);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setIsLoading(false);
        }
      };

      fetchRosters();
    }
  }, [currentLeague, service]);

  return (
    <SleeperContext.Provider
      value={{
        service,
        user,
        leagues,
        currentLeague,
        rosters,
        players,
        isLoading,
        error,
        setCurrentLeague,
        initialize,
      }}
    >
      {children}
    </SleeperContext.Provider>
  );
}; 