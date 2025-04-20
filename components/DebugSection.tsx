import React, { useState } from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import axios from 'axios';

export default function DebugSection() {
  const { currentLeague, fetchRosters, fetchUsers, fetchPlayers, fetchDraftPicks } = useSleeper();
  const [apiResponse, setApiResponse] = useState<any>(null);

  const handleFetchRosters = async () => {
    if (!currentLeague) return;
    const response = await fetchRosters(currentLeague.league_id);
    setApiResponse(response);
  };

  const handleFetchUsers = async () => {
    if (!currentLeague) return;
    const response = await fetchUsers(currentLeague.league_id);
    setApiResponse(response);
  };

  const handleFetchPlayers = async () => {
    if (!currentLeague) return;
    const response = await fetchPlayers(currentLeague.league_id);
    setApiResponse(response);
  };

  const handleFetchDraftPicks = async () => {
    if (!currentLeague) return;
    const response = await fetchDraftPicks(currentLeague.league_id);
    setApiResponse(response);
  };

  const handleFetchLeague = async () => {
    if (!currentLeague) return;
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/league/${currentLeague.league_id}`);
      console.log('League API Response:', response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching league:', error);
      setApiResponse('Error fetching league');
    }
  };

  if (!currentLeague) return null;

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug Section</h3>
      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleFetchRosters}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fetch Rosters
        </button>
        <button
          onClick={handleFetchUsers}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fetch Users
        </button>
        <button
          onClick={handleFetchPlayers}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fetch Players
        </button>
        <button
          onClick={handleFetchDraftPicks}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fetch Draft Picks
        </button>
        <button
          onClick={handleFetchLeague}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fetch League
        </button>
      </div>
      {apiResponse && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">API Response:</h4>
          <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 