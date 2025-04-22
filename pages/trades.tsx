/**
 * Trades Page
 * 
 * This page allows users to evaluate potential trades between their team and other teams in the league.
 * It calculates the total points from the previous season and projected points for the upcoming season
 * to help users make informed trading decisions.
 * 
 * Key features:
 * - Select players from your roster to include in a trade
 * - Choose another team from your league
 * - Select players from the other team to include in the trade
 * - View total points comparison between both sides
 * - See projected points comparison for the upcoming season
 */

/** @jsxImportSource react */
import React from 'react';
import { useRouter } from 'next/router';
import type { SleeperRoster, SleeperUser, SleeperPlayer, SleeperDraftPick } from '../types/sleeper';
import type { PlayerStats } from '../types/player';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league/LeagueContext';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';

interface TradePlayer extends SleeperPlayer {
  pts_ppr?: number;
  pts_std?: number;
  projected_pts?: number;
}

interface SimpleDraftPick {
  season: string;
  round: number;
  pick_no: number;
}

interface TradeSide {
  players: TradePlayer[];
  draftPicks: SimpleDraftPick[];
  totalProjectedPoints: number;
  totalPoints: number;
}

const TradesPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLeague, users, draftPicks } = useLeague();
  const { players } = usePlayer();
  const { rosters } = useRoster();
  const router = useRouter();
  const [myTeam, setMyTeam] = React.useState<string>('');
  const [theirTeam, setTheirTeam] = React.useState<string>('');
  const [selectedTeam, setSelectedTeam] = React.useState<string>('');

  const [mySide, setMySide] = React.useState<TradeSide>({
    players: [],
    draftPicks: [],
    totalProjectedPoints: 0,
    totalPoints: 0
  });

  const [theirSide, setTheirSide] = React.useState<TradeSide>({
    players: [],
    draftPicks: [],
    totalProjectedPoints: 0,
    totalPoints: 0
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTeamRoster, setSelectedTeamRoster] = React.useState<SleeperRoster | null>(null);

  // Check if we have the necessary data, redirect if not
  React.useEffect(() => {
    // If we don't have rosters or players data, show loading state
    if ((!rosters || rosters.length === 0) || !players || Object.keys(players).length === 0) {
      console.log('Trades page: Waiting for data...', {
        hasRosters: !!rosters && rosters.length > 0,
        hasPlayers: !!players && Object.keys(players).length > 0
      });
      setIsLoading(true);
      return;
    }
    
    // If we have the data, we're no longer loading
    setIsLoading(false);
  }, [rosters, players]);

  const currentRoster = React.useMemo(() => {
    if (!user || !rosters) return null;
    return rosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
  }, [user, rosters]);

  const availablePlayers = React.useMemo(() => {
    const currentRoster = rosters.find((r: SleeperRoster) => r.roster_id === selectedTeam);
    if (!currentRoster) return [];
    
    const playersArray = Object.values(players) as SleeperPlayer[];
    const filteredPlayers = playersArray.filter((p: SleeperPlayer) => 
      currentRoster.players.includes(p.player_id) && 
      !mySide.players.some((tp: TradePlayer) => tp.player_id === p.player_id) &&
      !theirSide.players.some((tp: TradePlayer) => tp.player_id === p.player_id)
    );
    
    return filteredPlayers.map((p: SleeperPlayer) => ({
      ...p,
      pts_ppr: p.pts_ppr || 0,
      pts_std: (p.stats?.pts_standard || 0),
      projected_pts: p.projected_pts || 0
    }));
  }, [rosters, selectedTeam, players, mySide.players, theirSide.players]);

  const selectedTeamPlayers = React.useMemo(() => {
    const currentRoster = rosters.find((r: SleeperRoster) => r.roster_id === selectedTeam);
    if (!currentRoster) return [];
    
    const playersArray = Object.values(players) as SleeperPlayer[];
    const filteredPlayers = playersArray.filter((p: SleeperPlayer) => 
      currentRoster.players.includes(p.player_id) && 
      !mySide.players.some((tp: TradePlayer) => tp.player_id === p.player_id) &&
      !theirSide.players.some((tp: TradePlayer) => tp.player_id === p.player_id)
    );
    
    return filteredPlayers.map((p: SleeperPlayer) => ({
      ...p,
      pts_ppr: p.pts_ppr || 0,
      pts_std: (p.stats?.pts_standard || 0),
      projected_pts: p.projected_pts || 0
    }));
  }, [rosters, selectedTeam, players, mySide.players, theirSide.players]);

  const handleAddPlayer = (player: SleeperPlayer, side: 'my' | 'their') => {
    const tradePlayer: TradePlayer = {
      ...player,
      pts_ppr: player.pts_ppr || 0,
      pts_std: 0
    };

    if (side === 'my') {
      setMySide((prev: TradeSide) => ({
        ...prev,
        players: [...prev.players, tradePlayer]
      }));
    } else {
      setTheirSide((prev: TradeSide) => ({
        ...prev,
        players: [...prev.players, tradePlayer]
      }));
    }
  };

  const handleRemovePlayer = (playerId: string, side: 'my' | 'their') => {
    if (side === 'my') {
      setMySide((prev: TradeSide) => ({
        ...prev,
        players: prev.players.filter((p: TradePlayer) => p.player_id !== playerId)
      }));
    } else {
      setTheirSide((prev: TradeSide) => ({
        ...prev,
        players: prev.players.filter((p: TradePlayer) => p.player_id !== playerId)
      }));
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>, side: 'my' | 'their') => {
    const teamId = e.target.value;
    if (side === 'my') {
      setSelectedTeam(teamId);
      setMySide((prev: TradeSide) => ({ ...prev, players: [] }));
    } else {
      setSelectedTeam(teamId);
      setTheirSide((prev: TradeSide) => ({ ...prev, players: [] }));
    }
    
    // Find the selected team's roster
    const teamRoster = rosters?.find((r: SleeperRoster) => r.roster_id === teamId);
    setSelectedTeamRoster(teamRoster || null);
  };

  const handleMyTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleTeamChange(e, 'my');
  };

  const handleTheirTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleTeamChange(e, 'their');
  };

  const handleAddDraftPick = (pick: SimpleDraftPick, side: 'my' | 'their') => {
    if (side === 'my') {
      setMySide((prev: TradeSide) => ({
        ...prev,
        draftPicks: [...prev.draftPicks, pick]
      }));
    } else {
      setTheirSide((prev: TradeSide) => ({
        ...prev,
        draftPicks: [...prev.draftPicks, pick]
      }));
    }
  };

  const handleRemoveDraftPick = (pick: SimpleDraftPick) => {
    if (selectedTeam === myTeam) {
      setMySide((prev: TradeSide) => ({
        ...prev,
        draftPicks: prev.draftPicks.filter((p: SimpleDraftPick) => 
          p.season !== pick.season || p.round !== pick.round || p.pick_no !== pick.pick_no
        )
      }));
    } else {
      setTheirSide((prev: TradeSide) => ({
        ...prev,
        draftPicks: prev.draftPicks.filter((p: SimpleDraftPick) => 
          p.season !== pick.season || p.round !== pick.round || p.pick_no !== pick.pick_no
        )
      }));
    }
  };

  const mySideStats: TradeSide = {
    players: mySide.players,
    draftPicks: mySide.draftPicks,
    totalProjectedPoints: mySide.players.reduce((sum: number, p: TradePlayer) => {
      const projectedPoints = p.stats?.projected_pts || 0;
      return sum + projectedPoints;
    }, 0),
    totalPoints: mySide.players.reduce((sum: number, p: TradePlayer) => sum + (p.pts_ppr || 0), 0)
  };

  const theirSideStats: TradeSide = {
    players: theirSide.players,
    draftPicks: theirSide.draftPicks,
    totalProjectedPoints: theirSide.players.reduce((sum: number, p: TradePlayer) => {
      const projectedPoints = p.stats?.projected_pts || 0;
      return sum + projectedPoints;
    }, 0),
    totalPoints: theirSide.players.reduce((sum: number, p: TradePlayer) => sum + (p.pts_ppr || 0), 0)
  };

  const getPlayerValue = (player: SleeperPlayer): number => {
    if (!player) return 0;
    return player.projected_pts || player.pts_ppr || 0;
  };

  const getTradeValue = (side: TradeSide) => {
    const playerValue = side.players.reduce((total, p) => {
      return total + (p.projected_pts || 0) + (p.pts_ppr || 0);
    }, 0);

    const pickValue = side.draftPicks.reduce((total, pick) => {
      // Simple draft pick valuation - can be enhanced
      return total + 100; // Base value for any draft pick
    }, 0);

    return playerValue + pickValue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trade evaluator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Trade Evaluator</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* My Team Side */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">My Team</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Team
              </label>
              <select
                value={myTeam}
                onChange={handleMyTeamChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a team</option>
                {rosters?.map((roster: SleeperRoster) => (
                  <option key={roster.roster_id} value={roster.roster_id}>
                    {users?.find((user: SleeperUser) => user.user_id === roster.owner_id)?.display_name || 'Unknown Team'}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Selected Players</h3>
              <div className="space-y-2">
                {mySide.players.map((player: TradePlayer) => (
                  <div key={player.player_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{player.full_name}</span>
                    <button
                      onClick={() => handleRemovePlayer(player.player_id, 'my')}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Available Players</h3>
              <div className="space-y-2">
                {availablePlayers.map((player: TradePlayer) => (
                  <div key={player.player_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{player.full_name}</span>
                    <button
                      onClick={() => handleAddPlayer(player, 'my')}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-medium mb-2">Trade Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Points (Last Season)</p>
                  <p className="text-lg font-semibold">{mySideStats.totalPoints.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Projected Points</p>
                  <p className="text-lg font-semibold">{mySideStats.totalProjectedPoints.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Their Team Side */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Their Team</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Their Team
              </label>
              <select
                value={theirTeam}
                onChange={handleTheirTeamChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a team</option>
                {rosters?.map((roster: SleeperRoster) => (
                  <option key={roster.roster_id} value={roster.roster_id}>
                    {users?.find((user: SleeperUser) => user.user_id === roster.owner_id)?.display_name || 'Unknown Team'}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Selected Players</h3>
              <div className="space-y-2">
                {theirSide.players.map((player: TradePlayer) => (
                  <div key={player.player_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{player.full_name}</span>
                    <button
                      onClick={() => handleRemovePlayer(player.player_id, 'their')}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Available Players</h3>
              <div className="space-y-2">
                {selectedTeamPlayers.map((player: TradePlayer) => (
                  <div key={player.player_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{player.full_name}</span>
                    <button
                      onClick={() => handleAddPlayer(player, 'their')}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-medium mb-2">Trade Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Points (Last Season)</p>
                  <p className="text-lg font-semibold">{theirSideStats.totalPoints.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Projected Points</p>
                  <p className="text-lg font-semibold">{theirSideStats.totalProjectedPoints.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Analysis */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Trade Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-2">Points Comparison</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Last Season Points Difference</p>
                  <p className={`text-lg font-semibold ${mySideStats.totalPoints - theirSideStats.totalPoints > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(mySideStats.totalPoints - theirSideStats.totalPoints).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Projected Points Difference</p>
                  <p className={`text-lg font-semibold ${mySideStats.totalProjectedPoints - theirSideStats.totalProjectedPoints > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(mySideStats.totalProjectedPoints - theirSideStats.totalProjectedPoints).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Trade Value</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">My Side Value</p>
                  <p className="text-lg font-semibold">{getTradeValue(mySide).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Their Side Value</p>
                  <p className="text-lg font-semibold">{getTradeValue(theirSide).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Value Difference</p>
                  <p className={`text-lg font-semibold ${getTradeValue(mySide) - getTradeValue(theirSide) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(getTradeValue(mySide) - getTradeValue(theirSide)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradesPage; 