import React, { createContext, useContext, useState, useEffect } from 'react';
import { SleeperService } from '../services/sleeperService';
import { SleeperLeague, SleeperRoster, SleeperUser } from '../types/sleeper';

interface SleeperContextType {
  service: SleeperService | null;
  user: SleeperUser | null;
  leagues: SleeperLeague[];
  currentLeague: SleeperLeague | null;
  rosters: SleeperRoster[];
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
  isLoading: false,
  error: null,
  setCurrentLeague: () => {},
  initialize: async () => {},
});

export const useSleeper = () => useContext(SleeperContext);

export const SleeperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [service, setService] = useState<SleeperService | null>(null);
  const [user, setUser] = useState<SleeperUser | null>(null);
  const [leagues, setLeagues] = useState<SleeperLeague[]>([]);
  const [currentLeague, setCurrentLeague] = useState<SleeperLeague | null>(null);
  const [rosters, setRosters] = useState<SleeperRoster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = async (username: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const sleeperService = new SleeperService(username);
      await sleeperService.initialize();
      setService(sleeperService);

      const userData = await sleeperService.getUser();
      setUser(userData);

      const leaguesData = await sleeperService.getLeagues();
      setLeagues(leaguesData);

      if (leaguesData.length > 0) {
        setCurrentLeague(leaguesData[0]);
        const rostersData = await sleeperService.getRosters(leaguesData[0].league_id);
        setRosters(rostersData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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