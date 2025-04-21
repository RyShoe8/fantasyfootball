import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';
import type { SleeperLeague } from '../types/sleeper';

export default function DebugSection() {
  const { currentLeague } = useLeague();
  const { setRosters } = useRoster();
  const { setUsers } = useLeague();
  const { setPlayers, fetchPlayerStats } = usePlayer();
  const { selectedYear, selectedWeek } = useLeague();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const fetchData = async (endpoint: string, buttonName: string) => {
    if (!currentLeague) return;
    
    setLoading(true);
    setError(null);
    setActiveButton(buttonName);
    
    try {
      let url = '';
      
      switch (endpoint) {
        case 'rosters':
          url = `https://api.sleeper.app/v1/league/${currentLeague.league_id}/rosters`;
          break;
        case 'users':
          url = `https://api.sleeper.app/v1/league/${currentLeague.league_id}/users`;
          break;
        case 'players':
          url = 'https://api.sleeper.app/v1/players/nfl';
          break;
        case 'draftPicks':
          url = `https://api.sleeper.app/v1/draft/${currentLeague.league_id}/picks`;
          break;
        case 'league':
          url = `https://api.sleeper.app/v1/league/${currentLeague.league_id}`;
          break;
        case 'playerStats':
          await fetchPlayerStats(selectedYear, selectedWeek);
          return;
        default:
          throw new Error('Invalid endpoint');
      }
      
      console.log(`Fetching ${endpoint} from:`, url);
      const response = await axios.get(url);
      console.log(`${endpoint} API Response:`, response.data);
      
      // Update the global state based on the endpoint
      switch (endpoint) {
        case 'rosters':
          setRosters(response.data);
          break;
        case 'users':
          setUsers(response.data);
          break;
        case 'players':
          setPlayers(response.data);
          break;
        case 'draftPicks':
          // TODO: Add draft picks context
          break;
      }
      
      setApiResponse(response.data);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      setError(`Error fetching ${endpoint}`);
      setApiResponse(null);
    } finally {
      setLoading(false);
      setActiveButton(null);
    }
  };

  if (!currentLeague) return null;

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug Section</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => fetchData('rosters', 'rosters')}
          className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading && activeButton === 'rosters' ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading && activeButton === 'rosters' ? 'Loading...' : 'Fetch Rosters'}
        </button>
        <button
          onClick={() => fetchData('users', 'users')}
          className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading && activeButton === 'users' ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading && activeButton === 'users' ? 'Loading...' : 'Fetch Users'}
        </button>
        <button
          onClick={() => fetchData('players', 'players')}
          className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading && activeButton === 'players' ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading && activeButton === 'players' ? 'Loading...' : 'Fetch Players'}
        </button>
        <button
          onClick={() => fetchData('draftPicks', 'draftPicks')}
          className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading && activeButton === 'draftPicks' ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading && activeButton === 'draftPicks' ? 'Loading...' : 'Fetch Draft Picks'}
        </button>
        <button
          onClick={() => fetchData('league', 'league')}
          className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading && activeButton === 'league' ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading && activeButton === 'league' ? 'Loading...' : 'Fetch League'}
        </button>
        <button
          onClick={() => fetchData('playerStats', 'playerStats')}
          className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading && activeButton === 'playerStats' ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading && activeButton === 'playerStats' ? 'Loading...' : 'Fetch Player Stats'}
        </button>
      </div>
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      {apiResponse && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">API Response:</h4>
          <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 