import React, { useState } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import axios from 'axios';

export default function DebugSection() {
  const { currentLeague } = useSleeper();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchRosters = async () => {
    if (!currentLeague) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/league/${currentLeague.league_id}/rosters`);
      console.log('Rosters API Response:', response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching rosters:', error);
      setError('Error fetching rosters');
      setApiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchUsers = async () => {
    if (!currentLeague) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/league/${currentLeague.league_id}/users`);
      console.log('Users API Response:', response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error fetching users');
      setApiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPlayers = async () => {
    if (!currentLeague) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://api.sleeper.app/v1/players/nfl');
      console.log('Players API Response:', response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError('Error fetching players');
      setApiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDraftPicks = async () => {
    if (!currentLeague) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/draft/${currentLeague.league_id}/picks`);
      console.log('Draft Picks API Response:', response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching draft picks:', error);
      setError('Error fetching draft picks');
      setApiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLeague = async () => {
    if (!currentLeague) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/league/${currentLeague.league_id}`);
      console.log('League API Response:', response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching league:', error);
      setError('Error fetching league');
      setApiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  if (!currentLeague) return null;

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug Section</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleFetchRosters}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Rosters'}
        </button>
        <button
          onClick={handleFetchUsers}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Users'}
        </button>
        <button
          onClick={handleFetchPlayers}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Players'}
        </button>
        <button
          onClick={handleFetchDraftPicks}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Draft Picks'}
        </button>
        <button
          onClick={handleFetchLeague}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch League'}
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